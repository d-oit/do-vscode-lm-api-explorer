#!/bin/bash

# Repository Setup Script for CI/CD Deployment
# This script automates the repository configuration for the enhanced CI/CD workflows

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_header() {
    echo -e "\n${BLUE}=== $1 ===${NC}"
}

# Check if GitHub CLI is installed
check_gh_cli() {
    if ! command -v gh &> /dev/null; then
        print_error "GitHub CLI (gh) is not installed. Please install it first:"
        echo "  - macOS: brew install gh"
        echo "  - Ubuntu: sudo apt install gh"
        echo "  - Windows: winget install GitHub.cli"
        exit 1
    fi
    
    # Check if authenticated
    if ! gh auth status &> /dev/null; then
        print_error "GitHub CLI is not authenticated. Please run: gh auth login"
        exit 1
    fi
    
    print_success "GitHub CLI is installed and authenticated"
}

# Get repository information
get_repo_info() {
    REPO_OWNER=$(gh repo view --json owner --jq '.owner.login')
    REPO_NAME=$(gh repo view --json name --jq '.name')
    REPO_FULL_NAME="$REPO_OWNER/$REPO_NAME"
    
    print_info "Repository: $REPO_FULL_NAME"
}

# Check if user has admin access
check_admin_access() {
    PERMISSION=$(gh api repos/$REPO_FULL_NAME --jq '.permissions.admin')
    if [ "$PERMISSION" != "true" ]; then
        print_error "You need admin access to configure this repository"
        exit 1
    fi
    print_success "Admin access confirmed"
}

# Configure repository secrets
setup_secrets() {
    print_header "Setting up Repository Secrets"
    
    # Check if VSCE_PAT exists
    if gh secret list | grep -q "VSCE_PAT"; then
        print_success "VSCE_PAT secret already exists"
    else
        print_warning "VSCE_PAT secret not found"
        echo ""
        echo "To publish to VS Code Marketplace, you need a Personal Access Token:"
        echo "1. Go to: https://marketplace.visualstudio.com/manage"
        echo "2. Sign in with your Microsoft account"
        echo "3. Go to your publisher profile > Personal Access Tokens"
        echo "4. Create new token with 'Marketplace (Manage)' scope"
        echo ""
        read -p "Do you want to set VSCE_PAT now? (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            read -s -p "Enter your VSCE_PAT token: " VSCE_TOKEN
            echo
            echo "$VSCE_TOKEN" | gh secret set VSCE_PAT
            print_success "VSCE_PAT secret configured"
        else
            print_warning "VSCE_PAT not configured - marketplace publishing will fail"
        fi
    fi
    
    # Optional: Slack webhook
    if gh secret list | grep -q "SLACK_WEBHOOK_URL"; then
        print_success "SLACK_WEBHOOK_URL secret already exists"
    else
        read -p "Do you want to configure Slack notifications? (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            read -p "Enter Slack webhook URL: " SLACK_URL
            echo "$SLACK_URL" | gh secret set SLACK_WEBHOOK_URL
            print_success "SLACK_WEBHOOK_URL secret configured"
        fi
    fi
}

# Configure branch protection
setup_branch_protection() {
    print_header "Setting up Branch Protection"
    
    # Main branch protection
    print_info "Configuring main branch protection..."
    
    # Check if protection already exists
    if gh api repos/$REPO_FULL_NAME/branches/main/protection &> /dev/null; then
        print_warning "Main branch protection already exists"
        read -p "Do you want to update it? (y/n): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            return
        fi
    fi
    
    # Configure main branch protection
    gh api repos/$REPO_FULL_NAME/branches/main/protection \
        --method PUT \
        --field required_status_checks='{"strict":true,"contexts":["test"]}' \
        --field enforce_admins=true \
        --field required_pull_request_reviews='{"required_approving_review_count":1,"dismiss_stale_reviews":true,"require_code_owner_reviews":false}' \
        --field restrictions=null \
        --field allow_force_pushes=false \
        --field allow_deletions=false \
        --field block_creations=false \
        --field required_conversation_resolution=true \
        > /dev/null
    
    print_success "Main branch protection configured"
    
    # Dev branch protection (optional)
    read -p "Do you want to configure dev branch protection? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        # Check if dev branch exists
        if gh api repos/$REPO_FULL_NAME/branches/dev &> /dev/null; then
            gh api repos/$REPO_FULL_NAME/branches/dev/protection \
                --method PUT \
                --field required_status_checks='{"strict":true,"contexts":["test"]}' \
                --field enforce_admins=false \
                --field required_pull_request_reviews=null \
                --field restrictions=null \
                > /dev/null
            print_success "Dev branch protection configured"
        else
            print_warning "Dev branch does not exist - skipping protection setup"
        fi
    fi
}

# Configure repository settings
setup_repository_settings() {
    print_header "Configuring Repository Settings"
    
    # Enable features
    print_info "Enabling repository features..."
    
    gh api repos/$REPO_FULL_NAME \
        --method PATCH \
        --field has_issues=true \
        --field has_projects=true \
        --field has_wiki=true \
        --field has_discussions=true \
        --field delete_branch_on_merge=true \
        --field allow_squash_merge=true \
        --field allow_merge_commit=false \
        --field allow_rebase_merge=false \
        > /dev/null
    
    print_success "Repository features configured"
    
    # Configure default branch
    gh api repos/$REPO_FULL_NAME \
        --method PATCH \
        --field default_branch=main \
        > /dev/null
    
    print_success "Default branch set to main"
}

# Enable security features
setup_security() {
    print_header "Enabling Security Features"
    
    # Enable vulnerability alerts
    gh api repos/$REPO_FULL_NAME/vulnerability-alerts \
        --method PUT \
        > /dev/null 2>&1 || print_warning "Could not enable vulnerability alerts (may already be enabled)"
    
    # Enable automated security fixes
    gh api repos/$REPO_FULL_NAME/automated-security-fixes \
        --method PUT \
        > /dev/null 2>&1 || print_warning "Could not enable automated security fixes (may already be enabled)"
    
    print_success "Security features enabled"
}

# Create issue templates
create_issue_templates() {
    print_header "Creating Issue Templates"
    
    mkdir -p .github/ISSUE_TEMPLATE
    
    # Bug report template
    cat > .github/ISSUE_TEMPLATE/bug_report.yml << 'EOF'
name: Bug Report
description: File a bug report
title: "[Bug]: "
labels: ["bug", "triage"]
body:
  - type: markdown
    attributes:
      value: |
        Thanks for taking the time to fill out this bug report!
  - type: input
    id: contact
    attributes:
      label: Contact Details
      description: How can we get in touch with you if we need more info?
      placeholder: ex. email@example.com
    validations:
      required: false
  - type: textarea
    id: what-happened
    attributes:
      label: What happened?
      description: Also tell us, what did you expect to happen?
      placeholder: Tell us what you see!
    validations:
      required: true
  - type: input
    id: version
    attributes:
      label: Extension Version
      description: What version of the extension are you using?
      placeholder: ex. 0.8.6
    validations:
      required: true
  - type: input
    id: vscode-version
    attributes:
      label: VS Code Version
      description: What version of VS Code are you using?
      placeholder: ex. 1.85.0
    validations:
      required: true
  - type: textarea
    id: steps
    attributes:
      label: Steps to Reproduce
      description: Please provide step-by-step instructions
      placeholder: |
        1. Go to...
        2. Click on...
        3. See error...
    validations:
      required: true
  - type: textarea
    id: logs
    attributes:
      label: Relevant Log Output
      description: Please copy and paste any relevant log output
      render: shell
EOF

    # Feature request template
    cat > .github/ISSUE_TEMPLATE/feature_request.yml << 'EOF'
name: Feature Request
description: Suggest an idea for this project
title: "[Feature]: "
labels: ["enhancement", "triage"]
body:
  - type: markdown
    attributes:
      value: |
        Thanks for suggesting a new feature!
  - type: textarea
    id: problem
    attributes:
      label: Is your feature request related to a problem?
      description: A clear and concise description of what the problem is
      placeholder: I'm always frustrated when...
    validations:
      required: true
  - type: textarea
    id: solution
    attributes:
      label: Describe the solution you'd like
      description: A clear and concise description of what you want to happen
    validations:
      required: true
  - type: textarea
    id: alternatives
    attributes:
      label: Describe alternatives you've considered
      description: A clear and concise description of any alternative solutions or features you've considered
    validations:
      required: false
  - type: textarea
    id: additional-context
    attributes:
      label: Additional context
      description: Add any other context or screenshots about the feature request here
    validations:
      required: false
EOF

    print_success "Issue templates created"
}

# Create PR template
create_pr_template() {
    print_header "Creating Pull Request Template"
    
    mkdir -p .github
    
    cat > .github/pull_request_template.md << 'EOF'
## Description
Brief description of changes made in this PR.

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update
- [ ] Dependency update
- [ ] Refactoring (no functional changes)

## Testing
- [ ] Tests pass locally (`npm test`)
- [ ] Linting passes (`npm run lint`)
- [ ] Type checking passes (`npm run check-types`)
- [ ] Extension builds successfully (`npm run package`)
- [ ] Manual testing completed
- [ ] Added tests for new functionality (if applicable)

## Screenshots (if applicable)
<!-- Add screenshots to help explain your changes -->

## Checklist
- [ ] Code follows the project's style guidelines
- [ ] Self-review of code completed
- [ ] Code is properly commented, particularly in hard-to-understand areas
- [ ] Documentation updated (if applicable)
- [ ] No new warnings introduced
- [ ] Version bumped (if this is going to main branch)

## Related Issues
<!-- Link any related issues using "Fixes #123" or "Closes #123" -->

## Additional Notes
<!-- Any additional information that reviewers should know -->
EOF

    print_success "Pull request template created"
}

# Create CODEOWNERS file
create_codeowners() {
    print_header "Creating CODEOWNERS File"
    
    mkdir -p .github
    
    cat > .github/CODEOWNERS << EOF
# Global code owners
* @$REPO_OWNER

# Workflow files require admin review
/.github/workflows/ @$REPO_OWNER

# Package.json changes require careful review
package.json @$REPO_OWNER
package-lock.json @$REPO_OWNER
pnpm-lock.yaml @$REPO_OWNER

# Security-sensitive files
/.github/dependabot.yml @$REPO_OWNER
/scripts/ @$REPO_OWNER

# Documentation
*.md @$REPO_OWNER
EOF

    print_success "CODEOWNERS file created"
}

# Create security policy
create_security_policy() {
    print_header "Creating Security Policy"
    
    mkdir -p .github
    
    cat > .github/SECURITY.md << 'EOF'
# Security Policy

## Supported Versions

We actively support the following versions with security updates:

| Version | Supported          |
| ------- | ------------------ |
| 0.8.x   | :white_check_mark: |
| < 0.8   | :x:                |

## Reporting a Vulnerability

We take security vulnerabilities seriously. If you discover a security vulnerability, please follow these steps:

### For Public Issues
- Open an issue in our [GitHub Issues](../../issues)
- Use the "Security" label
- Provide detailed information about the vulnerability

### For Private/Sensitive Issues
- Use GitHub's private vulnerability reporting feature
- Go to the Security tab and click "Report a vulnerability"
- Provide detailed information about the vulnerability

### What to Include
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if you have one)

### Response Timeline
- **Initial Response**: Within 48 hours
- **Status Updates**: Every 72 hours until resolved
- **Resolution**: We aim to resolve critical vulnerabilities within 7 days

### Security Best Practices
- Keep your VS Code and extensions updated
- Review extension permissions before installation
- Report suspicious behavior immediately

Thank you for helping keep our extension secure!
EOF

    print_success "Security policy created"
}

# Verify package.json marketplace metadata
verify_package_metadata() {
    print_header "Verifying Package.json Metadata"
    
    # Check required fields
    REQUIRED_FIELDS=("name" "displayName" "description" "version" "publisher" "engines" "main" "contributes")
    MISSING_FIELDS=()
    
    for field in "${REQUIRED_FIELDS[@]}"; do
        if ! jq -e ".$field" package.json > /dev/null 2>&1; then
            MISSING_FIELDS+=("$field")
        fi
    done
    
    if [ ${#MISSING_FIELDS[@]} -eq 0 ]; then
        print_success "All required package.json fields are present"
    else
        print_error "Missing required package.json fields: ${MISSING_FIELDS[*]}"
        echo "Please add these fields to package.json before publishing"
    fi
    
    # Check if icon exists
    ICON_PATH=$(jq -r '.icon // "images/icon.png"' package.json)
    if [ -f "$ICON_PATH" ]; then
        print_success "Extension icon found: $ICON_PATH"
    else
        print_warning "Extension icon not found: $ICON_PATH"
        echo "Consider adding an icon for better marketplace presentation"
    fi
    
    # Check repository URL
    REPO_URL=$(jq -r '.repository.url // empty' package.json)
    if [ -n "$REPO_URL" ]; then
        print_success "Repository URL configured: $REPO_URL"
    else
        print_warning "Repository URL not configured in package.json"
    fi
}

# Run workflow validation
validate_workflows() {
    print_header "Validating Workflow Files"
    
    WORKFLOW_DIR=".github/workflows"
    if [ ! -d "$WORKFLOW_DIR" ]; then
        print_error "Workflow directory not found: $WORKFLOW_DIR"
        return 1
    fi
    
    VALIDATION_PASSED=true
    
    for workflow in "$WORKFLOW_DIR"/*.yml; do
        if [ -f "$workflow" ]; then
            filename=$(basename "$workflow")
            if python3 -c "import yaml; yaml.safe_load(open('$workflow'))" 2>/dev/null; then
                print_success "Workflow validation passed: $filename"
            else
                print_error "Workflow validation failed: $filename"
                VALIDATION_PASSED=false
            fi
        fi
    done
    
    if [ "$VALIDATION_PASSED" = true ]; then
        print_success "All workflows validated successfully"
    else
        print_error "Some workflows have validation errors"
        return 1
    fi
}

# Generate setup summary
generate_summary() {
    print_header "Setup Summary"
    
    echo ""
    echo "Repository configuration completed for: $REPO_FULL_NAME"
    echo ""
    echo "✅ Configured:"
    echo "   - Repository secrets (VSCE_PAT)"
    echo "   - Branch protection rules"
    echo "   - Security features"
    echo "   - Issue and PR templates"
    echo "   - CODEOWNERS file"
    echo "   - Security policy"
    echo ""
    echo "📋 Next Steps:"
    echo "   1. Verify VSCE_PAT token is valid and has correct permissions"
    echo "   2. Test the workflows with a small change"
    echo "   3. Create a test Dependabot PR to verify auto-merge"
    echo "   4. Perform a test release to verify end-to-end process"
    echo ""
    echo "📚 Documentation:"
    echo "   - Setup Guide: REPOSITORY_SETUP_GUIDE.md"
    echo "   - Workflow Documentation: .github/WORKFLOW_DOCUMENTATION.md"
    echo "   - Testing Report: CI_CD_TESTING_REPORT.md"
    echo ""
    echo "🔗 Useful Links:"
    echo "   - Repository: https://github.com/$REPO_FULL_NAME"
    echo "   - Actions: https://github.com/$REPO_FULL_NAME/actions"
    echo "   - Settings: https://github.com/$REPO_FULL_NAME/settings"
    echo "   - Marketplace: https://marketplace.visualstudio.com/manage"
    echo ""
}

# Main execution
main() {
    print_header "Repository Setup for CI/CD Deployment"
    
    # Prerequisites
    check_gh_cli
    get_repo_info
    check_admin_access
    
    # Configuration steps
    setup_secrets
    setup_branch_protection
    setup_repository_settings
    setup_security
    create_issue_templates
    create_pr_template
    create_codeowners
    create_security_policy
    
    # Validation
    verify_package_metadata
    validate_workflows
    
    # Summary
    generate_summary
    
    print_success "Repository setup completed successfully!"
}

# Run main function
main "$@"
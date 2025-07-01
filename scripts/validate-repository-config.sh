#!/bin/bash

# Repository Configuration Validation Script
# This script checks if the repository is properly configured for CI/CD deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
PASSED=0
FAILED=0
WARNINGS=0

# Function to print colored output
print_pass() {
    echo -e "${GREEN}✅ PASS${NC}: $1"
    ((PASSED++))
}

print_fail() {
    echo -e "${RED}❌ FAIL${NC}: $1"
    ((FAILED++))
}

print_warn() {
    echo -e "${YELLOW}⚠️  WARN${NC}: $1"
    ((WARNINGS++))
}

print_info() {
    echo -e "${BLUE}ℹ️  INFO${NC}: $1"
}

print_header() {
    echo -e "\n${BLUE}=== $1 ===${NC}"
}

# Check if GitHub CLI is available
check_gh_cli() {
    if command -v gh &> /dev/null && gh auth status &> /dev/null; then
        print_pass "GitHub CLI is installed and authenticated"
        return 0
    else
        print_fail "GitHub CLI is not installed or not authenticated"
        return 1
    fi
}

# Get repository information
get_repo_info() {
    if command -v gh &> /dev/null && gh auth status &> /dev/null; then
        REPO_OWNER=$(gh repo view --json owner --jq '.owner.login' 2>/dev/null || echo "unknown")
        REPO_NAME=$(gh repo view --json name --jq '.name' 2>/dev/null || echo "unknown")
        REPO_FULL_NAME="$REPO_OWNER/$REPO_NAME"
        print_info "Repository: $REPO_FULL_NAME"
    else
        print_warn "Cannot get repository info - GitHub CLI not available"
        REPO_FULL_NAME="unknown/unknown"
    fi
}

# Check repository secrets
check_secrets() {
    print_header "Repository Secrets"
    
    if ! command -v gh &> /dev/null || ! gh auth status &> /dev/null; then
        print_warn "Cannot check secrets - GitHub CLI not available"
        return
    fi
    
    # Check VSCE_PAT
    if gh secret list 2>/dev/null | grep -q "VSCE_PAT"; then
        print_pass "VSCE_PAT secret is configured"
    else
        print_fail "VSCE_PAT secret is missing (required for marketplace publishing)"
    fi
    
    # Check optional secrets
    if gh secret list 2>/dev/null | grep -q "SLACK_WEBHOOK_URL"; then
        print_pass "SLACK_WEBHOOK_URL secret is configured"
    else
        print_info "SLACK_WEBHOOK_URL secret not configured (optional)"
    fi
    
    if gh secret list 2>/dev/null | grep -q "TEAMS_WEBHOOK_URL"; then
        print_pass "TEAMS_WEBHOOK_URL secret is configured"
    else
        print_info "TEAMS_WEBHOOK_URL secret not configured (optional)"
    fi
}

# Check branch protection
check_branch_protection() {
    print_header "Branch Protection"
    
    if ! command -v gh &> /dev/null || ! gh auth status &> /dev/null; then
        print_warn "Cannot check branch protection - GitHub CLI not available"
        return
    fi
    
    # Check main branch protection
    if gh api repos/$REPO_FULL_NAME/branches/main/protection &> /dev/null; then
        print_pass "Main branch protection is enabled"
        
        # Check specific protection rules
        PROTECTION=$(gh api repos/$REPO_FULL_NAME/branches/main/protection 2>/dev/null)
        
        if echo "$PROTECTION" | jq -e '.required_status_checks.strict' &> /dev/null; then
            print_pass "Required status checks are configured"
        else
            print_fail "Required status checks are not configured"
        fi
        
        if echo "$PROTECTION" | jq -e '.required_pull_request_reviews' &> /dev/null; then
            print_pass "Pull request reviews are required"
        else
            print_warn "Pull request reviews are not required"
        fi
        
    else
        print_fail "Main branch protection is not enabled"
    fi
    
    # Check dev branch protection
    if gh api repos/$REPO_FULL_NAME/branches/dev/protection &> /dev/null; then
        print_pass "Dev branch protection is enabled"
    else
        print_info "Dev branch protection is not enabled (optional)"
    fi
}

# Check workflow files
check_workflows() {
    print_header "Workflow Files"
    
    WORKFLOW_DIR=".github/workflows"
    if [ ! -d "$WORKFLOW_DIR" ]; then
        print_fail "Workflow directory not found: $WORKFLOW_DIR"
        return
    fi
    
    # Expected workflows
    EXPECTED_WORKFLOWS=(
        "test.yml"
        "auto-merge.yml"
        "main-protection.yml"
        "summary.yml"
        "release.yml"
        "test-release.yml"
    )
    
    for workflow in "${EXPECTED_WORKFLOWS[@]}"; do
        if [ -f "$WORKFLOW_DIR/$workflow" ]; then
            # Check YAML syntax
            if python3 -c "import yaml; yaml.safe_load(open('$WORKFLOW_DIR/$workflow'))" 2>/dev/null; then
                print_pass "Workflow file exists and has valid syntax: $workflow"
            else
                print_fail "Workflow file has invalid YAML syntax: $workflow"
            fi
        else
            print_fail "Missing workflow file: $workflow"
        fi
    done
}

# Check package.json configuration
check_package_json() {
    print_header "Package.json Configuration"
    
    if [ ! -f "package.json" ]; then
        print_fail "package.json file not found"
        return
    fi
    
    # Check required fields for VS Code extension
    REQUIRED_FIELDS=(
        "name"
        "displayName"
        "description"
        "version"
        "publisher"
        "engines"
        "main"
        "contributes"
    )
    
    for field in "${REQUIRED_FIELDS[@]}"; do
        if jq -e ".$field" package.json > /dev/null 2>&1; then
            print_pass "Required field present: $field"
        else
            print_fail "Missing required field: $field"
        fi
    done
    
    # Check VS Code engine version
    ENGINE_VERSION=$(jq -r '.engines.vscode // empty' package.json)
    if [ -n "$ENGINE_VERSION" ]; then
        print_pass "VS Code engine version specified: $ENGINE_VERSION"
    else
        print_fail "VS Code engine version not specified"
    fi
    
    # Check icon
    ICON_PATH=$(jq -r '.icon // "images/icon.png"' package.json)
    if [ -f "$ICON_PATH" ]; then
        print_pass "Extension icon found: $ICON_PATH"
    else
        print_warn "Extension icon not found: $ICON_PATH"
    fi
    
    # Check repository URL
    REPO_URL=$(jq -r '.repository.url // empty' package.json)
    if [ -n "$REPO_URL" ]; then
        print_pass "Repository URL configured: $REPO_URL"
    else
        print_warn "Repository URL not configured"
    fi
    
    # Check categories
    CATEGORIES=$(jq -r '.categories // empty' package.json)
    if [ -n "$CATEGORIES" ]; then
        print_pass "Extension categories configured"
    else
        print_warn "Extension categories not configured"
    fi
}

# Check dependabot configuration
check_dependabot() {
    print_header "Dependabot Configuration"
    
    if [ -f ".github/dependabot.yml" ]; then
        if python3 -c "import yaml; yaml.safe_load(open('.github/dependabot.yml'))" 2>/dev/null; then
            print_pass "Dependabot configuration file exists and has valid syntax"
            
            # Check for npm ecosystem
            if grep -q "npm" .github/dependabot.yml; then
                print_pass "npm ecosystem configured in dependabot"
            else
                print_warn "npm ecosystem not configured in dependabot"
            fi
            
            # Check for github-actions ecosystem
            if grep -q "github-actions" .github/dependabot.yml; then
                print_pass "github-actions ecosystem configured in dependabot"
            else
                print_warn "github-actions ecosystem not configured in dependabot"
            fi
            
        else
            print_fail "Dependabot configuration has invalid YAML syntax"
        fi
    else
        print_fail "Dependabot configuration file not found"
    fi
}

# Check issue and PR templates
check_templates() {
    print_header "Issue and PR Templates"
    
    # Check issue templates
    if [ -d ".github/ISSUE_TEMPLATE" ]; then
        print_pass "Issue template directory exists"
        
        if [ -f ".github/ISSUE_TEMPLATE/bug_report.yml" ]; then
            print_pass "Bug report template exists"
        else
            print_warn "Bug report template not found"
        fi
        
        if [ -f ".github/ISSUE_TEMPLATE/feature_request.yml" ]; then
            print_pass "Feature request template exists"
        else
            print_warn "Feature request template not found"
        fi
    else
        print_warn "Issue template directory not found"
    fi
    
    # Check PR template
    if [ -f ".github/pull_request_template.md" ]; then
        print_pass "Pull request template exists"
    else
        print_warn "Pull request template not found"
    fi
}

# Check security configuration
check_security() {
    print_header "Security Configuration"
    
    # Check CODEOWNERS
    if [ -f ".github/CODEOWNERS" ]; then
        print_pass "CODEOWNERS file exists"
    else
        print_warn "CODEOWNERS file not found"
    fi
    
    # Check security policy
    if [ -f ".github/SECURITY.md" ]; then
        print_pass "Security policy exists"
    else
        print_warn "Security policy not found"
    fi
    
    # Check if security features are enabled (requires GitHub CLI)
    if command -v gh &> /dev/null && gh auth status &> /dev/null; then
        if gh api repos/$REPO_FULL_NAME/vulnerability-alerts &> /dev/null; then
            print_pass "Vulnerability alerts are enabled"
        else
            print_warn "Vulnerability alerts may not be enabled"
        fi
    else
        print_info "Cannot check security features - GitHub CLI not available"
    fi
}

# Check build configuration
check_build() {
    print_header "Build Configuration"
    
    # Check if node_modules exists
    if [ -d "node_modules" ]; then
        print_pass "Dependencies are installed"
    else
        print_warn "Dependencies not installed - run 'npm install'"
    fi
    
    # Check build scripts
    BUILD_SCRIPTS=("lint" "check-types" "compile" "package" "test")
    
    for script in "${BUILD_SCRIPTS[@]}"; do
        if jq -e ".scripts.\"$script\"" package.json > /dev/null 2>&1; then
            print_pass "Build script exists: $script"
        else
            print_fail "Missing build script: $script"
        fi
    done
    
    # Test build commands if dependencies are installed
    if [ -d "node_modules" ]; then
        if npm run lint --silent 2>/dev/null; then
            print_pass "Lint command works"
        else
            print_fail "Lint command fails"
        fi
        
        if npm run check-types --silent 2>/dev/null; then
            print_pass "Type check command works"
        else
            print_fail "Type check command fails"
        fi
    else
        print_info "Skipping build command tests - dependencies not installed"
    fi
}

# Check documentation
check_documentation() {
    print_header "Documentation"
    
    # Check README
    if [ -f "README.md" ]; then
        print_pass "README.md exists"
    else
        print_fail "README.md not found"
    fi
    
    # Check CHANGELOG
    if [ -f "CHANGELOG.md" ]; then
        print_pass "CHANGELOG.md exists"
    else
        print_warn "CHANGELOG.md not found"
    fi
    
    # Check workflow documentation
    if [ -f ".github/WORKFLOW_DOCUMENTATION.md" ]; then
        print_pass "Workflow documentation exists"
    else
        print_warn "Workflow documentation not found"
    fi
    
    # Check setup guide
    if [ -f "REPOSITORY_SETUP_GUIDE.md" ]; then
        print_pass "Repository setup guide exists"
    else
        print_warn "Repository setup guide not found"
    fi
}

# Generate final report
generate_report() {
    print_header "Validation Summary"
    
    TOTAL=$((PASSED + FAILED + WARNINGS))
    
    echo ""
    echo "📊 Validation Results:"
    echo "   ✅ Passed: $PASSED"
    echo "   ❌ Failed: $FAILED"
    echo "   ⚠️  Warnings: $WARNINGS"
    echo "   📝 Total Checks: $TOTAL"
    echo ""
    
    if [ $FAILED -eq 0 ]; then
        if [ $WARNINGS -eq 0 ]; then
            echo -e "${GREEN}🎉 Perfect! Repository is fully configured for CI/CD deployment.${NC}"
            OVERALL_STATUS="READY"
        else
            echo -e "${YELLOW}✅ Good! Repository is ready for CI/CD deployment with minor recommendations.${NC}"
            OVERALL_STATUS="READY_WITH_WARNINGS"
        fi
    else
        echo -e "${RED}❌ Issues found! Please fix the failed checks before deploying.${NC}"
        OVERALL_STATUS="NOT_READY"
    fi
    
    echo ""
    echo "📋 Next Steps:"
    
    if [ $FAILED -gt 0 ]; then
        echo "   1. Fix all failed checks (❌)"
        echo "   2. Address warnings if possible (⚠️)"
        echo "   3. Run validation again"
        echo "   4. Deploy when all critical issues are resolved"
    elif [ $WARNINGS -gt 0 ]; then
        echo "   1. Consider addressing warnings for optimal setup"
        echo "   2. Test workflows with small changes"
        echo "   3. Deploy to production"
    else
        echo "   1. Test workflows with small changes"
        echo "   2. Deploy to production"
        echo "   3. Monitor workflow performance"
    fi
    
    echo ""
    echo "🔗 Useful Commands:"
    echo "   - Setup repository: ./scripts/setup-repository.sh"
    echo "   - Test workflows: git push origin dev"
    echo "   - View actions: gh workflow list"
    echo "   - Check secrets: gh secret list"
    
    # Exit with appropriate code
    if [ "$OVERALL_STATUS" = "NOT_READY" ]; then
        exit 1
    else
        exit 0
    fi
}

# Main execution
main() {
    echo -e "${BLUE}🔍 Repository Configuration Validation${NC}"
    echo "Checking if repository is ready for CI/CD deployment..."
    
    get_repo_info
    
    # Run all checks
    check_gh_cli
    check_secrets
    check_branch_protection
    check_workflows
    check_package_json
    check_dependabot
    check_templates
    check_security
    check_build
    check_documentation
    
    # Generate final report
    generate_report
}

# Run main function
main "$@"
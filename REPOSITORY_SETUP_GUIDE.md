# 🚀 Repository Setup Guide for Live CI/CD Deployment

## Overview
This guide will help you configure your GitHub repository for the enhanced CI/CD workflows we've just implemented and tested.

## Prerequisites Checklist

Before proceeding, ensure you have:
- [ ] Repository admin access
- [ ] VS Code Marketplace publisher account
- [ ] GitHub Personal Access Token with appropriate permissions

## 1. Repository Secrets Configuration

### Required Secrets

#### VSCE_PAT (Critical for Marketplace Publishing)
**Purpose**: Publishes extension to VS Code Marketplace
**How to obtain**:
1. Go to [Visual Studio Marketplace Publisher Management](https://marketplace.visualstudio.com/manage)
2. Sign in with your Microsoft account
3. Click on your publisher profile
4. Go to "Personal Access Tokens"
5. Create new token with **Marketplace (Manage)** scope
6. Copy the token (you won't see it again!)

**How to add to repository**:
```bash
# Via GitHub CLI
gh secret set VSCE_PAT

# Or via GitHub Web UI:
# 1. Go to Settings > Secrets and variables > Actions
# 2. Click "New repository secret"
# 3. Name: VSCE_PAT
# 4. Value: [paste your token]
```

#### GITHUB_TOKEN (Automatically provided)
**Purpose**: GitHub API operations, creating releases
**Status**: ✅ Automatically provided by GitHub Actions
**No action required** - GitHub provides this automatically

### Optional Secrets (for enhanced features)

#### SLACK_WEBHOOK_URL (Optional)
**Purpose**: Send release notifications to Slack
```bash
gh secret set SLACK_WEBHOOK_URL
```

#### TEAMS_WEBHOOK_URL (Optional)
**Purpose**: Send release notifications to Microsoft Teams
```bash
gh secret set TEAMS_WEBHOOK_URL
```

## 2. Branch Protection Rules

### Main Branch Protection (Critical)

Configure protection for the `main` branch:

```bash
# Via GitHub CLI
gh api repos/:owner/:repo/branches/main/protection \
  --method PUT \
  --field required_status_checks='{"strict":true,"contexts":["test"]}' \
  --field enforce_admins=true \
  --field required_pull_request_reviews='{"required_approving_review_count":1,"dismiss_stale_reviews":true}' \
  --field restrictions=null
```

**Or via GitHub Web UI**:
1. Go to **Settings > Branches**
2. Click **Add rule** or edit existing rule for `main`
3. Configure these settings:

#### ✅ Required Settings:
- [x] **Require a pull request before merging**
  - [x] Require approvals: **1**
  - [x] Dismiss stale PR approvals when new commits are pushed
  - [x] Require review from code owners (if CODEOWNERS file exists)
- [x] **Require status checks to pass before merging**
  - [x] Require branches to be up to date before merging
  - [x] Status checks: **test** (from test.yml workflow)
- [x] **Require conversation resolution before merging**
- [x] **Restrict pushes that create files larger than 100MB**

#### ⚠️ Advanced Settings:
- [x] **Include administrators** (recommended for consistency)
- [ ] **Allow force pushes** (keep disabled for safety)
- [ ] **Allow deletions** (keep disabled for safety)

### Dev Branch Protection (Recommended)

Configure lighter protection for the `dev` branch:

1. Go to **Settings > Branches**
2. Click **Add rule** for `dev` branch
3. Configure:
   - [x] **Require status checks to pass before merging**
   - [x] Status checks: **test**
   - [ ] Require pull request reviews (optional for dev)

## 3. Repository Settings Configuration

### General Settings

#### Repository Visibility
- **Recommendation**: Keep as **Public** for open-source VS Code extensions
- **Alternative**: **Private** if this is proprietary

#### Features to Enable
```
✅ Wikis (for additional documentation)
✅ Issues (for bug reports and feature requests)  
✅ Sponsorships (if accepting donations)
✅ Preserve this repository (for important projects)
✅ Discussions (for community engagement)
```

#### Features to Configure
- **Default branch**: `main`
- **Template repository**: No (unless creating a template)
- **Require contributors to sign off on web-based commits**: Recommended for legal compliance

### Actions Settings

Go to **Settings > Actions > General**:

#### Actions permissions:
- [x] **Allow all actions and reusable workflows**
- Alternative: **Allow select actions and reusable workflows** (more secure)

#### Workflow permissions:
- [x] **Read and write permissions**
- [x] **Allow GitHub Actions to create and approve pull requests**

#### Artifact and log retention:
- **Artifacts**: **30 days** (for debugging)
- **Logs**: **90 days** (for audit trail)

## 4. Dependabot Configuration

### Enable Dependabot Alerts
1. Go to **Settings > Security & analysis**
2. Enable:
   - [x] **Dependency graph**
   - [x] **Dependabot alerts**
   - [x] **Dependabot security updates**

### Verify Dependabot Configuration
The `.github/dependabot.yml` file is already configured with:
- **Regular updates**: Weekly on Monday (dev branch)
- **Security updates**: Daily (main branch)
- **GitHub Actions updates**: Weekly on Tuesday
- **Auto-assignment**: To repository owner

## 5. Code Owners Configuration (Optional but Recommended)

Create `.github/CODEOWNERS` file:

```bash
# Global code owners
* @your-username

# Workflow files require admin review
/.github/workflows/ @your-username @admin-username

# Package.json changes require careful review
package.json @your-username
package-lock.json @your-username

# Security-sensitive files
/.github/dependabot.yml @your-username
/scripts/ @your-username
```

## 6. Issue and PR Templates

### Issue Templates

Create `.github/ISSUE_TEMPLATE/bug_report.yml`:
```yaml
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
  - type: dropdown
    id: version
    attributes:
      label: Version
      description: What version of our software are you running?
      options:
        - Latest
        - 0.8.6
        - 0.8.5
        - Other (please specify in description)
    validations:
      required: true
```

### Pull Request Template

Create `.github/pull_request_template.md`:
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Testing
- [ ] Tests pass locally
- [ ] Added tests for new functionality
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No new warnings introduced
```

## 7. Notifications Configuration

### Repository Notifications
1. Go to **Settings > Notifications**
2. Configure:
   - **Participating and @mentions**: Email + Web
   - **All Activity**: Web only (to avoid spam)

### Workflow Notifications
The workflows will automatically:
- ✅ Comment on PRs with auto-merge status
- ✅ Create GitHub releases with changelogs
- ✅ Report failures in workflow runs
- ✅ Upload artifacts for debugging

## 8. Marketplace Configuration

### Publisher Profile Setup
1. Go to [Visual Studio Marketplace Publisher Management](https://marketplace.visualstudio.com/manage)
2. Verify your publisher profile:
   - **Display name**: Clear, professional name
   - **Description**: Brief description of your extensions
   - **Website**: Link to your GitHub or personal website
   - **Logo**: Professional logo (128x128px recommended)

### Extension Metadata
Verify `package.json` has proper marketplace metadata:
```json
{
  "publisher": "your-publisher-id",
  "displayName": "Clear, descriptive name",
  "description": "Comprehensive description",
  "categories": ["Other", "Debuggers", "Testing"],
  "keywords": ["language-model", "ai", "copilot"],
  "icon": "images/icon.png",
  "galleryBanner": {
    "color": "#1e1e1e",
    "theme": "dark"
  },
  "repository": {
    "type": "git",
    "url": "https://github.com/your-username/your-repo.git"
  },
  "bugs": {
    "url": "https://github.com/your-username/your-repo/issues"
  }
}
```

## 9. Security Configuration

### Security Advisories
1. Go to **Settings > Security & analysis**
2. Enable:
   - [x] **Private vulnerability reporting**
   - [x] **Dependency graph**
   - [x] **Dependabot alerts**

### Security Policy
Create `.github/SECURITY.md`:
```markdown
# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.8.x   | :white_check_mark: |
| < 0.8   | :x:                |

## Reporting a Vulnerability

Please report security vulnerabilities to: security@your-domain.com

We will respond within 48 hours and provide updates every 72 hours.
```

## 10. Verification Checklist

### Pre-Deployment Verification

Run this checklist before going live:

#### Repository Configuration
- [ ] VSCE_PAT secret configured and valid
- [ ] Branch protection rules enabled for main
- [ ] Dependabot configuration active
- [ ] Issue/PR templates created
- [ ] CODEOWNERS file configured (if applicable)

#### Workflow Testing
- [ ] All workflows have valid YAML syntax
- [ ] Test workflow runs successfully on dev branch
- [ ] Auto-merge logic tested with mock PRs
- [ ] Release workflow tested (dry run)
- [ ] Security audit passes

#### Marketplace Readiness
- [ ] Publisher profile complete
- [ ] Extension metadata verified
- [ ] Icon and banner images ready
- [ ] README.md comprehensive and up-to-date

#### Security & Compliance
- [ ] Security policy documented
- [ ] Vulnerability reporting enabled
- [ ] Code scanning configured
- [ ] Secrets properly secured

## 11. Post-Deployment Monitoring

### First Week Monitoring
- [ ] Monitor workflow success rates
- [ ] Check Dependabot PR auto-merge behavior
- [ ] Verify release process works end-to-end
- [ ] Monitor marketplace publishing
- [ ] Check security alerts

### Ongoing Maintenance
- [ ] Weekly review of failed workflows
- [ ] Monthly security audit review
- [ ] Quarterly workflow optimization
- [ ] Regular backup verification

## 12. Troubleshooting Common Issues

### VSCE_PAT Issues
**Problem**: Marketplace publishing fails
**Solutions**:
1. Verify token hasn't expired
2. Check token has "Marketplace (Manage)" scope
3. Ensure publisher ID matches package.json
4. Verify no special characters in version

### Branch Protection Issues
**Problem**: Can't merge to main
**Solutions**:
1. Ensure all status checks pass
2. Verify PR is from dev branch
3. Check version has been bumped
4. Ensure required reviews are approved

### Auto-merge Not Working
**Problem**: Dependabot PRs not auto-merging
**Solutions**:
1. Check if it's a major update (requires manual review)
2. Verify all CI checks are passing
3. Check workflow logs for errors
4. Ensure PR is mergeable (no conflicts)

## 13. Emergency Procedures

### Disable Auto-merge
If auto-merge causes issues:
```bash
# Temporarily disable auto-merge workflow
gh workflow disable auto-merge.yml
```

### Rollback Release
If a release has issues:
```bash
# Create hotfix branch
git checkout -b hotfix/urgent-fix main

# Make fixes, then create emergency release
git commit -m "hotfix: urgent fix"
git push origin hotfix/urgent-fix

# Create PR to main with "hotfix" label
```

### Emergency Marketplace Unpublish
If extension has critical issues:
1. Go to [Marketplace Management](https://marketplace.visualstudio.com/manage)
2. Find your extension
3. Click "..." > "Unpublish"
4. Fix issues and republish

## Conclusion

Following this setup guide will ensure your repository is properly configured for the enhanced CI/CD workflows. The configuration provides:

- ✅ **Secure automation** with proper permissions
- ✅ **Quality gates** with branch protection
- ✅ **Dependency management** with Dependabot
- ✅ **Release automation** with marketplace publishing
- ✅ **Monitoring and alerts** for issues

After completing this setup, your repository will be ready for enterprise-level development with automated CI/CD processes.

---

**Next Steps**: 
1. Complete the configuration checklist
2. Test with a small change to verify everything works
3. Monitor the first few automated processes
4. Adjust settings based on your team's needs
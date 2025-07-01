# 📋 Repository Configuration Checklist

## Quick Setup Checklist for CI/CD Deployment

Use this checklist to ensure your repository is properly configured for the enhanced CI/CD workflows.

### 🚀 Quick Start (5 minutes)

**Option 1: Automated Setup**
```bash
# Run the automated setup script
./scripts/setup-repository.sh
```

**Option 2: Manual Setup**
Follow the sections below for manual configuration.

### ✅ Critical Requirements (Must Have)

#### 1. Repository Secrets
- [ ] **VSCE_PAT** - VS Code Marketplace Personal Access Token
  - Get from: https://marketplace.visualstudio.com/manage
  - Scope: "Marketplace (Manage)"
  - Add via: GitHub Settings > Secrets and variables > Actions

#### 2. Branch Protection
- [ ] **Main branch protection enabled**
  - Require pull request reviews (1 approval)
  - Require status checks to pass
  - Require branches to be up to date
  - Include administrators in restrictions

#### 3. Workflow Files
- [ ] All 6 workflow files present and valid:
  - `test.yml` - Enhanced testing pipeline
  - `auto-merge.yml` - Secure dependency management
  - `main-protection.yml` - Release validation
  - `summary.yml` - Issue management
  - `release.yml` - Release automation
  - `test-release.yml` - Release testing

#### 4. Package.json Configuration
- [ ] **Required fields present**:
  - `name`, `displayName`, `description`
  - `version`, `publisher`, `engines`
  - `main`, `contributes`
- [ ] **VS Code engine version** specified (^1.90.0 or later)
- [ ] **Repository URL** configured

### 🛡️ Security Configuration (Recommended)

#### 1. Security Features
- [ ] **Dependabot alerts** enabled
- [ ] **Vulnerability alerts** enabled
- [ ] **Automated security fixes** enabled

#### 2. Security Files
- [ ] **CODEOWNERS** file created
- [ ] **Security policy** (SECURITY.md) created
- [ ] **Dependabot configuration** (.github/dependabot.yml) present

#### 3. Access Control
- [ ] **Repository permissions** properly configured
- [ ] **Team access** configured (if applicable)
- [ ] **Admin access** limited to necessary users

### 📝 Templates & Documentation (Recommended)

#### 1. Issue Templates
- [ ] **Bug report template** (.github/ISSUE_TEMPLATE/bug_report.yml)
- [ ] **Feature request template** (.github/ISSUE_TEMPLATE/feature_request.yml)

#### 2. PR Template
- [ ] **Pull request template** (.github/pull_request_template.md)

#### 3. Documentation
- [ ] **README.md** comprehensive and up-to-date
- [ ] **CHANGELOG.md** present
- [ ] **Setup documentation** available

### 🔧 Build Configuration (Must Have)

#### 1. Dependencies
- [ ] **Node modules** installed (`npm install`)
- [ ] **All build scripts** working:
  - `npm run lint`
  - `npm run check-types`
  - `npm run compile`
  - `npm run package`
  - `npm test`

#### 2. Extension Assets
- [ ] **Extension icon** present (images/icon.png)
- [ ] **Extension manifest** complete
- [ ] **Build output** directory configured

### 🎯 Marketplace Configuration (For Publishing)

#### 1. Publisher Setup
- [ ] **Publisher account** created on VS Code Marketplace
- [ ] **Publisher profile** complete
- [ ] **VSCE_PAT token** valid and not expired

#### 2. Extension Metadata
- [ ] **Display name** clear and descriptive
- [ ] **Description** comprehensive
- [ ] **Categories** appropriate
- [ ] **Keywords** relevant
- [ ] **Icon** professional (128x128px recommended)

### 🔍 Validation Commands

#### Quick Validation
```bash
# Validate repository configuration
./scripts/validate-repository-config.sh

# Check workflow syntax
python3 -c "import yaml; [yaml.safe_load(open(f)) for f in ['test.yml', 'auto-merge.yml', 'main-protection.yml', 'summary.yml', 'release.yml', 'test-release.yml']]"

# Test build commands
npm run lint && npm run check-types && npm run compile
```

#### Comprehensive Testing
```bash
# Test all build commands
npm run lint
npm run check-types  
npm run compile
npm run package
npm test

# Validate package.json
jq '.name, .displayName, .publisher, .engines.vscode' package.json

# Check security audit
npm audit --audit-level moderate
```

### 🚦 Status Indicators

#### ✅ Ready for Production
- All critical requirements met
- All workflows validated
- Build commands working
- Security configured

#### ⚠️ Ready with Warnings
- Critical requirements met
- Minor recommendations pending
- Can deploy but should address warnings

#### ❌ Not Ready
- Critical requirements missing
- Workflow validation failures
- Build errors present

### 🆘 Common Issues & Solutions

#### VSCE_PAT Issues
**Problem**: Marketplace publishing fails
**Solution**: 
1. Check token hasn't expired
2. Verify "Marketplace (Manage)" scope
3. Ensure publisher ID matches package.json

#### Branch Protection Issues
**Problem**: Can't merge to main
**Solution**:
1. Ensure PR is from dev branch
2. Check all status checks pass
3. Verify version has been bumped

#### Workflow Validation Failures
**Problem**: YAML syntax errors
**Solution**:
1. Use online YAML validator
2. Check indentation (spaces, not tabs)
3. Validate multiline strings

#### Build Command Failures
**Problem**: npm scripts fail
**Solution**:
1. Run `npm install` to ensure dependencies
2. Check Node.js version compatibility
3. Review error messages for specific issues

### 📞 Getting Help

#### Automated Validation
```bash
# Run comprehensive validation
./scripts/validate-repository-config.sh

# Get detailed setup guidance
./scripts/setup-repository.sh --help
```

#### Manual Verification
```bash
# Check GitHub CLI status
gh auth status

# List repository secrets
gh secret list

# Check branch protection
gh api repos/OWNER/REPO/branches/main/protection

# View workflow runs
gh workflow list
```

#### Documentation References
- **Setup Guide**: `REPOSITORY_SETUP_GUIDE.md`
- **Workflow Documentation**: `.github/WORKFLOW_DOCUMENTATION.md`
- **Testing Report**: `CI_CD_TESTING_REPORT.md`

### 🎉 Success Criteria

Your repository is ready for CI/CD deployment when:

1. ✅ **All critical requirements** are met
2. ✅ **Validation script** passes without failures
3. ✅ **Build commands** execute successfully
4. ✅ **Security features** are enabled
5. ✅ **Documentation** is complete

### 📈 Post-Deployment Monitoring

After deployment, monitor:
- **Workflow success rates** (target: >95%)
- **Build performance** (target: <5 minutes)
- **Security alerts** (target: 0 critical)
- **Auto-merge behavior** (verify safety)
- **Release automation** (end-to-end testing)

---

**Quick Commands Summary:**
```bash
# Setup everything automatically
./scripts/setup-repository.sh

# Validate configuration
./scripts/validate-repository-config.sh

# Test build process
npm run lint && npm run check-types && npm run package

# Check security
npm audit --audit-level moderate
```
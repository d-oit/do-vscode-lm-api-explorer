# Branch Protection Configuration

This file contains the recommended branch protection rules for this repository.
Apply these settings in GitHub repository settings > Branches.

## Main Branch Protection Rules

### Required Status Checks
- ✅ **Require status checks to pass before merging**
- ✅ **Require branches to be up to date before merging**
- Required status checks:
  - `test` (from release.yml)
  - `validate-pr` (from main-protection.yml)

### Pull Request Requirements
- ✅ **Require a pull request before merging**
- ✅ **Require review from code owners** (optional but recommended)
- ✅ **Dismiss stale PR approvals when new commits are pushed**
- ✅ **Require conversation resolution before merging**

### Push Restrictions
- ✅ **Restrict pushes that create files**
- ✅ **Do not allow bypassing the above settings**
- ❌ **Allow force pushes** (disabled for safety)
- ❌ **Allow deletions** (disabled for safety)

### Additional Rules
- ✅ **Require linear history** (optional but recommended for clean history)
- ✅ **Require deployments to succeed before merging** (if using deployments)

## Dev Branch Protection Rules

### Required Status Checks
- ✅ **Require status checks to pass before merging**
- ✅ **Require branches to be up to date before merging**
- Required status checks:
  - `test` (from dev.yml)
  - `build` (from dev.yml)

### Pull Request Requirements
- ✅ **Require a pull request before merging**
- ❌ **Require review from code owners** (optional for development)

### Push Restrictions
- ❌ **Restrict pushes that create files** (allow direct pushes for development)
- ✅ **Allow force pushes** (for development flexibility)
- ❌ **Allow deletions** (disabled for safety)

## Repository Secrets Required

Add these secrets in GitHub repository settings > Secrets and variables > Actions:

### `VSCE_PAT`
- **Purpose**: VS Code Marketplace publishing
- **How to get**:
  1. Go to [Visual Studio Marketplace Publisher Management](https://marketplace.visualstudio.com/manage)
  2. Click on your publisher name
  3. Create a Personal Access Token
  4. Select scope: `Marketplace (Publish)`
  5. Copy the token and add as repository secret

### `GITHUB_TOKEN`
- **Purpose**: GitHub release creation (automatically provided by GitHub Actions)
- **No action required**: This is automatically available in workflows

## GitHub CLI Commands for Quick Setup

If you have GitHub CLI installed, you can use these commands to set up branch protection:

```bash
# Protect main branch
gh api repos/:owner/:repo/branches/main/protection \
  --method PUT \
  --field required_status_checks='{"strict":true,"contexts":["test","validate-pr"]}' \
  --field enforce_admins=true \
  --field required_pull_request_reviews='{"required_approving_review_count":1,"dismiss_stale_reviews":true}' \
  --field restrictions=null

# Protect dev branch  
gh api repos/:owner/:repo/branches/dev/protection \
  --method PUT \
  --field required_status_checks='{"strict":true,"contexts":["test","build"]}' \
  --field enforce_admins=false \
  --field required_pull_request_reviews='{"required_approving_review_count":0}' \
  --field restrictions=null
```

Replace `:owner` and `:repo` with your actual GitHub username/organization and repository name.

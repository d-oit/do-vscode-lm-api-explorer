# GitHub CI/CD Workflow Documentation

This repository uses a GitFlow-inspired branching strategy with automated CI/CD pipelines for VS Code extension development and release.

## Branch Strategy

### Development Branch (`dev`)
- All development work happens in the `dev` branch
- Feature branches should be created from and merged back into `dev`
- Continuous integration runs on every push and pull request

### Master Branch (`master`)
- **Release-only branch** - no direct development
- Only accepts pull requests from the `dev` branch
- Automatically triggers release process when code is pushed
- Protected branch with strict validation

## Workflow Files

### 1. `ci.yml` - General CI Pipeline
- **Triggers**: Push/PR to `dev` or `master` branches
- **Purpose**: Basic validation (lint, type-check, test, build)
- **Actions**: 
  - Installs dependencies
  - Runs ESLint
  - Performs TypeScript type checking
  - Executes test suite
  - Builds the extension

### 2. `dev.yml` - Development CI Pipeline
- **Triggers**: Push/PR to `dev` branch
- **Purpose**: Development-focused validation and artifact creation
- **Actions**:
  - Runs full test suite
  - Creates development build artifacts
  - Uploads `.vsix` file for testing (7-day retention)

### 3. `master-protection.yml` - Master Branch Protection
- **Triggers**: Pull requests to `master` branch
- **Purpose**: Ensures master branch integrity
- **Validations**:
  - Verifies PR source is `dev` branch only
  - Runs comprehensive test suite
  - Validates version has been bumped
  - Ensures package builds successfully

### 4. `release.yml` - Release Pipeline
- **Triggers**: Push to `master` branch
- **Purpose**: Automated release to GitHub and VS Code Marketplace
- **Actions**:
  - Runs full test suite
  - Builds and packages extension
  - Creates GitHub release with auto-generated notes
  - Publishes to VS Code Marketplace

## Required Secrets

To enable marketplace publishing, add the following secret to your GitHub repository:

### `VSCE_PAT` - Visual Studio Code Extension Personal Access Token
1. Go to [Visual Studio Marketplace Publisher Management](https://marketplace.visualstudio.com/manage)
2. Create a Personal Access Token with `Marketplace (Publish)` scope
3. Add it as a repository secret named `VSCE_PAT`

## Release Process

### Automated Release (Recommended)
1. Develop features in `dev` branch
2. Update version in `package.json` using semantic versioning
3. Create PR from `dev` to `master`
4. After PR approval and merge, release is automatically triggered

### Manual Release Steps
If you need to make a manual release:
1. Ensure you're on `dev` branch with latest changes
2. Update version: `npm version patch|minor|major`
3. Push changes: `git push origin dev`
4. Create and merge PR to `master`
5. Release workflow will automatically trigger

## Version Management

- Follow [Semantic Versioning](https://semver.org/)
- Version bumps are required for releases
- Use `npm version` commands to update package.json
- Git tags are automatically created during release

## Workflow Status

Each workflow provides different validation levels:

- ✅ **CI**: Basic validation for all branches
- 🔧 **Dev**: Development builds and artifacts
- 🛡️ **Master Protection**: Strict validation for release candidates
- 🚀 **Release**: Production deployment to GitHub and VS Code Marketplace

## Branch Protection Rules (Recommended)

Configure these branch protection rules in GitHub:

### `master` branch:
- Require status checks to pass before merging
- Require branches to be up to date before merging
- Require review from code owners
- Restrict pushes that create files
- Require linear history

### `dev` branch:
- Require status checks to pass before merging
- Allow force pushes for development flexibility

## Troubleshooting

### Release Failed
- Check if `VSCE_PAT` secret is properly configured
- Verify version has been bumped in package.json
- Ensure all tests pass

### Master Branch Rejected
- Verify PR is from `dev` branch
- Check that version has been incremented
- Ensure all CI checks pass

### Marketplace Publishing Failed
- Verify publisher name matches your marketplace account
- Check that all required fields in package.json are present
- Ensure extension package builds without errors

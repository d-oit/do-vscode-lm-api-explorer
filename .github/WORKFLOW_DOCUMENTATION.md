# CI/CD Workflow Documentation

This document details the CI/CD pipelines and release processes for the VS Code LM API Explorer extension.

## Workflow Structure

The project uses GitHub Actions for CI/CD with three primary workflows:

1. **Development CI** (`dev-ci.yml`):
   - Runs on pushes to `dev` branch
   - Executes:
     - Unit tests
     - Integration tests
     - Linting
     - Type checking
   - Creates build artifacts

2. **Main Protection** (`main-protection.yml`):
   - Runs on pull requests targeting `main`
   - Validates:
     - Version bump in package.json
     - All tests passing
     - Successful build
     - Lint and type check compliance

3. **Release Automation** (`release.yml`):
   - Triggers on merges to `main`
   - Executes:
     - Full test suite
     - VSIX package creation
     - GitHub release creation
     - VS Code Marketplace publication
     - Version tagging

## Branching Strategy

- **`dev` branch**: Primary development branch
- **`main` branch**: Release-only branch (protected)
- **Feature branches**: Created from `dev` using `feature/` prefix

## Release Process

1. **Version Preparation**:
   ```bash
   npm run release:prepare
   ```
   - Interactive version bump (major/minor/patch)
   - Updates CHANGELOG.md
   - Commits changes with standardized message

2. **PR Creation**:
   - Create PR from `dev` to `main`
   - Ensure all checks pass
   - Include release notes in PR description

3. **Merge & Automation**:
   - Squash merge PR to `main`
   - Automated processes:
     - Version tag creation
     - GitHub release with auto-generated notes
     - VSIX publication to Marketplace
     - Release notes posted to Slack/Teams

## Quality Gates

- **Testing**:
  - 100% unit test coverage required for new features
  - Integration tests for all user flows
  - Security scanning of dependencies

- **Checks**:
  - Linting (ESLint)
  - Type checking (TypeScript)
  - VS Code API compatibility
  - Marketplace metadata validation

## Troubleshooting

Common issues and solutions:

- **Failed Version Bump**: Ensure `npm run release:prepare` was executed
- **Marketplace Publish Failure**: Check PAT permissions
- **Test Failures**: Verify VS Code version compatibility

For more details, see the [README.md](../README.md) Development & Architecture section.
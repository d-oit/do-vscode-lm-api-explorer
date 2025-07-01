# CI/CD Workflow Documentation

This document details the comprehensive CI/CD pipelines and release processes for the VS Code LM API Explorer extension.

## Workflow Architecture

The project uses GitHub Actions for CI/CD with seven primary workflows:

### 1. **Test Workflow** (`test.yml`)
- **Triggers**: Push to `dev`/`main`, Pull requests
- **Purpose**: Continuous integration testing
- **Features**:
  - Multi-node version testing (Node 20)
  - Security audit scanning
  - Linting and type checking
  - Extension building and testing
  - Test result artifacts
  - 20-minute timeout protection

### 2. **Main Branch Protection** (`main-protection.yml`)
- **Triggers**: Pull requests to `main` branch
- **Purpose**: Enforce release quality standards
- **Validations**:
  - Source branch must be `dev`
  - Version bump validation (semver)
  - Required files presence check
  - package.json structure validation
  - VS Code engine compatibility

### 3. **Release Workflow** (`release.yml`)
- **Triggers**: Push to `main`, Manual dispatch
- **Purpose**: Automated release management
- **Features**:
  - Changeset processing
  - Version tagging with validation
  - VSIX package creation and validation
  - GitHub release with changelog
  - VS Code Marketplace publishing
  - Comprehensive error handling

### 4. **Auto-sync Dev to Main** (`auto-sync-dev-to-main.yml`)
- **Triggers**: Push to `dev`, Manual dispatch
- **Purpose**: Automated branch synchronization following best practices
- **Best Practice Features**:
  - Meaningful change detection (excludes docs/config)
  - Version bump requirement validation
  - Complete test suite execution before sync
  - Automated PR creation and merging
  - Comprehensive audit trail and logging
  - Multi-layered safety checks
  - Fail-safe mechanisms with manual override

### 5. **Auto-merge Dependabot** (`auto-merge.yml`)
- **Triggers**: Dependabot PRs
- **Purpose**: Automated dependency updates
- **Safety Features**:
  - Update type classification (security/patch/minor/major)
  - Check status validation
  - Only auto-merge safe updates
  - Manual review required for major updates
  - Failure notifications

### 6. **Issue Summary** (`summary.yml`)
- **Triggers**: New issues opened
- **Purpose**: Automated issue management
- **Features**:
  - Automatic issue summarization
  - Content-based label assignment
  - Welcome message for new issues
  - Error handling with fallback

### 7. **Test Release** (`test-release.yml`)
- **Triggers**: Manual dispatch only
- **Purpose**: Release workflow testing
- **Features**:
  - Safe testing environment
  - Changeset validation
  - Version bump simulation

## Branching Strategy

```
main (protected)     <- Release-only branch
  ^
dev                  <- Primary development branch  
  ^
feature/*            <- Feature development branches
hotfix/*             <- Emergency fixes
```

### Branch Protection Rules
- **main**: Requires PR from `dev`, all checks must pass, version must be bumped
- **dev**: Requires PR review, all checks must pass
- **feature/***: No restrictions, but CI runs on PRs

## Release Process

### Automated Release (Recommended)
1. **Development**:
   ```bash
   git checkout dev
   git pull origin dev
   # Make changes
   git commit -m "feat: add new feature"
   ```

2. **Version Bump**:
   ```bash
   npm run release:prepare
   # This bumps version in package.json
   ```

3. **Push to Dev**:
   ```bash
   git push origin dev
   # Auto-sync workflow automatically handles the rest
   ```

4. **Automatic Release Flow**:
   - Auto-sync detects meaningful changes and version bump
   - Runs complete test suite automatically
   - Creates PR from dev to main with detailed summary
   - Auto-merges PR if all checks pass
   - Release workflow triggers automatically
   - Version tagging and publishing happen automatically

### Manual Release (Emergency)
1. **Version Preparation**:
   ```bash
   npm run release:prepare
   ```

2. **Manual Workflow Trigger**:
   - Use GitHub Actions UI
   - Select version type and options

## Security & Quality Gates

### Security Measures
- **Dependency Scanning**: Daily security updates
- **Audit Checks**: npm audit on every build
- **Permission Validation**: Minimal required permissions
- **Secret Management**: Secure token handling

### Quality Checks
- **Code Quality**:
  - ESLint with TypeScript rules
  - Strict TypeScript compilation
  - Code formatting validation

- **Testing**:
  - Unit tests with coverage
  - Integration tests
  - VS Code extension testing
  - Cross-platform compatibility

- **Build Validation**:
  - VSIX package integrity
  - File size validation
  - Marketplace compatibility

## Dependency Management

### Dependabot Configuration
- **Regular Updates**: Weekly on Monday (dev branch)
- **Security Updates**: Daily (main branch)
- **GitHub Actions**: Weekly on Tuesday
- **Auto-merge**: Patch and minor updates only
- **Manual Review**: Major updates and breaking changes

### Update Classification
- **Security**: Auto-merge immediately
- **Patch**: Auto-merge after checks pass
- **Minor**: Auto-merge after checks pass
- **Major**: Manual review required

## Troubleshooting Guide

### Common Issues

#### 1. Version Validation Fails
**Symptoms**: Main protection workflow fails
**Causes**: 
- Version not bumped
- Invalid semver format
**Solutions**:
```bash
npm run release:prepare
# or manually update package.json version
```

#### 2. Marketplace Publishing Fails
**Symptoms**: Release succeeds but marketplace publish fails
**Causes**:
- Invalid/expired VSCE_PAT
- Version already exists
- Marketplace validation errors
**Solutions**:
- Check VSCE_PAT in repository secrets
- Verify version uniqueness
- Review marketplace guidelines

#### 3. Auto-merge Not Working
**Symptoms**: Dependabot PRs not auto-merging
**Causes**:
- Failed checks
- Major version update
- Merge conflicts
**Solutions**:
- Check workflow logs
- Review failed checks
- Manually merge if needed

#### 4. Test Failures
**Symptoms**: CI tests failing
**Causes**:
- Code issues
- Environment problems
- Dependency conflicts
**Solutions**:
```bash
npm test                    # Run tests locally
npm run lint               # Check linting
npm run check-types        # Verify TypeScript
```

### Debug Commands
```bash
# Check workflow status
gh workflow list

# View workflow runs
gh run list --workflow=test.yml

# Download artifacts
gh run download <run-id>

# Check repository secrets
gh secret list
```

## Monitoring & Metrics

### Key Metrics to Monitor
- **Build Success Rate**: Target >95%
- **Test Coverage**: Target >80%
- **Release Frequency**: Weekly releases
- **Security Vulnerabilities**: Zero high/critical
- **Marketplace Rating**: Maintain >4.0

### Alerts & Notifications
- **Failed Releases**: Immediate notification
- **Security Vulnerabilities**: Daily digest
- **Failed Tests**: PR status checks
- **Marketplace Issues**: Weekly review

## Maintenance Schedule

### Weekly Tasks
- Review failed workflows
- Update dependencies
- Check security alerts
- Monitor marketplace metrics

### Monthly Tasks
- Review and update workflow configurations
- Audit permissions and secrets
- Update documentation
- Performance optimization review

### Quarterly Tasks
- Major dependency updates
- Workflow architecture review
- Security audit
- Backup and disaster recovery testing

## Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [VS Code Extension Publishing](https://code.visualstudio.com/api/working-with-extensions/publishing-extension)
- [Semantic Versioning](https://semver.org/)
- [Changesets Documentation](https://github.com/changesets/changesets)

For specific workflow details, see individual workflow files in `.github/workflows/`.
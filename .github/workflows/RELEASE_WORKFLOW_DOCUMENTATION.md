# Release Workflow Documentation

## Overview
This document describes the unified release workflow for the VS Code extension, which handles versioning, building, testing, and publishing to both GitHub Releases and the VS Code Marketplace.

## Workflow Triggers

### Automatic Triggers
- **Push to main branch**: Triggers when changesets are present
- **Workflow dispatch**: Manual trigger with additional options

### Manual Trigger Options
- `version_type`: Choose version bump type (auto, patch, minor, major)
- `skip_tests_before_versioning`: Skip tests before versioning (not recommended)
- `force_publish`: Force publish even if tests fail (use with caution)

## Jobs

### 1. version_and_tag
**Purpose**: Handle version bumping, changelog generation, and Git tagging
**Timeout**: 15 minutes
**Conditions**: Runs when changesets are present or manually triggered

**Key Steps**:
- Check for changeset files
- Install dependencies and run optional tests
- Process changesets and update version/changelog
- Commit changes and create Git tag with retry logic
- Validate version format before tagging

### 2. build_and_publish
**Purpose**: Build VSIX package and publish to GitHub and VS Code Marketplace
**Timeout**: 30 minutes
**Conditions**: Runs only if version changed and changesets were processed

**Key Steps**:
- Checkout code at the new tag
- Run security audit
- Execute full test suite
- Build and validate VSIX package
- Create GitHub Release with changelog
- Publish to VS Code Marketplace (if token available)

## Security Features

### Permissions
- `contents: write` - For creating releases and pushing tags
- `pull-requests: read` - For reading PR information
- `actions: read` - For workflow metadata
- `security-events: write` - For security audit results

### Validations
- Version format validation (semver)
- VSIX file integrity checks
- File size validation
- Security audit before publishing

## Error Handling

### Retry Logic
- Git push operations retry up to 3 times with 5-second delays
- Comprehensive error messages for debugging

### Failure Recovery
- Artifacts are uploaded for debugging failed builds
- Clear error messages with actionable guidance
- Graceful handling of missing marketplace tokens

## Artifacts

### Uploaded Artifacts
- VSIX packages (retained for 30 days)
- Security audit results (when vulnerabilities found)

### GitHub Releases
- Automatic release creation with changelog
- VSIX file attachment
- Prerelease detection for version suffixes

## Required Secrets

### VSCE_PAT
- **Purpose**: VS Code Marketplace publishing
- **Required**: No (workflow continues without it)
- **Format**: Personal Access Token from VS Code Marketplace

### GITHUB_TOKEN
- **Purpose**: GitHub API operations
- **Required**: Yes (automatically provided)
- **Permissions**: Managed by workflow permissions

## Best Practices

### Before Running
1. Ensure all tests pass locally
2. Create appropriate changesets
3. Review security audit results
4. Verify VSCE_PAT is valid (for marketplace publishing)

### Monitoring
1. Check workflow logs for any warnings
2. Verify GitHub release was created correctly
3. Confirm marketplace publishing succeeded
4. Monitor for any post-release issues

## Troubleshooting

### Common Issues

#### Version Validation Fails
- **Cause**: Invalid semver format
- **Solution**: Ensure version follows x.y.z or x.y.z-suffix format

#### VSIX Build Fails
- **Cause**: Build errors or missing dependencies
- **Solution**: Check build logs and ensure all dependencies are installed

#### Marketplace Publishing Fails
- **Cause**: Invalid token, network issues, or version conflicts
- **Solution**: Check VSCE_PAT validity and marketplace status

#### Git Push Fails
- **Cause**: Permission issues or conflicts
- **Solution**: Check repository permissions and branch protection rules

### Debug Steps
1. Check workflow logs for specific error messages
2. Download VSIX artifact to test locally
3. Verify all required secrets are configured
4. Test marketplace publishing manually if needed

## Maintenance

### Regular Tasks
- Update action versions quarterly
- Review and update timeout values as needed
- Monitor security audit results
- Update documentation for any workflow changes

### Security Considerations
- Regularly rotate VSCE_PAT tokens
- Monitor for security vulnerabilities in dependencies
- Review workflow permissions periodically
- Keep action versions updated for security patches
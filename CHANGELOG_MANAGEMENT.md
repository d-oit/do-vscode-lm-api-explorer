# Changelog Management System

This project uses a structured changeset-based approach to manage releases and automatically generate changelogs. This system helps maintain consistent release notes and ensures all changes are properly documented.

## Overview

The changelog management system consists of:

1. **Changeset files** - Individual markdown files describing specific changes
2. **Changelog manager scripts** - PowerShell and Bash scripts to process changesets
3. **Automated changelog generation** - Converts changesets into structured changelog entries
4. **Version management** - Automatically handles version bumping

## Quick Start

### Creating a changeset (recommended workflow)

When you make changes to the codebase, create a changeset to describe them:

```bash
npm run changeset:create
```

This opens an interactive prompt to:
1. Select the type of change (feature, fix, enhancement, etc.) - **includes auto-detection option**
2. Provide a description (can be auto-generated from git commits)
3. List specific changes (can be auto-generated from git commits)

**Auto-detection features:**
- **Type auto-detection**: Analyzes recent git commits to suggest change type
- **Description auto-generation**: Creates descriptions based on commit messages
- **Change list auto-generation**: Extracts individual changes from commit history

### Processing changesets for release

When ready to release:

```bash
npm run changeset:release
```

**For auto-detection of version type based on git commits:**

```bash
npm run changeset:release-auto
```

This will:
- Analyze recent git commits to determine if it should be a major, minor, or patch release
- Process all pending changesets
- Update CHANGELOG.md with grouped changes
- Bump the version in package.json
- Clean up processed changeset files

### Full release workflow

For a complete release process:

```bash
npm run changeset:full-release
```

**With auto-detection:**

```bash
npm run changeset:full-release-auto
```

This handles everything including running the existing release preparation scripts.

## Auto-Detection Features

The changelog management system includes intelligent auto-detection capabilities that analyze your git commit history to automatically determine appropriate change types and generate changeset content.

### Auto Change Type Detection

When using the `auto` type or the `-auto` variants of npm scripts, the system:

1. **Analyzes recent git commits** (default: last 10 commits)
2. **Scans for keywords** that indicate different types of changes:
   - **Breaking changes**: `breaking`, `major`, `break`, `remove`, `delete`, `deprecate`
   - **Features**: `feat`, `feature`, `add`, `new`, `implement`, `create`
   - **Fixes**: `fix`, `bug`, `patch`, `repair`, `resolve`, `correct`
   - **Enhancements**: `enhance`, `improve`, `update`, `upgrade`, `optimize`, `refactor`

3. **Scores each commit** based on detected keywords
4. **Determines version bump**:
   - **Major**: If any breaking changes detected
   - **Minor**: If features outweigh fixes
   - **Patch**: Default for fixes and minor improvements

### Auto Content Generation

The system can automatically generate:

- **Changeset descriptions** from the most significant recent commits
- **Change lists** by cleaning and organizing commit messages
- **Version numbers** based on current version and detected change type

### Example Auto-Detection Output

```
Analyzing recent commits for change type...
  47e63cd: feat: add new user authentication system
    -> Feature detected: 'feat'
    -> Feature detected: 'add'
  f6586cf: fix: resolve login timeout issue
    -> Fix detected: 'fix'
    -> Fix detected: 'resolve'
  e5c0bc5: breaking: remove deprecated API endpoints
    -> Breaking change detected: 'breaking'
    -> Breaking change detected: 'remove'

Score analysis:
  Major (breaking): 6
  Minor (features): 4
  Patch (fixes): 2
  Detected type: major
```

### Customizing Auto-Detection

You can customize the number of commits analyzed:

```powershell
# PowerShell
.\scripts\changelog-manager.ps1 -Command update-changelog -Type auto -GitCommitCount 20

# Bash
./scripts/changelog-manager.sh -c update-changelog -t auto --git-commits 20
```

## Change Types

The system supports these change types that map to changelog categories:

| Type | Changelog Category | Description |
|------|-------------------|-------------|
| `feature` | Added | New functionality |
| `enhancement` | Changed | Improvements to existing features |
| `fix` | Fixed | Bug fixes |
| `breaking` | Changed | Breaking changes |
| `security` | Security | Security improvements |
| `deprecation` | Deprecated | Deprecated functionality |
| `removal` | Removed | Removed functionality |

## File Structure

```
.changeset/
├── README.md                          # Documentation
├── 20250527-143000-fix.md            # Example changeset file
└── 20250527-144500-feature.md        # Another changeset file

scripts/
├── changelog-manager.ps1             # PowerShell version
└── changelog-manager.sh              # Bash version
```

## Changeset File Format

Changeset files use frontmatter with markdown content:

```markdown
---
type: fix
description: Fixed authentication timeout issue
date: 2025-05-27
---

# Fixed authentication timeout issue

- Increased default timeout from 5s to 30s
- Added retry mechanism for failed requests
- Improved error messages for timeout scenarios
```

## Scripts Reference

### PowerShell Script (`changelog-manager.ps1`)

```powershell
# Interactive changeset creation
.\scripts\changelog-manager.ps1 -Command create-changeset -Interactive

# Update changelog with specific version
.\scripts\changelog-manager.ps1 -Command update-changelog -Version "0.3.2"

# Full release process
.\scripts\changelog-manager.ps1 -Command full-release -Version "0.3.2" -Type "patch"

# Prepare release (runs existing scripts)
.\scripts\changelog-manager.ps1 -Command prepare-release

# Show changeset status
.\scripts\changelog-manager.ps1 -Command status

# CI/CD release processing
.\scripts\changelog-manager.ps1 -Command ci-release -Type auto
```

### Bash Script (`changelog-manager.sh`)

```bash
# Interactive changeset creation
./scripts/changelog-manager.sh -c create-changeset -i

# Update changelog
./scripts/changelog-manager.sh -c update-changelog -v "0.3.2"

# Full release process
./scripts/changelog-manager.sh -c full-release -v "0.3.2" -t patch

# Show changeset status
./scripts/changelog-manager.sh -c status

# CI/CD release processing
./scripts/changelog-manager.sh -c ci-release -t auto
```

## NPM Scripts

| Script | Description |
|--------|-------------|
| `npm run changeset:create` | Create new changeset (interactive) |
| `npm run changeset:release` | Process changesets and update changelog |
| `npm run changeset:release-auto` | Process changesets with auto-detected version type |
| `npm run changeset:full-release` | Complete release workflow |
| `npm run changeset:full-release-auto` | Full release with auto-detection |
| `npm run changeset:status` | Show changeset status and information |
| `npm run changeset:ci-release` | CI/CD release processing with GitHub Actions output |
| `npm run changeset:create:bash` | Create changeset (Bash version) |
| `npm run changeset:release:bash` | Release using Bash script |
| `npm run changeset:release-auto:bash` | Auto-release using Bash script |
| `npm run changeset:full-release:bash` | Full release using Bash script |
| `npm run changeset:full-release-auto:bash` | Full auto-release using Bash script |
| `npm run changeset:status:bash` | Show status using Bash script |
| `npm run changeset:ci-release:bash` | CI/CD processing using Bash script |

## Version Management

The system automatically handles version bumping based on change types:

- **Major**: Breaking changes (e.g., 1.0.0 → 2.0.0)
- **Minor**: New features (e.g., 1.0.0 → 1.1.0)
- **Patch**: Bug fixes and improvements (e.g., 1.0.0 → 1.0.1)
- **Prerelease**: Beta versions (e.g., 1.0.0 → 1.0.1-beta.1)

## Integration with Existing Workflow

This system integrates with your existing release workflow:

1. **Development**: Create changesets as you work
2. **Pre-release**: Run `changeset:release` to prepare changelog
3. **Release**: Use existing `release:prepare` script
4. **Publish**: Push tags to trigger GitHub Actions

## CI/CD Integration

The changelog management system is fully integrated with GitHub Actions for automated releases.

### Automated Release Workflows

#### Auto-Release Workflow (`.github/workflows/auto-release.yml`)

Automatically detects and processes changesets:

- **Triggers**: 
  - Push to main branch (when changesets are present)
  - Manual workflow dispatch with version type selection
- **Process**:
  1. Detects pending changesets
  2. Processes them using the changeset system
  3. Updates CHANGELOG.md and package.json
  4. Creates and pushes git tags
  5. Triggers release workflow

#### Enhanced Release Workflow (`.github/workflows/release.yml`)

Creates GitHub releases with comprehensive changelog:

- **Triggers**: Git tag push (from auto-release or manual)
- **Process**:
  1. Extracts changelog for the version
  2. Builds and packages extension (VSIX)
  3. Creates GitHub release with:
     - Changeset-generated release notes
     - VSIX file attachment
     - Version links and metadata

### CI/CD Commands

New commands specifically designed for CI/CD integration:

#### Status Command
```bash
# Check changeset status
npm run changeset:status        # PowerShell version
npm run changeset:status:bash   # Bash version
```

Shows:
- Current version information
- Pending changesets count and types
- Recommended version bump
- Detailed changeset information

#### CI-Release Command
```bash
# Process changesets for CI/CD
npm run changeset:ci-release        # PowerShell version
npm run changeset:ci-release:bash   # Bash version
```

Performs:
- Automated changeset processing
- Version bumping with auto-detection
- GitHub Actions output generation
- File updates and cleanup

### GitHub Actions Integration

The CI/CD commands provide GitHub Actions outputs for workflow coordination:

```yaml
# Example workflow step
- name: Process Changesets
  id: changesets
  run: npm run changeset:ci-release

- name: Use Changeset Outputs
  if: steps.changesets.outputs.needs_release == 'true'
  run: |
    echo "New version: ${{ steps.changesets.outputs.new_version }}"
    echo "Version type: ${{ steps.changesets.outputs.version_type }}"
    echo "Changeset count: ${{ steps.changesets.outputs.changeset_count }}"
```

Available outputs:
- `has_changesets`: Boolean indicating if changesets were found
- `changeset_count`: Number of processed changesets
- `previous_version`: Version before processing
- `new_version`: Version after processing
- `version_type`: Type of version bump (major/minor/patch)
- `needs_release`: Boolean indicating if a release is needed

### Manual Release Triggers

The auto-release workflow can be manually triggered with version type selection:

1. Go to Actions tab in GitHub
2. Select "Auto Release" workflow
3. Click "Run workflow"
4. Choose version type:
   - `auto`: Auto-detect from changesets and commits
   - `patch`: Force patch release
   - `minor`: Force minor release
   - `major`: Force major release

### Workflow Files

- **`.github/workflows/auto-release.yml`**: Automatic changeset detection and processing
- **`.github/workflows/release.yml`**: GitHub release creation with changelog integration

These workflows work together to provide a complete automated release pipeline that:
- Detects changes automatically
- Processes changesets with proper version bumping
- Creates comprehensive release notes
- Publishes releases with attachments
- Provides full traceability and error handling

## Best Practices

### When to create changesets

- **After completing a feature** - Document what was added
- **After fixing a bug** - Describe what was fixed
- **After making breaking changes** - Explain the impact
- **Before merging PRs** - Include changeset in the PR

### Writing good changesets

- **Be specific**: "Fixed login timeout" not "Fixed bug"
- **Use user perspective**: How does this change affect users?
- **Include context**: Why was this change needed?
- **Group related changes**: Multiple small fixes can be one changeset

### Version strategy

- **Patch**: Bug fixes, small improvements, documentation
- **Minor**: New features, enhancements, non-breaking changes
- **Major**: Breaking changes, major API changes
- **Prerelease**: Testing, beta features

## Example Workflow

```bash
# 1. Start working on a feature
git checkout -b feature/new-command

# 2. Implement the feature
# ... make code changes ...

# 3. Create a changeset for the feature
npm run changeset:create
# Select: feature
# Description: "Added new command for model comparison"
# Changes: 
# - Added compare-models command
# - Added comparison UI with side-by-side view
# - Added export functionality for comparison results

# 4. Commit changeset with your code
git add .changeset/
git commit -m "Add model comparison feature with changeset"

# 5. Later, when ready for release
npm run changeset:release
# This processes changesets and updates CHANGELOG.md

# 6. Review and commit the release
git add CHANGELOG.md package.json
git commit -m "Prepare release v0.3.2"

# 7. Tag and push
git tag v0.3.2
git push origin v0.3.2
```

## Troubleshooting

### No changesets found
- Check that `.changeset/` directory exists
- Ensure changeset files have `.md` extension
- Verify frontmatter format is correct

### Version conflicts
- Check current version in package.json
- Ensure you're not trying to downgrade
- Use specific version with `-Version` parameter

### Script execution errors (Windows)
- Ensure PowerShell execution policy allows scripts
- Try: `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`
- Use the bash versions if PowerShell is restricted

### Permission errors (Unix)
- Make scripts executable: `chmod +x scripts/*.sh`
- Ensure Node.js is available in PATH
- Check file permissions on changeset directory

## Advanced Usage

### Custom version bumping

```bash
# Specific version
npm run changeset:release -- -Version "1.0.0"

# Version type
npm run changeset:release -- -Type "major"

# Prerelease
npm run changeset:release -- -Type "prerelease"
```

### Manual changeset creation

Create a file in `.changeset/` following the format:

```markdown
---
type: enhancement
description: Improved performance
date: 2025-05-27
---

# Improved performance

- Optimized model loading by 50%
- Reduced memory usage
- Added progress indicators
```

### Batch processing

Process specific changesets by temporarily moving others out of the directory, then running the release command.

This changelog management system provides a structured, automated approach to maintaining release notes while ensuring all changes are properly documented and categorized.

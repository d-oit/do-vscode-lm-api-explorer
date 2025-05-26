# VS Code Extension Release Helper Script (PowerShell)
# This script helps prepare releases by bumping version and creating appropriate commits

param(
    [Parameter(Position=0)]
    [ValidateSet("patch", "minor", "major", "custom")]
    [string]$BumpType
)

# Function to print colored output
function Write-Status {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "⚠️  $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor Red
}

# Check if we're on dev branch
$currentBranch = git rev-parse --abbrev-ref HEAD
if ($currentBranch -ne "dev") {
    Write-Error "You must be on the 'dev' branch to create a release"
    Write-Warning "Current branch: $currentBranch"
    exit 1
}

# Check if working directory is clean
$status = git status --porcelain
if ($status) {
    Write-Error "Working directory is not clean. Please commit or stash changes first."
    git status --short
    exit 1
}

# Get current version
$currentVersion = node -p "require('./package.json').version"
Write-Status "Current version: $currentVersion"

# Ask for version bump type if not provided
if (-not $BumpType) {
    Write-Host ""
    Write-Host "Select version bump type:"
    Write-Host "1) patch (bug fixes)"
    Write-Host "2) minor (new features)"
    Write-Host "3) major (breaking changes)"
    Write-Host "4) custom version"
    Write-Host ""
    
    $choice = Read-Host "Enter choice [1-4]"
    
    switch ($choice) {
        "1" { $BumpType = "patch" }
        "2" { $BumpType = "minor" }
        "3" { $BumpType = "major" }
        "4" { $BumpType = "custom" }
        default {
            Write-Error "Invalid choice"
            exit 1
        }
    }
}

# Handle custom version
if ($BumpType -eq "custom") {
    $customVersion = Read-Host "Enter custom version (e.g., 1.2.3)"
    if ($customVersion -notmatch "^[0-9]+\.[0-9]+\.[0-9]+$") {
        Write-Error "Invalid version format. Use semantic versioning (e.g., 1.2.3)"
        exit 1
    }
    npm version $customVersion --no-git-tag-version
    $newVersion = $customVersion
} else {
    $versionOutput = npm version $BumpType --no-git-tag-version
    $newVersion = $versionOutput -replace "^v", ""
}

Write-Status "Version bumped to: $newVersion"

# Run tests to ensure everything still works
Write-Status "Running tests..."
try {
    npm test
    if ($LASTEXITCODE -ne 0) {
        throw "Tests failed"
    }
} catch {
    Write-Error "Tests failed. Please fix issues before proceeding."
    exit 1
}

# Build the extension
Write-Status "Building extension..."
try {
    npm run package
    if ($LASTEXITCODE -ne 0) {
        throw "Build failed"
    }
} catch {
    Write-Error "Build failed. Please fix issues before proceeding."
    exit 1
}

# Commit the version bump
git add package.json package-lock.json
git commit -m "chore: bump version to $newVersion"

Write-Status "Version bump committed successfully!"
Write-Warning "Next steps:"
Write-Host "1. Push changes: git push origin dev"
Write-Host "2. Create PR from dev to main"
Write-Host "3. After PR is merged, the release will be automatically created"
Write-Host ""
Write-Status "Release preparation complete!"

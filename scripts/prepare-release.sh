#!/bin/bash

# VS Code Extension Release Helper Script
# This script helps prepare releases by bumping version and creating appropriate commits

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if we're on dev branch
current_branch=$(git rev-parse --abbrev-ref HEAD)
if [ "$current_branch" != "dev" ]; then
    print_error "You must be on the 'dev' branch to create a release"
    print_warning "Current branch: $current_branch"
    exit 1
fi

# Check if working directory is clean
if [ -n "$(git status --porcelain)" ]; then
    print_error "Working directory is not clean. Please commit or stash changes first."
    git status --short
    exit 1
fi

# Get current version
current_version=$(node -p "require('./package.json').version")
print_status "Current version: $current_version"

# Ask for version bump type
echo ""
echo "Select version bump type:"
echo "1) patch (bug fixes)"
echo "2) minor (new features)"
echo "3) major (breaking changes)"
echo "4) custom version"
echo ""
read -p "Enter choice [1-4]: " choice

case $choice in
    1)
        bump_type="patch"
        ;;
    2)
        bump_type="minor"
        ;;
    3)
        bump_type="major"
        ;;
    4)
        read -p "Enter custom version (e.g., 1.2.3): " custom_version
        if [[ ! $custom_version =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
            print_error "Invalid version format. Use semantic versioning (e.g., 1.2.3)"
            exit 1
        fi
        ;;
    *)
        print_error "Invalid choice"
        exit 1
        ;;
esac

# Bump version
if [ "$choice" = "4" ]; then
    npm version $custom_version --no-git-tag-version
    new_version=$custom_version
else
    new_version=$(npm version $bump_type --no-git-tag-version | sed 's/^v//')
fi

print_status "Version bumped to: $new_version"

# Run tests to ensure everything still works
print_status "Running tests..."
npm test

# Build the extension
print_status "Building extension..."
npm run package

# Commit the version bump
git add package.json package-lock.json
git commit -m "chore: bump version to $new_version"

print_status "Version bump committed successfully!"
print_warning "Next steps:"
echo "1. Push changes: git push origin dev"
echo "2. Create PR from dev to main"
echo "3. After PR is merged, the release will be automatically created"
echo ""
print_status "Release preparation complete!"

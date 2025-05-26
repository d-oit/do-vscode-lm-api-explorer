#!/bin/bash

# Ensure we are in the correct directory
# cd d:/git/do-vscode-lm-api-explorer # No need, tool handles path

# Check if the current branch is main
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$CURRENT_BRANCH" != "main" ]; then
  echo "Error: You must be on the 'main' branch to create a release."
  exit 1
fi

# Prompt for the new version number
read -p "Enter the new version number (e.g., 1.0.0): " NEW_VERSION

# Validate version format (basic check)
if ! [[ $NEW_VERSION =~ ^[0-9]+\.[0-9]+\.[0-9]+(-.+)?$ ]]; then
  echo "Invalid version format. Please use semantic versioning (e.g., 1.0.0)."
  exit 1
fi

# Use npm version to update package.json and create the tag
# The -m flag adds a message to the commit and tag
echo "Updating package.json and creating git tag v$NEW_VERSION..."
npm version $NEW_VERSION -m "Release v%s"

# Check if npm version was successful
if [ $? -ne 0 ]; then
  echo "npm version failed. Aborting."
  exit 1
fi

# Push the new tag to origin
echo "Pushing tag v$NEW_VERSION to origin..."
git push origin v$NEW_VERSION

# Check if git push was successful
if [ $? -ne 0 ]; then
  echo "git push failed. Aborting."
  exit 1
fi

echo "Tag v$NEW_VERSION pushed successfully."
echo "Now go to GitHub Actions to trigger the 'Create GitHub Release' workflow manually."

exit 0
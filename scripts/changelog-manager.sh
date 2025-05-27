#!/bin/bash
# Changeset and Changelog Manager for VS Code Extension Releases
# This script helps manage release changesets and automatically updates the changelog.

set -e

# Configuration
CHANGESET_DIR=".changeset"
CHANGELOG_FILE="CHANGELOG.md"
PACKAGE_JSON_FILE="package.json"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
GRAY='\033[0;37m'
NC='\033[0m' # No Color

# Ensure we're in the project root
if [ ! -f "$PACKAGE_JSON_FILE" ]; then
    echo -e "${RED}Error: package.json not found. Please run this script from the project root.${NC}"
    exit 1
fi

# Create changeset directory if it doesn't exist
if [ ! -d "$CHANGESET_DIR" ]; then
    mkdir -p "$CHANGESET_DIR"
    echo -e "${GREEN}Created changeset directory: $CHANGESET_DIR${NC}"
fi

# Functions
get_change_type_from_git() {
    local count=${1:-10}
    
    # Check if we're in a git repository
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        echo "patch"
        return
    fi
    
    # Get recent commit messages
    local commits=$(git log --oneline -n "$count" --pretty=format:"%s" 2>/dev/null)
    
    if [ -z "$commits" ]; then
        echo "patch"
        return
    fi
    
    # Keywords that indicate different change types
    local breaking_keywords="breaking major break remove delete deprecate"
    local feature_keywords="feat feature add new implement create"
    local fix_keywords="fix bug patch repair resolve correct"
    local enhancement_keywords="enhance improve update upgrade optimize refactor"
    
    local major_score=0
    local minor_score=0
    local patch_score=0
    
    echo -e "${CYAN}Analyzing recent commits for change type...${NC}" >&2
    
    while IFS= read -r commit; do
        local message=$(echo "$commit" | tr '[:upper:]' '[:lower:]')
        echo -e "  ${GRAY}$commit${NC}" >&2
        
        # Check for breaking changes
        for keyword in $breaking_keywords; do
            if echo "$message" | grep -q "$keyword"; then
                major_score=$((major_score + 3))
                echo -e "    ${RED}-> Breaking change detected: '$keyword'${NC}" >&2
            fi
        done
        
        # Check for new features
        for keyword in $feature_keywords; do
            if echo "$message" | grep -q "$keyword"; then
                minor_score=$((minor_score + 2))
                echo -e "    ${GREEN}-> Feature detected: '$keyword'${NC}" >&2
            fi
        done
        
        # Check for fixes
        for keyword in $fix_keywords; do
            if echo "$message" | grep -q "$keyword"; then
                patch_score=$((patch_score + 1))
                echo -e "    ${BLUE}-> Fix detected: '$keyword'${NC}" >&2
            fi
        done
        
        # Check for enhancements
        for keyword in $enhancement_keywords; do
            if echo "$message" | grep -q "$keyword"; then
                minor_score=$((minor_score + 1))
                echo -e "    ${YELLOW}-> Enhancement detected: '$keyword'${NC}" >&2
            fi
        done
    done <<< "$commits"
    
    # Determine the change type based on scores
    local detected_type="patch"
    
    if [ $major_score -gt 0 ]; then
        detected_type="major"
    elif [ $minor_score -gt $patch_score ]; then
        detected_type="minor"
    fi
    
    echo -e "\n${CYAN}Score analysis:${NC}" >&2
    echo -e "  ${RED}Major (breaking): $major_score${NC}" >&2
    echo -e "  ${GREEN}Minor (features): $minor_score${NC}" >&2
    echo -e "  ${BLUE}Patch (fixes): $patch_score${NC}" >&2
    echo -e "  ${NC}Detected type: $detected_type${NC}" >&2
    
    echo "$detected_type"
}

get_changes_from_git() {
    local count=${1:-10}
    
    # Check if we're in a git repository
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        echo "Recent changes (git history not available)"
        return
    fi
    
    # Get recent commit messages
    local commits=$(git log --oneline -n "$count" --pretty=format:"%s" 2>/dev/null)
    
    if [ -z "$commits" ]; then
        echo "Recent changes based on git commits"
        return
    fi
    
    local changes=()
    local processed_messages=()
    
    while IFS= read -r commit; do
        local message="$commit"
        
        # Skip if we've already processed this message
        local already_processed=false
        for processed in "${processed_messages[@]}"; do
            if [ "$processed" = "$message" ]; then
                already_processed=true
                break
            fi
        done
        
        if [ "$already_processed" = true ]; then
            continue
        fi
        
        processed_messages+=("$message")
        
        # Clean up commit message
        local clean_message=$(echo "$message" | sed -E 's/^(feat|fix|docs|style|refactor|test|chore)(\(.+\))?:\s*//')
        clean_message=$(echo "$clean_message" | sed -E 's/^(Merge|merge)\s+.*//')
        
        if [ -n "$clean_message" ] && [ ${#clean_message} -gt 10 ]; then
            # Capitalize first letter
            clean_message="$(echo "${clean_message:0:1}" | tr '[:lower:]' '[:upper:]')${clean_message:1}"
            changes+=("$clean_message")
        fi
    done <<< "$commits"
    
    if [ ${#changes[@]} -eq 0 ]; then
        echo "Recent changes based on git commits"
        return
    fi
    
    for change in "${changes[@]}"; do
        echo "$change"
    done
}

get_current_version() {
    node -p "require('./package.json').version"
}

get_next_version() {
    local current_version="$1"
    local type="$2"
    
    IFS='.' read -ra VERSION_PARTS <<< "$current_version"
    local major=${VERSION_PARTS[0]}
    local minor=${VERSION_PARTS[1]}
    local patch=${VERSION_PARTS[2]}
    
    # Handle 0.x versioning (pre-1.0 releases)
    if [ "$major" -eq 0 ]; then
        case "$type" in
            "major")
                # In 0.x, major changes increment minor version
                minor=$((minor + 1))
                patch=0
                ;;
            "minor")
                # In 0.x, minor changes also increment minor version
                minor=$((minor + 1))
                patch=0
                ;;
            "patch")
                patch=$((patch + 1))
                ;;
            "auto")
                TYPE="auto"
                ;;
            "prerelease")
                patch=$((patch + 1))
                echo "$major.$minor.$patch-beta.1"
                return
                ;;
        esac
    else
        # Standard semantic versioning for 1.0+
        case "$type" in
            "major")
                major=$((major + 1))
                minor=0
                patch=0
                ;;
            "minor")
                minor=$((minor + 1))
                patch=0
                ;;
            "patch")
                patch=$((patch + 1))
                ;;
            "auto")
                TYPE="auto"
                ;;
            "prerelease")
                patch=$((patch + 1))
                echo "$major.$minor.$patch-beta.1"
                return
                ;;
        esac
    fi
    
    echo "$major.$minor.$patch"
}

create_changeset() {
    local change_type="$1"
    local description="$2"
    shift 2
    local changes=("$@")
    
    local timestamp=$(date +"%Y%m%d-%H%M%S")
    local filename="$CHANGESET_DIR/$timestamp-$change_type.md"
    
    cat > "$filename" << EOF
---
type: $change_type
description: $description
date: $(date +"%Y-%m-%d")
---

# $description

EOF
    
    for change in "${changes[@]}"; do
        echo "- $change" >> "$filename"
    done
    
    echo -e "${GREEN}Created changeset: $filename${NC}"
}

interactive_changeset() {
    echo -e "\n${CYAN}=== Interactive Changeset Creation ===${NC}"
    
    local types=("feature" "enhancement" "fix" "breaking" "security" "deprecation" "removal")
    echo -e "\nAvailable change types:"
    for i in "${!types[@]}"; do
        echo "  $((i + 1)). ${types[i]}"
    done
    
    while true; do
        read -p $'\nSelect change type (1-7): ' type_choice
        if [[ "$type_choice" =~ ^[1-7]$ ]]; then
            selected_type="${types[$((type_choice - 1))]}"
            break
        fi
        echo -e "${RED}Invalid choice. Please select 1-7.${NC}"
    done
    
    read -p $'\nEnter a brief description of this changeset: ' description
    
    echo -e "\nEnter individual changes (press Enter on empty line to finish):"
    local changes=()
    while true; do
        read -p "- " change
        if [ -z "$change" ]; then
            break
        fi
        changes+=("$change")
    done
    
    if [ ${#changes[@]} -eq 0 ]; then
        echo -e "${YELLOW}No changes entered. Cancelling changeset creation.${NC}"
        return
    fi
    
    create_changeset "$selected_type" "$description" "${changes[@]}"
}

update_changelog() {
    local new_version="$1"
    local current_date=$(date +"%Y-%m-%d")
    
    # Read existing changelog
    local changelog_content=$(cat "$CHANGELOG_FILE")
    
    # Process changesets
    local new_entry="\n## [$new_version] - $current_date"
    
    # Group changes by type
    declare -A grouped_changes
    grouped_changes["Added"]=""
    grouped_changes["Changed"]=""
    grouped_changes["Fixed"]=""
    grouped_changes["Removed"]=""
    grouped_changes["Security"]=""
    grouped_changes["Deprecated"]=""
    
    if [ -d "$CHANGESET_DIR" ]; then
        for changeset_file in "$CHANGESET_DIR"/*.md; do
            if [ -f "$changeset_file" ] && [ "$(basename "$changeset_file")" != "README.md" ]; then
                local type=""
                local category="Fixed"
                local description=""
                
                # Check if it's new YAML frontmatter format
                if grep -q "^---$" "$changeset_file"; then
                    # Extract from YAML frontmatter format
                    local yaml_content=$(sed -n '/^---$/,/^---$/p' "$changeset_file" | grep -E '^\s*".*":\s*(patch|minor|major|fix|feature|breaking)')
                    if echo "$yaml_content" | grep -q "patch\|fix"; then
                        type="fix"
                        category="Fixed"
                    elif echo "$yaml_content" | grep -q "minor\|feature"; then
                        type="feature" 
                        category="Added"
                    elif echo "$yaml_content" | grep -q "major\|breaking"; then
                        type="breaking"
                        category="Changed"
                    fi
                    
                    # Extract description from content after frontmatter
                    description=$(sed -n '/^---$/,$p' "$changeset_file" | tail -n +2 | sed '/^---$/d' | sed '/^$/d' | head -1)
                else
                    # Old format - extract type and description
                    type=$(grep "^type:" "$changeset_file" | cut -d' ' -f2)
                    description=$(grep "^description:" "$changeset_file" | cut -d' ' -f2-)
                    
                    case "$type" in
                        "feature") category="Added" ;;
                        "enhancement") category="Changed" ;;
                        "fix") category="Fixed" ;;
                        "breaking") category="Changed" ;;
                        "security") category="Security" ;;
                        "deprecation") category="Deprecated" ;;
                        "removal") category="Removed" ;;
                    esac
                fi
                
                # Extract changes from changeset (both formats can have - bullets)
                local changes=$(grep "^- " "$changeset_file" | while read line; do echo "$line"; done)
                
                # If no bullet points found, use the description as a change
                if [ -z "$changes" ] && [ -n "$description" ]; then
                    changes="- $description"
                fi
                
                if [ -n "$changes" ]; then
                    grouped_changes["$category"]+="$changes"$'\n'
                fi
            fi
        done
    fi
    
    new_entry+="\n"
    
    # Add grouped changes to entry
    for category in "Added" "Changed" "Fixed" "Removed" "Security" "Deprecated"; do
        if [ -n "${grouped_changes[$category]}" ]; then
            new_entry+="\n### $category\n"
            new_entry+="${grouped_changes[$category]}"
        fi
    done
    
    # Insert new entry into changelog
    local header_end=$(echo "$changelog_content" | grep -n "^## \[" | head -1 | cut -d: -f1)
    if [ -z "$header_end" ]; then
        header_end=$(echo "$changelog_content" | wc -l)
    else
        header_end=$((header_end - 1))
    fi
    
    local header=$(echo "$changelog_content" | head -n "$header_end")
    local rest=$(echo "$changelog_content" | tail -n +$((header_end + 1)))
    
    echo -e "$header$new_entry\n$rest" > "$CHANGELOG_FILE"
    echo -e "${GREEN}Updated changelog with version $new_version${NC}"
}

update_package_version() {
    local new_version="$1"
    
    # Update package.json version using node
    node -e "
        const fs = require('fs');
        const pkg = JSON.parse(fs.readFileSync('$PACKAGE_JSON_FILE', 'utf8'));
        pkg.version = '$new_version';
        fs.writeFileSync('$PACKAGE_JSON_FILE', JSON.stringify(pkg, null, 2) + '\n');
    "
    
    echo -e "${GREEN}Updated package.json version to $new_version${NC}"
}

remove_processed_changesets() {
    if [ -d "$CHANGESET_DIR" ]; then
        for changeset_file in "$CHANGESET_DIR"/*.md; do
            if [ -f "$changeset_file" ] && [ "$(basename "$changeset_file")" != "README.md" ]; then
                rm "$changeset_file"
                echo -e "${YELLOW}Removed processed changeset: $changeset_file${NC}"
            fi
        done
    fi
}

show_changeset_status() {
    echo -e "\n${CYAN}=== Changeset Status Report ===${NC}"
    
    # Get current version
    local current_version=$(get_current_version)
    echo -e "Current version: ${GREEN}$current_version${NC}"
    
    # Check if changeset directory exists
    if [ ! -d "$CHANGESET_DIR" ]; then
        echo -e "${YELLOW}No changeset directory found${NC}"
        return
    fi
    
    # Count changesets
    local changeset_count=0
    local changeset_files=()
    
    for changeset_file in "$CHANGESET_DIR"/*.md; do
        if [ -f "$changeset_file" ] && [ "$(basename "$changeset_file")" != "README.md" ]; then
            changeset_files+=("$changeset_file")
            changeset_count=$((changeset_count + 1))
        fi
    done
    
    if [ $changeset_count -eq 0 ]; then
        echo -e "${YELLOW}No pending changesets found${NC}"
        echo -e "${GRAY}Run './scripts/changelog-manager.sh -c create-changeset' to create a new changeset${NC}"
        return
    fi
    
    echo -e "Pending changesets: ${GREEN}$changeset_count${NC}"
    
    # Group changesets by type
    declare -A type_counts
    declare -A type_files
    
    for changeset_file in "${changeset_files[@]}"; do
        local type=""
        
        # Check if it's new YAML frontmatter format
        if grep -q "^---$" "$changeset_file"; then
            # Extract from YAML frontmatter format
            local yaml_content=$(sed -n '/^---$/,/^---$/p' "$changeset_file" | grep -E '^\s*".*":\s*(patch|minor|major|fix|feature|breaking)')
            if echo "$yaml_content" | grep -q "patch\|fix"; then
                type="fix"
            elif echo "$yaml_content" | grep -q "minor\|feature"; then
                type="feature"
            elif echo "$yaml_content" | grep -q "major\|breaking"; then
                type="breaking"
            fi
        else
            # Old format
            type=$(grep "^type:" "$changeset_file" | cut -d' ' -f2 | tr -d '\r')
        fi
        
        if [ -n "$type" ]; then
            type_counts["$type"]=$((${type_counts["$type"]} + 1))
            if [ -z "${type_files["$type"]}" ]; then
                type_files["$type"]="$changeset_file"
            else
                type_files["$type"]="${type_files["$type"]}|$changeset_file"
            fi
        fi
    done
    
    echo -e "\n${CYAN}Changesets by type:${NC}"
    for type in "${!type_counts[@]}"; do
        echo -e "  ${GREEN}$type${NC}: ${type_counts[$type]}"
    done
    
    # Auto-detect recommended version bump
    local recommended_type=$(get_change_type_from_git 10)
    local next_version=$(get_next_version "$current_version" "$recommended_type")
    echo -e "\n${CYAN}Recommended version bump:${NC} ${GREEN}$recommended_type${NC}"
    echo -e "Next version would be: ${GREEN}$next_version${NC}"
    
    # Show detailed changeset information
    echo -e "\n${CYAN}Changeset details:${NC}"
    for changeset_file in "${changeset_files[@]}"; do
        local filename=$(basename "$changeset_file")
        local type=""
        local description=""
        local date=""
        
        # Check if it's new YAML frontmatter format
        if grep -q "^---$" "$changeset_file"; then
            # Extract from YAML frontmatter format
            local yaml_content=$(sed -n '/^---$/,/^---$/p' "$changeset_file" | grep -E '^\s*".*":\s*(patch|minor|major|fix|feature|breaking)')
            if echo "$yaml_content" | grep -q "patch\|fix"; then
                type="fix"
            elif echo "$yaml_content" | grep -q "minor\|feature"; then
                type="feature"
            elif echo "$yaml_content" | grep -q "major\|breaking"; then
                type="breaking"
            fi
            
            # Extract description from content after frontmatter
            description=$(sed -n '/^---$/,$p' "$changeset_file" | tail -n +2 | sed '/^---$/d' | sed '/^$/d' | head -1)
            date="N/A (YAML format)"
        else
            # Old format
            type=$(grep "^type:" "$changeset_file" | cut -d' ' -f2 | tr -d '\r')
            description=$(grep "^description:" "$changeset_file" | cut -d' ' -f2- | tr -d '\r')
            date=$(grep "^date:" "$changeset_file" | cut -d' ' -f2 | tr -d '\r')
        fi
        
        echo -e "  ${YELLOW}$filename${NC}"
        echo -e "    Type: $type"
        echo -e "    Description: $description"
        echo -e "    Date: $date"
        
        # Show changes
        local changes=$(grep "^- " "$changeset_file")
        if [ -n "$changes" ]; then
            echo -e "    Changes:"
            while IFS= read -r change; do
                echo -e "      $change"
            done <<< "$changes"
            fi
        echo
    done
    
    echo -e "${CYAN}Ready for release processing!${NC}"
    echo -e "${GRAY}Run './scripts/changelog-manager.sh -c update-changelog' to process changesets${NC}"
}

process_ci_release() {
    echo -e "\n${CYAN}=== CI/CD Release Processing ===${NC}"
    
    # Get current version
    local current_version=$(get_current_version)
    echo -e "Current version: ${GREEN}$current_version${NC}"
    
    # Check if we have any changesets to process
    local changeset_count=0
    if [ -d "$CHANGESET_DIR" ]; then
        for changeset_file in "$CHANGESET_DIR"/*.md; do
            if [ -f "$changeset_file" ] && [ "$(basename "$changeset_file")" != "README.md" ]; then
                changeset_count=$((changeset_count + 1))
            fi
        done
    fi
    
    if [ $changeset_count -eq 0 ]; then
        echo -e "${YELLOW}No changesets found to process${NC}"
        
        # Set GitHub Actions outputs for no changes
        if [ -n "$GITHUB_OUTPUT" ]; then
            echo "has_changesets=false" >> "$GITHUB_OUTPUT"
            echo "changeset_count=0" >> "$GITHUB_OUTPUT"
            echo "current_version=$current_version" >> "$GITHUB_OUTPUT"
            echo "needs_release=false" >> "$GITHUB_OUTPUT"
        fi
        
        return
    fi
    
    echo -e "Processing ${GREEN}$changeset_count${NC} changesets..."
    
    # Auto-detect version type
    local version_type="patch"
    if [ -n "$TYPE" ] && [ "$TYPE" != "auto" ]; then
        version_type="$TYPE"
    else
        echo -e "${CYAN}Auto-detecting version type from changesets and git history...${NC}"
        
        # Check changesets for breaking changes or features
        local has_breaking=false
        local has_features=false
        
        for changeset_file in "$CHANGESET_DIR"/*.md; do
            if [ -f "$changeset_file" ] && [ "$(basename "$changeset_file")" != "README.md" ]; then
                local type=""
                
                # Check if it's new YAML frontmatter format
                if grep -q "^---$" "$changeset_file"; then
                    # Extract from YAML frontmatter format
                    local yaml_content=$(sed -n '/^---$/,/^---$/p' "$changeset_file" | grep -E '^\s*".*":\s*(patch|minor|major|fix|feature|breaking)')
                    if echo "$yaml_content" | grep -q "major\|breaking"; then
                        type="breaking"
                    elif echo "$yaml_content" | grep -q "minor\|feature"; then
                        type="feature"
                    elif echo "$yaml_content" | grep -q "patch\|fix"; then
                        type="fix"
                    fi
                else
                    # Old format
                    type=$(grep "^type:" "$changeset_file" | cut -d' ' -f2 | tr -d '\r')
                fi
                
                case "$type" in
                    "breaking"|"major") has_breaking=true ;;
                    "feature"|"enhancement") has_features=true ;;
                esac
            fi
        done
        
        if [ "$has_breaking" = true ]; then
            version_type="major"
        elif [ "$has_features" = true ]; then
            version_type="minor"
        else
            version_type="patch"
        fi
        
        echo -e "${GREEN}Auto-detected version type: $version_type${NC}"
    fi
    
    # Calculate next version
    local next_version=$(get_next_version "$current_version" "$version_type")
    echo -e "Next version: ${GREEN}$next_version${NC}"
    
    # Process changesets
    echo -e "\n${CYAN}Updating changelog and version...${NC}"
    update_changelog "$next_version"
    update_package_version "$next_version"
    remove_processed_changesets
    
    echo -e "\n${GREEN}CI/CD release processing completed!${NC}"
    echo -e "Version updated: ${GREEN}$current_version${NC} → ${GREEN}$next_version${NC}"
    
    # Set GitHub Actions outputs
    if [ -n "$GITHUB_OUTPUT" ]; then
        echo "has_changesets=true" >> "$GITHUB_OUTPUT"
        echo "changeset_count=$changeset_count" >> "$GITHUB_OUTPUT"
        echo "previous_version=$current_version" >> "$GITHUB_OUTPUT"
        echo "new_version=$next_version" >> "$GITHUB_OUTPUT"
        echo "version_type=$version_type" >> "$GITHUB_OUTPUT"
        echo "needs_release=true" >> "$GITHUB_OUTPUT"
        
        echo -e "\n${CYAN}GitHub Actions outputs set:${NC}"
        echo -e "  has_changesets=true"
        echo -e "  changeset_count=$changeset_count"
        echo -e "  previous_version=$current_version"
        echo -e "  new_version=$next_version"
        echo -e "  version_type=$version_type"
        echo -e "  needs_release=true"
    fi
    
    echo -e "\n${GRAY}Files updated:${NC}"
    echo -e "  - CHANGELOG.md"
    echo -e "  - package.json"
    echo -e "  - Processed changesets removed"
}

# Command line argument parsing
COMMAND=""
VERSION=""
TYPE="patch"
MESSAGE=""
INTERACTIVE=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -c|--command)
            COMMAND="$2"
            shift 2
            ;;
        -v|--version)
            VERSION="$2"
            shift 2
            ;;
        -t|--type)
            TYPE="$2"
            shift 2
            ;;
        -m|--message)
            MESSAGE="$2"
            shift 2
            ;;
        -i|--interactive)
            INTERACTIVE=true
            shift
            ;;
        -h|--help)
            echo "Usage: $0 -c COMMAND [OPTIONS]"
            echo ""
            echo "Commands:"
            echo "  create-changeset    Create a new changeset"
            echo "  update-changelog    Update changelog from changesets"
            echo "  prepare-release     Prepare a release"
            echo "  full-release        Full release process"
            echo "  status             Show changeset status and information"
            echo "  ci-release         CI/CD release processing with GitHub Actions output"
            echo ""
            echo "Options:"
            echo "  -v, --version VERSION    Version for the release"
            echo "  -t, --type TYPE         Change type: major, minor, patch, prerelease, auto"
            echo "  -m, --message MESSAGE   Description of changes"
            echo "  -i, --interactive       Run in interactive mode"
            echo "  -h, --help             Show this help"
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            exit 1
            ;;
    esac
done

if [ -z "$COMMAND" ]; then
    echo -e "${RED}Error: Command is required. Use -h for help.${NC}"
    exit 1
fi

# Main command execution
case "$COMMAND" in
    "create-changeset")
        if [ "$INTERACTIVE" = true ]; then
            interactive_changeset
        else
            if [ -z "$MESSAGE" ]; then
                echo -e "${RED}Error: Message is required when not in interactive mode${NC}"
                exit 1
            fi
            create_changeset "$TYPE" "$MESSAGE" "$MESSAGE"
        fi
        ;;
    
    "update-changelog")
        if [ -z "$VERSION" ]; then
            current_version=$(get_current_version)
            
            # Handle auto type detection
            version_type="$TYPE"
            if [ "$TYPE" = "auto" ]; then
                echo -e "${CYAN}Auto-detecting change type from git commits...${NC}"
                version_type=$(get_change_type_from_git 10)
                echo -e "${GREEN}Auto-detected version type: $version_type${NC}"
            fi
            
            VERSION=$(get_next_version "$current_version" "$version_type")
            echo -e "${YELLOW}Auto-generated version: $VERSION${NC}"
        fi
        
        if [ ! -d "$CHANGESET_DIR" ] || [ -z "$(ls -A "$CHANGESET_DIR"/*.md 2>/dev/null | grep -v README.md)" ]; then
            echo -e "${YELLOW}No changesets found to process${NC}"
            exit 0
        fi
        
        update_changelog "$VERSION"
        update_package_version "$VERSION"
        remove_processed_changesets
        ;;
    
    "prepare-release")
        if [ -z "$VERSION" ]; then
            current_version=$(get_current_version)
            VERSION=$(get_next_version "$current_version" "$TYPE")
        fi
        
        echo -e "${CYAN}Preparing release $VERSION...${NC}"
        
        # Run the existing prepare-release script if it exists
        if [ -f "scripts/prepare-release.sh" ]; then
            bash "scripts/prepare-release.sh"
        fi
        
        echo -e "${GREEN}Release $VERSION prepared successfully!${NC}"
        echo -e "${YELLOW}Next steps:${NC}"
        echo "1. Review the changes in CHANGELOG.md"
        echo "2. Commit the changes: git add . && git commit -m \"Prepare release $VERSION\""
        echo "3. Create and push tag: git tag v$VERSION && git push origin v$VERSION"
        ;;
    
    "full-release")
        if [ -z "$VERSION" ]; then
            current_version=$(get_current_version)
            
            # Handle auto-detection
            version_type="$TYPE"
            if [ "$TYPE" = "auto" ]; then
                echo -e "${CYAN}Auto-detecting change type from git commits...${NC}"
                version_type=$(get_change_type_from_git 10)
                echo -e "${GREEN}Auto-detected version type: $version_type${NC}"
            fi
            
            VERSION=$(get_next_version "$current_version" "$version_type")
        fi
        
        echo -e "${CYAN}Starting full release process for version $VERSION...${NC}"
        
        # Process changesets and update changelog
        if [ -d "$CHANGESET_DIR" ] && [ -n "$(ls -A "$CHANGESET_DIR"/*.md 2>/dev/null)" ]; then
            update_changelog "$VERSION"
            remove_processed_changesets
        fi
        
        # Update package version
        update_package_version "$VERSION"
        
        # Removed the call to prepare-release.sh as it conflicts with the CI/CD workflow
        # if [ -f "scripts/prepare-release.sh" ]; then
        #     bash "scripts/prepare-release.sh"
        # fi
        
        echo -e "\n${GREEN}Full release $VERSION completed!${NC}"
        echo -e "${YELLOW}Ready to commit and tag the release.${NC}"
        ;;
    
    "status")
        show_changeset_status
        ;;
    
    "ci-release")
        process_ci_release
        ;;
    
    *)
        echo -e "${RED}Error: Unknown command '$COMMAND'${NC}"
        exit 1
        ;;
esac

echo -e "\n${GREEN}Changelog management completed!${NC}"

# Change Log

All notable changes to the "do-vscode-lm-explorer" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.



## [0.8.11] - 2025-07-14

### Changed

- Automatic patch release with latest changes

## [0.8.10] - 2025-07-12

### Changed

- Automatic patch release with latest changes

## [0.8.9] - 2025-07-09

### Changed

- Automatic patch release with latest changes

## [0.8.8] - 2025-07-02

### Fixed
- Replace softprops/action-gh-release with GitHub CLI for more reliable release creation
- Add automatic patch release support for commits without changesets
- Improve release decision logic and error handling
- Add support for manual release triggers with version type selection
- Enhance workflow conditions and resource utilization

## [0.8.6] - 2025-07-01

## [0.8.5] - 2025-06-17

## [0.8.4] - 2025-06-13

## [0.8.3] - 2025-05-27

### Fixed
- Fix changelog manager to correctly handle modern YAML frontmatter and version type detection

## [0.8.1] - 2025-05-27

### Fixed
- Resolved "No AI models found" issue on first startup by improving permission handling
- Fixed permission consent dialogs that only worked on second attempt
- Improved model discovery to align with VS Code Language Model API permission system
- Enhanced diagnostic logging for model permission status without triggering consent dialogs
- Removed problematic permission checking during model discovery that interfered with natural consent flow

## [0.8.0] - 2025-05-27

### Changed
- ModelService constructor now accepts optional ExtensionContext parameter for permission diagnostics
- Permission consent dialogs now appear naturally when users test models rather than during discovery
- Improved error handling flow to guide users through permission consent process

## [0.8.0] - 2025-05-27

### Fixed
- Complete GitHub Actions release workflow validation and automation
- Fixed pre-commit hook to allow GitHub Actions automated commits
- Resolved all CI/CD pipeline issues for automated releases
- Verified end-to-end release process with proper version detection

## [0.7.0] - 2025-05-27

### Fixed
- Complete validation of GitHub Actions release workflow fixes
- Verified automated version detection and changeset processing
- Confirmed CI/CD pipeline integration works end-to-end


## [0.6.0] - 2025-05-27

### Changed
- Final validation test for complete GitHub Actions workflow

## [0.5.0] - 2025-05-27

### Fixed
- Fixed GitHub Actions release workflow failure with automated version detection
- Resolved version calculation bugs in changelog manager script 
- Fixed debug output contamination in auto-detection logic
- Enhanced error handling for version type detection
- Cleaned up changelog entries and removed test duplicates


## [0.4.0] - 2025-05-27 - Enhanced CI/CD with changeset management

### Added
- Comprehensive changeset management system with Bash scripts
- Auto-detection of change types from Git commits with keyword analysis
- Interactive changeset creation with guided prompts and auto-generation options
- Automated changelog generation from changesets with proper categorization
- CI/CD integration with GitHub Actions for automated releases
- Status reporting commands for changeset information and analysis
- NPM scripts for complete changeset workflow management
- GitHub release creation with VSIX file attachment and changelog integration

### Changed
- Enhanced release workflow with changelog extraction and error handling
- Improved version management with automatic semantic versioning  
- Updated documentation with comprehensive CI/CD integration guides
- Migrated from PowerShell to Bash-only scripts for cross-platform compatibility
- Added Git commit analysis to automatically detect change type (major, minor, patch)
- Enhanced interactive changeset creation with auto option
- Added keyword-based detection for breaking changes, features, fixes, and enhancements
- Implemented auto-generation of changeset descriptions and changes from git history
- Added scoring system to determine appropriate version bump based on commit patterns
- Added new npm scripts for auto-release workflows
- Improved user experience with confirmation prompts and detailed analysis output

## [0.3.2] - 2025-05-27 - Added comprehensive changelog management system

### Added
- Created Bash scripts for changeset management
- Added interactive changeset creation with guided prompts  
- Implemented automatic changelog generation from changesets
- Added version management with automatic bumping
- Integrated with existing release workflow
- Added comprehensive documentation and usage examples
- Created npm scripts for easy access to changelog tools

### Fixed
- Fixed OAuth token refresh mechanism
- Added better error handling for expired tokens
- Improved user feedback for authentication failures

## [0.3.1] - 2025-01-27 - First Run Permission Fix

### Fixed
- **First Run Error**: Fixed "No AI models found" error that occurred on the first run due to VS Code LM API permission requirements
- **Permission Handling**: Added proper handling for `vscode.LanguageModelError.NoPermissions` errors with user-friendly messages
- **User Experience**: Added "Try Again" functionality that re-executes the command after user grants permissions
- **Error Messages**: Improved error messages to guide users through the permission grant process

### Technical
- Enhanced `ModelService.ts` with specific permission error detection and handling
- Added permission-denied error handling in `extension.ts` with retry mechanism
- Fixed test infrastructure issues (TDD/BDD syntax mixing, missing test runner file)
- Ensured all tests pass with proper error handling coverage

## [0.3.0] - 2025-05-26 - Premium Request Warning & User Choice

### Added
- **Premium Request Warning**: Shows warning dialog after June 4, 2025 about GitHub Copilot premium request usage
- **User Choice Options**: Three options when premium warning appears:
  - "Test Models": Proceed with normal testing (consumes premium requests)
  - "Skip Testing": Discover models without testing to avoid premium requests
  - "Learn More": Opens GitHub's premium requests documentation
- **Skip Testing Mode**: Visual indicators (⏭️) and explanatory messages for skipped model testing
- **Date-Based Logic**: Automatic activation of warning based on current date vs. June 4, 2025
- **Enhanced UI**: New CSS styling for skipped testing state with warning background colors
- **Comprehensive Tests**: Added 4 new tests covering premium request warning scenarios

### Changed
- **Model Testing**: Now conditional based on user choice after premium warning
- **Success Messages**: Different notifications depending on whether testing was performed or skipped
- **Model Cards**: Enhanced to show testing status and premium request explanations
- **Constants**: Added new UI text, button labels, dates, and URLs for premium request handling

### Technical Details
- **Date Constant**: `DATES.PREMIUM_REQUEST_WARNING_START` set to June 4, 2025
- **Premium Request URL**: Links to official GitHub documentation about premium requests
- **Conditional Testing**: `testSkipped` flag in send results to track skipped models
- **Enhanced HTML Generator**: Handles both tested and skipped model states with appropriate styling

## [0.2.0] - 2025-05-25 - Modular Architecture & Enhanced Features

### Added
- **Modular Architecture**: Refactored into ModelService, HtmlGenerator, and type definitions
- **Accordion UI**: Collapsible sections for organized information display
- **Copy to Clipboard**: Professional SVG icons with toast notifications for all JSON sections
- **Complete API Documentation**: Full LanguageModelChatRequestOptions reference with examples
- **Cancellation Support**: User-controllable operation cancellation with progress tracking
- **Enhanced Error Handling**: Graceful handling of model failures and API issues
- **Type Safety**: Comprehensive TypeScript interfaces and error handling
- **VS Code Theme Integration**: Automatic light/dark theme adaptation
- **Security Enhancements**: XSS protection and safe HTML generation
- **Comprehensive Testing**: 36 passing tests covering all components

### Changed
- **UI/UX Improvements**: Responsive design with improved text handling and layout
- **Progress Reporting**: Detailed progress tracking with status updates during model operations
- **Error Messages**: Enhanced error display with clear explanations for unsupported models
- **Code Organization**: Clean separation of concerns for maintainability and extensibility

### Fixed
- **Model Capabilities**: Proper handling of model capabilities and feature detection
- **HTML Escaping**: Enhanced security measures to prevent XSS attacks
- **Memory Management**: Proper resource cleanup and disposal
- **TypeScript Errors**: Resolved all compilation and type safety issues

### Technical Details
- **ModelService**: Handles model discovery, testing, and data processing with cancellation support
- **HtmlGenerator**: Static methods for UI generation with accordion components
- **Types**: ExtendedLanguageModelChat interface and ModelExplorerData structure
- **Testing**: Unit tests for components, integration tests for real-world scenarios

## [0.0.1] - Initial Release

### Added
- Basic model discovery and testing functionality
- Simple HTML output with model information  
- GitHub Copilot integration setup
- Command registration for `Show all vscode-lm chat models`

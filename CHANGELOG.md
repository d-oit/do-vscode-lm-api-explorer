# Change Log

All notable changes to the "do-vscode-lm-explorer" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

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
# Change Log

All notable changes to the "do-vscode-lm-explorer" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

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
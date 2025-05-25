# d.o. vscode-lm Explorer

A **comprehensive VS Code extension** designed for developers to **explore, test, and understand** all available **Language Model (LM) API models** directly within their development environment. This powerful tool features a modern, modular architecture, an intuitive UI, complete API documentation, and robust error handling, making AI model integration seamless.

## 🌟 Why Choose This Extension?

-   **Accelerate AI Development**: Quickly discover and test models, reducing setup time.
-   **Deep Dive into LM APIs**: Access comprehensive documentation and real-world examples.
-   **Troubleshoot with Ease**: Identify unsupported models and API issues instantly.
-   **Streamlined Workflow**: Copy API parameters and test responses with one click.
-   **Future-Proof Your AI Apps**: Stay informed about model capabilities and compatibility.

## ✨ Features

### 🔍 **Model Discovery & Testing**

- **Automatic Discovery**: Finds all available VS Code LM API chat models
- **Live Testing**: Tests each model with a "hello" message to verify functionality  
- **Real-time Progress**: Shows detailed progress with cancellation support
- **Error Detection**: Identifies and clearly displays unsupported models

### 📊 **Comprehensive Model Information**

- **Model Metadata**: Name, ID, vendor, family, version, max input tokens
- **Capabilities**: Support for image-to-text, tool calling, and other features
- **Test Results**: Complete request/response data for each model
- **Support Status**: Visual indicators (✅/❌) for model availability

### 🎨 **Modern UI & UX**

- **Accordion Interface**: Collapsible sections for organized information display
- **VS Code Theme Integration**: Automatic light/dark theme adaptation
- **Copy to Clipboard**: One-click copying with professional SVG icons and toast notifications
- **Responsive Design**: Adapts to different screen sizes with proper text handling

### 📚 **Complete API Documentation**

- **LanguageModelChatRequestOptions**: Full parameter documentation with examples
- **Type Definitions**: Detailed TypeScript interfaces and type information
- **Model Options**: Comprehensive coverage of temperature, tokens, penalties, and more
- **Tool Integration**: Documentation for function calling and tool modes

### 🛡️ **Security & Performance**

- **XSS Protection**: HTML escaping and safe JavaScript execution
- **Cancellation Support**: User-controllable operation cancellation
- **Error Resilience**: Graceful handling of model failures and API issues
- **Memory Management**: Proper resource cleanup and disposal

### 🏗️ **Modular Architecture**

- **ModelService**: Handles model discovery, testing, and data processing
- **HtmlGenerator**: Manages UI generation with accordion components
- **Type Safety**: Comprehensive TypeScript interfaces and type definitions
- **Extensibility**: Clean separation of concerns for future enhancements

## 📸 Visuals

<video src="assets/Recording d.o. vscode-lm Explorer.mp4" controls autoplay loop muted style="width: 100%; max-width: 800px; display: block; margin: 0 auto; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
  Your browser does not support the video tag.
</video>
<p style="text-align: center; font-size: 0.9em; color: var(--vscode-descriptionForeground);">
  *(For best experience, view this video directly on GitHub or in a Markdown viewer that supports HTML video tags.)*
</p>

## 🚀 Getting Started

### Quick Start

1. Open VS Code Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`)
2. Run `AI Model Explorer: Discover & Test Available Models`
3. Explore comprehensive AI model information and test results

### What You'll See

- **Model Overview Table**: All available models with status indicators  
- **API Documentation**: Complete LanguageModelChatRequestOptions reference
- **Model Details**: Expandable accordion sections with:
  - Model metadata and capabilities
  - Live test results and response data
  - Copy-to-clipboard functionality for easy integration

## 🎯 Use Cases

**🔍 Discovery**: New to VS Code AI integration? Discover what models are available and working
**🛠️ Development**: Building AI-powered extensions? Get exact API parameters and test responses  
**🐛 Troubleshooting**: AI features not working? Test model compatibility and identify issues
**📊 Comparison**: Multiple AI providers? Compare capabilities and responses side-by-side

## 🔧 GitHub Copilot Setup

To access GitHub Copilot chat models through the VS Code Language Model API, you need:

### 📋 Prerequisites

1. **GitHub Copilot Subscription**: Active GitHub Copilot Individual, Business, or Enterprise subscription
2. **GitHub Copilot Chat Extension**: Install the "GitHub Copilot Chat" extension from the VS Code marketplace
3. **Authentication**: Sign in to your GitHub account in VS Code

### 🔧 Setup Steps

1. Install the GitHub Copilot Chat extension:
   - Open VS Code Extensions view (`Ctrl+Shift+X`)
   - Search for "GitHub Copilot Chat"
   - Install the official extension by GitHub

2. Sign in to GitHub:
   - Open Command Palette (`Ctrl+Shift+P`)
   - Run `GitHub Copilot: Sign In`
   - Follow the authentication flow

3. **Grant Language Model Access**:
   - The first time you run the extension's command (`AI Model Explorer: Discover & Test Available Models`), VS Code will prompt you to grant permission for this extension to access language models provided by GitHub Copilot Chat. **You must click "Allow"** for the extension to function correctly.
   - This prompt typically looks like: "The extension 'd.o. vscode-lm Explorer' wants to access the language models provided by GitHub Copilot Chat."

4. Verify access:
   - Run this extension's command `AI Model Explorer: Discover & Test Available Models` again.
   - You should now see GitHub Copilot models listed (e.g., `copilot-gpt-4o`).

### 🔍 Troubleshooting

- **No models showing**: Ensure you're signed in to GitHub and have an active Copilot subscription
- **Authentication issues**: Try `GitHub Copilot: Sign Out` then sign in again
- **Extension conflicts**: Disable other AI extensions temporarily to test

## 💻 Development & Architecture

### Modular Design

The extension uses a clean, modular architecture for maintainability and extensibility:

```
src/
├── extension.ts      # Main extension entry point with command registration
├── modelService.ts   # Model discovery, testing, and data processing
├── htmlGenerator.ts  # UI generation with accordion components  
├── types.ts         # TypeScript interfaces and type definitions
└── test/            # Comprehensive unit and integration tests
```

### Key Components

#### ModelService
- `fetchModels()`: Discovers available LM API models
- `buildModelSummary()`: Processes model metadata and capabilities
- `testModels()`: Tests model functionality with progress reporting

#### HtmlGenerator
- `generateHtml()`: Creates complete UI with accordion sections
- Theme integration and responsive design
- Copy-to-clipboard functionality and toast notifications

#### Type Definitions
- `ExtendedLanguageModelChat`: Enhanced model interface with capabilities
- `ModelExplorerData`: Data structure for UI generation
- Complete TypeScript coverage for type safety

## 🧪 Testing

The extension includes comprehensive test coverage:
- **36 passing tests** across unit and integration test suites
- **Modular component testing** for ModelService and HtmlGenerator
- **Cancellation and error handling** validation
- **HTML security and XSS protection** testing

Run tests with:
```bash
npm test
```

## 📋 Requirements

- VS Code with Language Model API support
- GitHub Copilot subscription (Individual, Business, or Enterprise)  
- GitHub Copilot Chat extension installed and authenticated

## 📦 Installation

### 📦 Install from VS Code Marketplace

The easiest way to get started is to install the extension directly from the Visual Studio Code Marketplace:

1.  Open VS Code.
2.  Go to the Extensions view (`Ctrl+Shift+X` or `Cmd+Shift+X`).
3.  Search for "d.o. vscode-lm Explorer".
4.  Click **Install**.

[Install d.o. vscode-lm Explorer Now!](https://marketplace.visualstudio.com/items?itemName=d.o.it.do-vscode-lm-explorer) *(Link will be updated upon publication)*

### From Source
1. Clone this repository
2. Run `npm install` to install dependencies
3. Run `npm run compile` to build the extension
4. Press `F5` to launch a new Extension Development Host window

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues, feature requests, or pull requests.

### Development Setup
```bash
git clone <repository-url>
cd vscodeLMext
npm install
npm run compile
```

### Building
```bash
npm run package  # Build for production
npm run watch    # Watch mode for development
```

## 📝 Release Notes

### 0.2.0 (Latest) - Modular Architecture & Enhanced Features

#### 🏗️ **Architecture Overhaul**
- **Modular Design**: Refactored into ModelService, HtmlGenerator, and type definitions
- **Type Safety**: Comprehensive TypeScript interfaces and error handling
- **Clean Separation**: Organized code structure for maintainability and extensibility

#### 🎨 **UI/UX Enhancements** 
- **Accordion Interface**: Collapsible sections for organized information display
- **VS Code Theme Integration**: Automatic light/dark theme adaptation
- **Copy to Clipboard**: Professional SVG icons with toast notifications
- **Responsive Design**: Improved text handling and layout across screen sizes

#### 📚 **Enhanced Documentation**
- **Complete API Reference**: Full LanguageModelChatRequestOptions documentation
- **Parameter Examples**: Detailed examples for temperature, tokens, tools, and more
- **Type Definitions**: In-UI TypeScript interface documentation
- **Model Capabilities**: Enhanced capability detection and display

#### 🛡️ **Reliability & Security**
- **Cancellation Support**: User-controllable operation cancellation
- **Error Resilience**: Graceful handling of model failures and API issues
- **XSS Protection**: Enhanced HTML escaping and security measures
- **Progress Tracking**: Detailed progress reporting with status updates

#### 🧪 **Quality Assurance**
- **Comprehensive Testing**: 36 passing tests covering all components
- **Integration Tests**: Real-world scenario validation
- **Security Testing**: XSS protection and HTML validation
- **Performance Testing**: Concurrent operation stability

### 0.0.1 - Initial Release
- Basic model discovery and testing functionality
- Simple HTML output with model information
- GitHub Copilot integration setup

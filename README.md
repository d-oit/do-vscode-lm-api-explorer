![gallery](https://github.com/user-attachments/assets/379dcf8c-dd7c-47b6-8bd0-9a025f5f3a17)

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
- **Smart Testing**: Conditionally tests each model with a "hello" message to verify functionality, based on user choice after the premium request warning (starting June 4, 2025)
- **Premium Request Awareness**: Starting June 4, 2025, shows warning about GitHub Copilot premium request usage
- **User Choice Options**: Provides clear options to either test models (potentially consuming premium requests) or skip testing to avoid usage, especially relevant after the premium request warning date.
- **Real-time Progress**: Shows detailed progress with cancellation support
- **Error Detection**: Identifies and clearly displays unsupported models

### 📊 **Comprehensive Model Information**

- **Model Metadata**: Name, ID, vendor, family, version, max input tokens
- **Capabilities**: Support for image-to-text, tool calling, and other features
- **Test Results**: Complete request/response data for each model (when testing is performed)
- **Support Status**: Visual indicators (✅/❌/⏭️) for model availability and testing status
- **Premium Request Info**: Clear indicators when testing was skipped to avoid premium usage

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
- **Memory Management**: Proper resource cleanup and disposal with enhanced disposable safety
- **Test Environment Safety**: Robust error handling and cleanup in development/testing scenarios

### 🏗️ **Modular Architecture**

- **ModelService**: Handles model discovery, testing, and data processing
- **HtmlGenerator**: Manages UI generation with accordion components
- **Type Safety**: Comprehensive TypeScript interfaces and type definitions
- **Extensibility**: Clean separation of concerns for future enhancements

### ⚠️ **Premium Request Management**

- **Smart Warning System**: Starting June 4, 2025, shows informative dialog about GitHub Copilot premium request usage
- **User Choice Options**: When premium billing is active, choose how to proceed:
  - **"Test Models"**: Run full testing (consumes premium requests from your GitHub Copilot quota)
  - **"Skip Testing"**: Discover models without testing to avoid premium request usage
  - **"Learn More"**: Access official GitHub documentation about premium requests
- **Visual Indicators**: Clear status icons (⏭️) and explanatory messages for skipped testing
- **Transparent Usage**: Always informed about when premium requests will be consumed

## 📸 Visuals

https://github.com/user-attachments/assets/0e724a25-f20d-47e6-81f6-e00eff36e6fb

<p style="text-align: center; font-size: 0.9em; color: var(--vscode-descriptionForeground);">
  *(For best experience, view this video directly on GitHub or in a Markdown viewer that supports HTML video tags.)*
</p>

## 🚀 Getting Started

### Quick Start

1. Open VS Code Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`)
2. Run `AI Model Explorer: Discover & Test Available Models`
3. If prompted (after June 4, 2025), choose your preferred testing approach regarding premium requests
4. Optionally, run `AI Model Explorer: Clear Cache and Discover Available Models` to force a fresh discovery and clear cached results.
5. Explore comprehensive AI model information and test results

### What You'll See

- **Premium Request Dialog**: (After June 4, 2025) Choice between testing models or skipping to avoid premium usage.  [About premium request](https://docs.github.com/en/copilot/managing-copilot/monitoring-usage-and-entitlements/about-premium-requests)
- **Model Overview Table**: All available models with status indicators (✅/❌/⏭️)
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
- Handles model discovery, testing, and data processing. Includes a caching mechanism for models and test results to improve performance on subsequent runs.
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
- **62 passing tests** across unit and integration test suites
- **Modular component testing** for ModelService and HtmlGenerator
- **Cancellation and error handling** validation
- **HTML security and XSS protection** testing
- **Disposable management and memory safety** testing

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

TODO: not published yet - this was only a test to try out how it works!

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

### Development Workflow

This project uses a **GitFlow-inspired branching strategy** with automated CI/CD:

#### 🌿 **Branch Strategy**
- **`dev` branch**: All development work happens here
- **`main` branch**: Release-only branch with automated publishing
- **Feature branches**: Created from and merged back into `dev`

#### 🔄 **Release Process**
1. **Development**: Work in `dev` branch or feature branches
2. **Version Bump**: Use release helper script:
   ```powershell
   npm run release:prepare
   # or for bash: npm run release:prepare:bash
   ```
3. **Create PR**: From `dev` to `main` branch
4. **Automated Release**: Upon merge to `main`:
   - Creates GitHub release with auto-generated notes
   - Publishes to VS Code Marketplace
   - Tags version automatically

#### 🚀 **CI/CD Pipelines**
- **Development CI**: Runs tests and creates build artifacts for `dev` branch
- **Main Protection**: Validates PRs to `main` (version bump, tests, builds)
- **Release Automation**: Publishes to GitHub and VS Code Marketplace on `main` push

### Development Setup
```bash
git clone <repository-url>
cd do-vscode-lm-explorer
npm install
npm run compile
```

### Building
```bash
npm run package  # Build for production
npm run watch    # Watch mode for development
```

#### 🛠️ **Available Scripts**
- `npm run release:prepare` - Interactive version bump and release preparation
- `npm test` - Run test suite
- `npm run lint` - Code linting
- `npm run check-types` - TypeScript type checking

For detailed CI/CD documentation, see [`.github/WORKFLOW_DOCUMENTATION.md`](.github/WORKFLOW_DOCUMENTATION.md).


## Disclaimer

This project is provided "as is" without warranty of any kind. Use at your own risk. The authors are not responsible for any damage or loss caused by the use of this software.

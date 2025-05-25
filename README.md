# d.o. vscode-lm Explorer

This extension lists all available language models in your VS Code environment and displays all details about each model, as well as all parameters for the send message API.

## Features

- View all available vs code lm api chat models (name, id, vendor, family, version, max input tokens)
- Sends **Hello** as a test to check the use of the individual models.

## GitHub Copilot Setup

To access GitHub Copilot chat models through the VS Code Language Model API, you need:

### Prerequisites

1. **GitHub Copilot Subscription**: Active GitHub Copilot Individual, Business, or Enterprise subscription
2. **GitHub Copilot Chat Extension**: Install the "GitHub Copilot Chat" extension from the VS Code marketplace
3. **Authentication**: Sign in to your GitHub account in VS Code

### Setup Steps

1. Install the GitHub Copilot Chat extension:
   - Open VS Code Extensions view (`Ctrl+Shift+X`)
   - Search for "GitHub Copilot Chat"
   - Install the official extension by GitHub

2. Sign in to GitHub:
   - Open Command Palette (`Ctrl+Shift+P`)
   - Run `GitHub Copilot: Sign In`
   - Follow the authentication flow

3. Verify access:
   - Run this extension's command `Show all vscode-lm chat models`
   - You should see GitHub Copilot models listed (e.g., `copilot-gpt-4o`)

### Troubleshooting

- **No models showing**: Ensure you're signed in to GitHub and have an active Copilot subscription
- **Authentication issues**: Try `GitHub Copilot: Sign Out` then sign in again
- **Extension conflicts**: Disable other AI extensions temporarily to test

## Usage

- Open the Command Palette (`Ctrl+Shift+P`)
- Run `Show all vscode-lm chat models`
- A webview will appear with all model details and send parameters

## Requirements

- VS Code 1.96 or newer
- Language Model API support in your VS Code environment
- GitHub Copilot subscription (Individual, Business, or Enterprise)
- GitHub Copilot Chat extension installed and authenticated

## Release Notes

### 0.0.1

- Initial release: List all models checked with sendResults

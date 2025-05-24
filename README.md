# d.o. vscode-lm Explorer

This extension lists all available language models in your VS Code environment and displays all details about each model, as well as all parameters for the send message API.

## Features
- View all available vs code lm api chat models (name, id, vendor, family, version, max input tokens)
- See all details about the parameters for sending a message to a model, formatted as:

```
{
    "model": "claude-sonnet-4",
    "temperature": 0.1,
    "top_p": 1,
    "max_tokens": 16000,
    "n": 1,
    "stream": true
}
```

## How to Enable GitHub Copilot Chat Models
To enable GitHub Copilot Chat models in VS Code, follow these steps:

1. **Prerequisites**:
   - Ensure you have a GitHub account.
   - Install the GitHub Copilot extension in VS Code.

2. **Steps to Enable**:
   - Open VS Code and go to the Extensions view (`Ctrl+Shift+X`).
   - Search for "GitHub Copilot" and install the extension.
   - Sign in to your GitHub account if prompted.
   - Once installed, the GitHub Copilot Chat models will be available for use.

For more details, refer to the [GitHub Copilot documentation](https://docs.github.com/en/copilot).

## Capabilities of the Models
The GitHub Copilot Chat models have various capabilities, including:

- **Image-to-Text**: The models can convert images to text.
- **Tool Calling**: The models can call various tools to assist with coding tasks.

These capabilities can be utilized to enhance your coding experience in VS Code.

## Troubleshooting
If you encounter any issues with the extension or GitHub Copilot Chat models, consider the following solutions:

- **Common Issues**:
  - **Model Not Found**: Ensure the GitHub Copilot extension is installed and enabled.
  - **Authentication Issues**: Make sure you are signed in to your GitHub account.

For more troubleshooting tips, refer to the [GitHub Copilot troubleshooting guide](https://docs.github.com/en/copilot/troubleshooting).

## Usage
- Open the Command Palette (`Ctrl+Shift+P`)
- Run `Show all vscode-lm chat models`
- A webview will appear with all model details and send parameters

## Contributing
We welcome contributions to the project! To contribute, follow these guidelines:

1. **Submitting Issues**:
   - Use the GitHub Issues tab to report bugs or request features.
   - Provide detailed information about the issue or feature request.

2. **Pull Requests**:
   - Fork the repository and create a new branch for your changes.
   - Submit a pull request with a clear description of your changes.

For more details, refer to our [Contribution Guidelines](CONTRIBUTING.md) and [Code of Conduct](CODE_OF_CONDUCT.md).

## Testing
To run tests for the extension, follow these steps:

1. **Setup Testing Environment**:
   - Ensure you have Node.js and npm installed.
   - Run `npm install` to install dependencies.

2. **Running Tests**:
   - Use the command `npm test` to run the tests.
   - Check the test results in the terminal.

## Release Process
Our release process includes the following steps:

1. **Versioning**:
   - We use semantic versioning for our releases.
   - Update the version number in `package.json` for each release.

2. **Changelog**:
   - Update the `CHANGELOG.md` file with details of the changes in the release.

3. **Publishing**:
   - Create a new release on GitHub with the updated version and changelog.
   - Publish the extension to the VS Code marketplace.

## Requirements
- VS Code 1.100.0 or newer
- Language Model API support in your VS Code environment

## Release Notes
### 0.0.1
- Initial release: List all models and show send message parameters

## License
MIT License

Copyright (c) 2023 d.o.it

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

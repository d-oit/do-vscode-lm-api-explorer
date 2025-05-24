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

## Usage
- Open the Command Palette (`Ctrl+Shift+P`)
- Run `Show all vscode-lm chat models`
- A webview will appear with all model details and send parameters

## Requirements
- VS Code 1.100.0 or newer
- Language Model API support in your VS Code environment

## Release Notes
### 0.0.1
- Initial release: List all models and show send message parameters

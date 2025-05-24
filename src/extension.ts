// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	console.log('Congratulations, your extension "do-vscode-lm-explorer" is now active!');

	const disposable = vscode.commands.registerCommand('do-vscode-lm-explorer.showModels', async () => {
		try {
			// Get all available chat models
			const models = await vscode.lm.selectChatModels({});
			if (!models || models.length === 0) {
				vscode.window.showWarningMessage('No language models available.');
				return;
			}

			// Prepare HTML for the webview
			const html = getModelsHtml(models);
			const panel = vscode.window.createWebviewPanel(
				'lmModelExplorer',
				'Language Model Explorer',
				vscode.ViewColumn.One,
				{ enableFindWidget: true, retainContextWhenHidden: true }
			);
			panel.webview.html = html;
		} catch (err: any) {
			vscode.window.showErrorMessage('Failed to list language models: ' + (err?.message || err));
		}
	});

	context.subscriptions.push(disposable);
}

function getModelsHtml(models: any[]): string {
	const sendParams = [
		{ key: 'model', desc: 'Model ID (string)' },
		{ key: 'temperature', desc: 'Randomness, 0-2 (number)' },
		{ key: 'top_p', desc: 'Nucleus sampling, 0-1 (number)' },
		{ key: 'max_tokens', desc: 'Max tokens in response (number)' },
		{ key: 'n', desc: 'Number of completions (number)' },
		{ key: 'stream', desc: 'Stream response (boolean)' }
	];
	return `
		<!DOCTYPE html>
		<html lang="en">
		<head>
			<meta charset="UTF-8">
			<meta name="viewport" content="width=device-width, initial-scale=1.0">
			<title>Language Model Explorer</title>
			<style>
				body { font-family: sans-serif; margin: 1.5em; }
				table { border-collapse: collapse; width: 100%; margin-bottom: 2em; }
				th, td { border: 1px solid #ccc; padding: 0.5em; }
				th { background: #f4f4f4; }
				pre { background: #f9f9f9; padding: 0.5em; border-radius: 4px; }
			</style>
		</head>
		<body>
			<h1>Available Language Models</h1>
			${models.map(model => `
				<h2>${model.name} <small>(${model.id})</small></h2>
				<table>
					<tr><th>Property</th><th>Value</th></tr>
					<tr><td>Vendor</td><td>${model.vendor}</td></tr>
					<tr><td>Family</td><td>${model.family}</td></tr>
					<tr><td>Version</td><td>${model.version}</td></tr>
					<tr><td>Max Input Tokens</td><td>${model.maxInputTokens}</td></tr>
				</table>
			`).join('')}
			<h1>Send Message Parameters</h1>
			<pre>{\n${sendParams.map(p => `    "${p.key}": ${p.desc}`).join(',\n')}\n}</pre>
		</body>
		</html>
	`;
}

// This method is called when your extension is deactivated
export function deactivate() {}

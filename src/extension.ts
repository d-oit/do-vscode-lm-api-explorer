// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	console.log('Congratulations, your extension "do-vscode-lm-explorer" is now active!');

	const disposable = vscode.commands.registerCommand('do-vscode-lm-explorer.showModels', async () => {
		const start = Date.now();
		const logger = vscode.window.createOutputChannel('d.o.vscode-lm Explorer Log');
		logger.appendLine(`[${new Date().toISOString()}] Command started.`);
		try {
			// Show progress while loading
			await vscode.window.withProgress({
				title: 'Loading VSCode LM API chat models and responses...',
				location: vscode.ProgressLocation.Notification,
				cancellable: false
			}, async (progress) => {
				try {
					progress.report({ message: 'Fetching models (Copilot Chat preferred)...' });
					let models: vscode.LanguageModelChat[] = [];
					try {
						models = await vscode.lm.selectChatModels({ vendor: 'copilot' });
					} catch (err) {
						logger.appendLine(`[${new Date().toISOString()}] Error fetching Copilot models: ${String(err)}`);
						models = [];
					}
					if (!models || models.length === 0) {
						try {
							models = await vscode.lm.selectChatModels({});
						} catch (err) {
							logger.appendLine(`[${new Date().toISOString()}] Error fetching all models: ${String(err)}`);
							models = [];
						}
					}
					logger.appendLine(`[${new Date().toISOString()}] Fetched ${models?.length ?? 0} models.`);
					if (!models || models.length === 0) {
						vscode.window.showWarningMessage('No language models available. Please ensure GitHub Copilot Chat or another provider is enabled.');
						logger.appendLine(`[${new Date().toISOString()}] No models found.`);
						return;
					}

					progress.report({ message: 'Building model summary...' });
					// Build JSON summary for all models
					const modelJson: Record<string, any> = {};
					for (const model of models) {
						try {
							modelJson[model.id] = {
								name: model.name,
								id: model.id,
								vendor: model.vendor,
								family: model.family,
								version: model.version,
								maxInputTokens: model.maxInputTokens,
								// capabilities: Not available in VS Code LM API
							};
						} catch (err) {
							logger.appendLine(`[${new Date().toISOString()}] Error building model summary for ${model?.id}: ${String(err)}`);
						}
					}

					progress.report({ message: 'Sending hello to all models...' });
					// Try sending a simple hello to each model and collect send parameter details
					const sendResults: Record<string, any> = {};
					let i = 0;
					for (const model of models) {
						try {
							let resp;
							let errorDetails = undefined;
							try {
								resp = await model.sendRequest([vscode.LanguageModelChatMessage.User('hello')], {}, undefined);
							} catch (err: any) {
								if (err && typeof err === 'object' && 'message' in err) {
									errorDetails = {
										message: err.message,
										code: (err as any).code || undefined,
										cause: (err as any).cause || undefined
									};
								}
								logger.appendLine(`[${new Date().toISOString()}] Error sending request to model ${model.id}: ${String(err)}`);
								throw err;
							}
							let text = '';
							if (resp && resp.text) {
								try {
									for await (const chunk of resp.text) {
										text += chunk;
									}
								} catch (err) {
									logger.appendLine(`[${new Date().toISOString()}] Error reading response from model ${model.id}: ${String(err)}`);
								}
							}
							sendResults[model.id] = {
								request: {
									model: model.id,
									messages: [{ role: 'user', content: 'hello' }],
									options: {}
								},
								response: text,
								errorDetails
							};
							logger.appendLine(`[${new Date().toISOString()}] Model ${model.id} responded successfully.`);
						} catch (err) {
							sendResults[model.id] = { error: String(err) };
							logger.appendLine(`[${new Date().toISOString()}] Error sending to model ${model.id}: ${String(err)}`);
						}
						progress.report({ message: `Processed ${++i} of ${models.length} models...` });
					}

					// Show webview with JSON output included
					const html = getModelsHtml(models, modelJson, sendResults);
					const panel = vscode.window.createWebviewPanel(
						'lmModelExplorer',
						'Language Model Explorer',
						vscode.ViewColumn.One,
						{ enableFindWidget: true, retainContextWhenHidden: true }
					);
					panel.webview.html = html;
				} catch (err: any) {
					logger.appendLine(`[${new Date().toISOString()}] Fatal error: ${String(err)}`);
					vscode.window.showErrorMessage('Failed to list language models: ' + (err?.message || String(err)));
				} finally {
					const elapsed = Date.now() - start;
					logger.appendLine(`[${new Date().toISOString()}] Command completed in ${elapsed}ms.`);
					logger.appendLine(`[${new Date().toISOString()}] Command finished.`);
					logger.dispose();
				}
			});

		} catch (err: any) {
			vscode.window.showErrorMessage('Unexpected error: ' + (err?.message || String(err)));
		}
	});

	context.subscriptions.push(disposable);
}

function getModelsHtml(models: any[], modelJson?: any, sendResults?: any): string {
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
				.model-error { color: #fff; background: #d32f2f; padding: 0.5em; border-radius: 4px; margin: 0.5em 0; }
				.model-error strong { font-weight: bold; }
				h2.model-error { background: #d32f2f; color: #fff; padding: 0.75em; border-radius: 6px; }
			</style>
		</head>
		<body>
			<h1>Available Models</h1>
			${models.map(model => {
				const error = sendResults && sendResults[model.id]?.error;
				const is400 = error && error.includes('Request Failed: 400');
				const isModelNotSupported = error && (error.includes('model_not_supported') || error.includes('Model is not supported'));
				const errorDetails = sendResults && sendResults[model.id]?.errorDetails;
				const notSupportedIcon = '❌';
				const supportedIcon = '✅';
				
				return `
					<h2${is400 || isModelNotSupported ? ' class="model-error"' : ''}>${(is400 || isModelNotSupported) ? notSupportedIcon : supportedIcon} ${escapeHtml(model.name)} <small>(${escapeHtml(model.id)})</small>${is400 || isModelNotSupported ? ' - Not Supported' : ''}</h2>
					${isModelNotSupported ? '<p class="model-error"><strong>⚠️ This model is not supported for chat requests</strong></p>' : ''}
					<table>
						<tr><th>Property</th><th>Value</th></tr>
						<tr><td>Vendor</td><td>${escapeHtml(model.vendor)}</td></tr>
						<tr><td>Family</td><td>${escapeHtml(model.family)}</td></tr>
						<tr><td>Version</td><td>${escapeHtml(model.version)}</td></tr>
						<tr><td>Max Input Tokens</td><td>${model.maxInputTokens}</td></tr>
						${errorDetails ? `<tr><td colspan='2'><b>Error Details:</b><br>Message: ${escapeHtml(errorDetails.message || '')}<br>Code: ${escapeHtml(errorDetails.code || '')}<br>Cause: ${escapeHtml(String(errorDetails.cause) || '')}</td></tr>` : ''}
					</table>
				`;
			}).join('')}
			<h1>Send Message Parameters</h1>
			<pre>{\n${sendParams.map(p => `    "${p.key}": ${p.desc}`).join(',\n')}\n}</pre>
			<h1>JSON Output</h1>
			<h2>vscodeLlmModels</h2>
			<pre>${escapeHtml(JSON.stringify(modelJson, null, 2))}</pre>
			<h2>Send parameter results</h2>
			<pre>${escapeHtml(JSON.stringify(sendResults, null, 2))}</pre>
		</body>
		</html>
	`;
}

function escapeHtml(str: string): string {
	return str.replace(/[&<>]/g, tag => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[tag] || tag));
}

// This method is called when your extension is deactivated
export function deactivate() {}

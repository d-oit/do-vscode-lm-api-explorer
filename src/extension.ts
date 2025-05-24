// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// Extended interface for LanguageModelChat with capabilities (not in official API yet)
interface ExtendedLanguageModelChat extends vscode.LanguageModelChat {
	capabilities?: {
		supportsImageToText?: boolean;
		supportsToolCalling?: boolean;
	};
}

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
					let models: ExtendedLanguageModelChat[] = [];
					try {
						models = await vscode.lm.selectChatModels({ vendor: 'copilot' }) as ExtendedLanguageModelChat[];
					} catch (err) {
						logger.appendLine(`[${new Date().toISOString()}] Error fetching Copilot models: ${String(err)}`);
						models = [];
					}
					if (!models || models.length === 0) {
						try {
							models = await vscode.lm.selectChatModels({}) as ExtendedLanguageModelChat[];
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
								capabilities: model.capabilities || undefined
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
						{ 
							enableFindWidget: true, 
							retainContextWhenHidden: true,
							enableScripts: true
						}
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

function getModelsHtml(models: ExtendedLanguageModelChat[], modelJson?: any, sendResults?: any): string {
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
				body { 
					font-family: var(--vscode-font-family, 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif);
					font-size: var(--vscode-font-size, 13px);
					line-height: 1.4;
					color: var(--vscode-foreground);
					background-color: var(--vscode-editor-background);
					margin: 1.5em;
				}
				
				h1, h2 {
					color: var(--vscode-titleBar-activeForeground, var(--vscode-foreground));
					border-bottom: 1px solid var(--vscode-panel-border, #e1e4e8);
					padding-bottom: 0.5em;
				}
				
				table { 
					border-collapse: collapse; 
					width: 100%; 
					margin-bottom: 2em;
					background-color: var(--vscode-editor-background);
				}
				
				th, td { 
					border: 1px solid var(--vscode-panel-border, #e1e4e8); 
					padding: 0.75em 0.5em;
					text-align: left;
					vertical-align: top;
				}
				
				th { 
					background-color: var(--vscode-list-hoverBackground, #f0f0f0);
					font-weight: 600;
					color: var(--vscode-list-activeSelectionForeground, var(--vscode-foreground));
				}
				
				.json-container {
					position: relative;
					margin-bottom: 2em;
				}
				
				.json-header {
					display: flex;
					justify-content: space-between;
					align-items: center;
					margin-bottom: 0.5em;
				}
				
				.copy-button {
					background: var(--vscode-button-background, #007acc);
					color: var(--vscode-button-foreground, white);
					border: none;
					padding: 6px 12px;
					border-radius: 3px;
					cursor: pointer;
					font-size: 12px;
					display: flex;
					align-items: center;
					gap: 4px;
					transition: background-color 0.2s;
				}
				
				.copy-button:hover {
					background: var(--vscode-button-hoverBackground, #005a9e);
				}
				
				.copy-button:active {
					background: var(--vscode-button-secondaryBackground, #005577);
				}
				
				.copy-icon {
					width: 14px;
					height: 14px;
					fill: currentColor;
				}
				
				pre { 
					background-color: var(--vscode-textCodeBlock-background, #f6f8fa);
					color: var(--vscode-textPreformat-foreground, var(--vscode-foreground));
					padding: 1em;
					border-radius: 6px;
					border: 1px solid var(--vscode-panel-border, #e1e4e8);
					overflow-x: auto;
					white-space: pre-wrap;
					word-wrap: break-word;
					font-family: var(--vscode-editor-font-family, 'Consolas', 'Courier New', monospace);
					font-size: var(--vscode-editor-font-size, 12px);
					line-height: 1.5;
					margin: 0;
				}
				
				.model-error { 
					color: var(--vscode-errorForeground, #ffffff);
					background: var(--vscode-inputValidation-errorBackground, #d32f2f);
					padding: 0.75em;
					border-radius: 6px;
					margin: 0.5em 0;
					border: 1px solid var(--vscode-inputValidation-errorBorder, #be1100);
				}
				
				.model-error strong { 
					font-weight: bold; 
				}
				
				h2.model-error { 
					background: var(--vscode-inputValidation-errorBackground, #d32f2f);
					color: var(--vscode-errorForeground, #ffffff);
					padding: 0.75em;
					border-radius: 6px;
					border: 1px solid var(--vscode-inputValidation-errorBorder, #be1100);
				}
				
				.success-toast {
					position: fixed;
					top: 20px;
					right: 20px;
					background: var(--vscode-notificationsInfoIcon-foreground, #007acc);
					color: white;
					padding: 12px 16px;
					border-radius: 4px;
					z-index: 1000;
					opacity: 0;
					transform: translateY(-20px);
					transition: all 0.3s ease;
				}
				
				.success-toast.show {
					opacity: 1;
					transform: translateY(0);
				}
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
						${model.capabilities ? `<tr><td>Capabilities</td><td>${escapeHtml(JSON.stringify(model.capabilities, null, 2))}</td></tr>` : ''}
						${errorDetails ? `<tr><td colspan='2'><b>Error Details:</b><br>Message: ${escapeHtml(errorDetails.message || '')}<br>Code: ${escapeHtml(errorDetails.code || '')}<br>Cause: ${escapeHtml(String(errorDetails.cause) || '')}</td></tr>` : ''}
					</table>
				`;
			}).join('')}
			
			<h1>Send Message Parameters</h1>
			<div class="json-container">
				<div class="json-header">
					<h2>Parameter Structure</h2>
					<button class="copy-button" onclick="copyToClipboard('sendParams')">
						<svg class="copy-icon" viewBox="0 0 16 16">
							<path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z"/>
							<path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z"/>
						</svg>
						Copy
					</button>
				</div>
				<pre id="sendParams">{\n${sendParams.map(p => `    "${p.key}": ${p.desc}`).join(',\n')}\n}</pre>
			</div>
			
			<h1>JSON Output</h1>
			
			<div class="json-container">
				<div class="json-header">
					<h2>vscodeLlmModels</h2>
					<button class="copy-button" onclick="copyToClipboard('modelJson')">
						<svg class="copy-icon" viewBox="0 0 16 16">
							<path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z"/>
							<path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z"/>
						</svg>
						Copy
					</button>
				</div>
				<pre id="modelJson">${escapeHtml(JSON.stringify(modelJson, null, 2))}</pre>
			</div>
			
			<div class="json-container">
				<div class="json-header">
					<h2>Send parameter results</h2>
					<button class="copy-button" onclick="copyToClipboard('sendResults')">
						<svg class="copy-icon" viewBox="0 0 16 16">
							<path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z"/>
							<path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z"/>
						</svg>
						Copy
					</button>
				</div>
				<pre id="sendResults">${escapeHtml(JSON.stringify(sendResults, null, 2))}</pre>
			</div>
			
			<div id="toast" class="success-toast"></div>
			
			<script>
				function copyToClipboard(elementId) {
					const element = document.getElementById(elementId);
					const text = element.textContent || element.innerText;
					
					// Use the modern clipboard API if available
					if (navigator.clipboard && window.isSecureContext) {
						navigator.clipboard.writeText(text).then(() => {
							showToast('Copied to clipboard!');
						}).catch(err => {
							console.error('Failed to copy: ', err);
							fallbackCopyTextToClipboard(text);
						});
					} else {
						// Fallback for older browsers
						fallbackCopyTextToClipboard(text);
					}
				}
				
				function fallbackCopyTextToClipboard(text) {
					const textArea = document.createElement('textarea');
					textArea.value = text;
					textArea.style.top = '0';
					textArea.style.left = '0';
					textArea.style.position = 'fixed';
					textArea.style.opacity = '0';
					
					document.body.appendChild(textArea);
					textArea.focus();
					textArea.select();
					
					try {
						const successful = document.execCommand('copy');
						if (successful) {
							showToast('Copied to clipboard!');
						} else {
							showToast('Copy failed');
						}
					} catch (err) {
						console.error('Fallback: Oops, unable to copy', err);
						showToast('Copy failed');
					}
					
					document.body.removeChild(textArea);
				}
				
				function showToast(message) {
					const toast = document.getElementById('toast');
					toast.textContent = message;
					toast.classList.add('show');
					
					setTimeout(() => {
						toast.classList.remove('show');
					}, 2000);
				}
			</script>
		</body>
		</html>
	`;
}

function escapeHtml(str: string): string {
	return str.replace(/[&<>]/g, tag => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[tag] || tag));
}

// This method is called when your extension is deactivated
export function deactivate() {}

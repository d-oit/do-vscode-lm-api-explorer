// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { ModelService } from './modelService';
import { HtmlGenerator } from './htmlGenerator';
import { ModelExplorerData, ModelNotSupportedError } from './types';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	console.log('Congratulations, your extension "do-vscode-lm-explorer" is now active!');

	const logger = vscode.window.createOutputChannel('d.o.vscode-lm Explorer Log');
	context.subscriptions.push(logger); // Ensure logger is disposed on deactivate

	const disposable = vscode.commands.registerCommand('do-vscode-lm-explorer.discoverModels', async () => {
		const start = Date.now();
		logger.appendLine(`[${new Date().toISOString()}] AI Model Discovery started.`);
		
		try {
			// Show progress with cancellation support
			await vscode.window.withProgress({
				title: 'Discovering & Testing AI Models...',
				location: vscode.ProgressLocation.Notification,
				cancellable: true
			}, async (progress, cancellationToken) => {
				const modelService = new ModelService(logger);
				
				try {
					// Step 1: Fetch models
					progress.report({ message: 'Discovering available AI models...', increment: 10 });
					const models = await modelService.fetchModels(cancellationToken);
					
					if (cancellationToken.isCancellationRequested) {
						logger.appendLine(`[${new Date().toISOString()}] Operation cancelled by user`);
						return;
					}

					// Step 2: Build model summary
					progress.report({ message: 'Analyzing model capabilities...', increment: 20 });
					const modelJson = modelService.buildModelSummary(models, cancellationToken);
					
					if (cancellationToken.isCancellationRequested) {
						logger.appendLine(`[${new Date().toISOString()}] Operation cancelled by user`);
						return;
					}

					// Step 3: Test models
					progress.report({ message: 'Testing AI model responses...', increment: 30 });
					const sendResults = await modelService.testModels(models, progress, cancellationToken);
					
					if (cancellationToken.isCancellationRequested) {
						logger.appendLine(`[${new Date().toISOString()}] Operation cancelled by user`);
						return;
					}

					// Step 4: Generate and show results
					progress.report({ message: 'Preparing AI model explorer...', increment: 90 });
					
					const explorerData: ModelExplorerData = {
						models,
						modelJson,
						sendResults
					};

					const html = HtmlGenerator.generateHtml(explorerData);
					
					const panel = vscode.window.createWebviewPanel(
						'lmModelExplorer',
						'AI Model Explorer',
						vscode.ViewColumn.One,
						{ 
							enableFindWidget: true, 
							retainContextWhenHidden: true,
							enableScripts: true
						}
					);
					
					panel.webview.html = html;
					
					progress.report({ message: 'AI Model Discovery Complete!', increment: 100 });
					logger.appendLine(`[${new Date().toISOString()}] Successfully discovered ${models.length} AI models`);
					
					// Show a helpful notification
					vscode.window.showInformationMessage(
						`🤖 Discovered ${models.length} AI models! Use the explorer to copy API parameters and test responses.`,
						'Open Explorer'
					).then(selection => {
						if (selection === 'Open Explorer') {
							panel.reveal();
						}
					});
					
				} catch (err: any) {
					if (err instanceof vscode.CancellationError) {
						logger.appendLine(`[${new Date().toISOString()}] AI model discovery was cancelled`);
						vscode.window.showInformationMessage('AI model discovery was cancelled.');
						return;
					}
					
					logger.appendLine(`[${new Date().toISOString()}] Error during AI model discovery: ${String(err)}`);
					
					if (err.message?.includes('No language models available')) {
						vscode.window.showWarningMessage(
							'No AI models found. Please ensure GitHub Copilot Chat or another AI provider is enabled.',
							'Setup Guide'
						).then(selection => {
							if (selection === 'Setup Guide') {
								vscode.env.openExternal(vscode.Uri.parse('https://docs.github.com/en/copilot/using-github-copilot/using-github-copilot-chat-in-your-ide'));
							}
						});
					} else if (err instanceof ModelNotSupportedError) {
						vscode.window.showWarningMessage(
							`AI Model Explorer: Model "${err.message}" is not supported for chat requests. Please check your AI provider setup.`
						);
					} else {
						vscode.window.showErrorMessage(`Failed to discover AI models: ${err?.message || String(err)}`);
					}
				} finally {
					const elapsed = Date.now() - start;
					logger.appendLine(`[${new Date().toISOString()}] AI Model Discovery completed in ${elapsed}ms.`);
					// The logger is now disposed via context.subscriptions.push(logger)
					// logger.dispose(); // No longer needed here
				}
			});

		} catch (err: any) {
			logger.appendLine(`[${new Date().toISOString()}] Unexpected error: ${String(err)}`);
			vscode.window.showErrorMessage('Unexpected error: ' + (err?.message || String(err)));
			logger.dispose();
		}
	});

	context.subscriptions.push(disposable);

	const clearCacheDisposable = vscode.commands.registerCommand('do-vscode-lm-explorer.clearCacheAndDiscover', async () => {
		const modelService = new ModelService(logger); // Reuse the main logger
		modelService.clearCache();
		vscode.window.showInformationMessage('AI Model Explorer cache cleared. Rediscovering models...');
		await vscode.commands.executeCommand('do-vscode-lm-explorer.discoverModels');
	});
	context.subscriptions.push(clearCacheDisposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}

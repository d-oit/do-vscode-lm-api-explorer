// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { ModelService } from './modelService';
import { HtmlGenerator } from './htmlGenerator';
import { ModelExplorerData, ModelNotSupportedError } from './types';
import { ProgressReporter } from './progressReporter';
import { 
	COMMANDS, 
	UI_TEXT, 
	PROGRESS_STEPS, 
	URLS,
	DATES 
} from './constants';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	console.log(UI_TEXT.ACTIVATION_MESSAGE);

	const logger = vscode.window.createOutputChannel('d.o.vscode-lm Explorer Log');
	context.subscriptions.push(logger); // Ensure logger is disposed on deactivate

	const disposable = vscode.commands.registerCommand(COMMANDS.DISCOVER_MODELS, async () => {
		const start = Date.now();
		logger.appendLine(`[${new Date().toISOString()}] AI Model Discovery started.`);
		
		try {
			// Show progress with cancellation support
			await vscode.window.withProgress({
				title: UI_TEXT.PROGRESS.TITLE,
				location: vscode.ProgressLocation.Notification,
				cancellable: true
			}, async (progress, cancellationToken) => {
				const modelService = new ModelService(logger);
				const progressReporter = new ProgressReporter(progress);
				
				try {
					// Step 1: Fetch models
					progressReporter.reportStep(UI_TEXT.PROGRESS.DISCOVERING, PROGRESS_STEPS.FETCH_MODELS.increment);
					const models = await modelService.fetchModels(cancellationToken);
					
					if (cancellationToken.isCancellationRequested) {
						logger.appendLine(`[${new Date().toISOString()}] Operation cancelled by user`);
						return;
					}

					// Step 2: Build model summary
					progressReporter.reportStep(UI_TEXT.PROGRESS.ANALYZING, PROGRESS_STEPS.ANALYZE_CAPABILITIES.increment);
					const modelJson = modelService.buildModelSummary(models, cancellationToken);
					
					if (cancellationToken.isCancellationRequested) {
						logger.appendLine(`[${new Date().toISOString()}] Operation cancelled by user`);
						return;
					}

					// Step 3: Check for premium request warning (after January 6, 2025)
					let shouldTestModels = true;
					const currentDate = new Date();
					
					if (currentDate >= DATES.PREMIUM_REQUEST_WARNING_START) {
						// Show premium request warning and get user choice
						const userChoice = await vscode.window.showWarningMessage(
							UI_TEXT.NOTIFICATIONS.PREMIUM_REQUEST_WARNING,
							{
								modal: true,
								detail: 'Testing models will send a test message to each model, which counts as premium requests. You can skip testing to avoid using your quota and still view model information.'
							},
							UI_TEXT.BUTTONS.TEST_MODELS,
							UI_TEXT.BUTTONS.SKIP_TESTING,
							UI_TEXT.BUTTONS.LEARN_MORE
						);

						if (userChoice === UI_TEXT.BUTTONS.LEARN_MORE) {
							vscode.env.openExternal(vscode.Uri.parse(URLS.PREMIUM_REQUESTS_INFO));
							// Show the dialog again after opening the link
							const secondChoice = await vscode.window.showWarningMessage(
								UI_TEXT.NOTIFICATIONS.PREMIUM_REQUEST_WARNING,
								{
									modal: true,
									detail: 'Testing models will send a test message to each model, which counts as premium requests. You can skip testing to avoid using your quota and still view model information.'
								},
								UI_TEXT.BUTTONS.TEST_MODELS,
								UI_TEXT.BUTTONS.SKIP_TESTING
							);
							shouldTestModels = secondChoice === UI_TEXT.BUTTONS.TEST_MODELS;
						} else if (userChoice === UI_TEXT.BUTTONS.SKIP_TESTING || !userChoice) {
							shouldTestModels = false;
						}
						// If TEST_MODELS was chosen, shouldTestModels remains true
					}

					if (cancellationToken.isCancellationRequested) {
						logger.appendLine(`[${new Date().toISOString()}] Operation cancelled by user`);
						return;
					}

					// Step 4: Test models (most time-consuming step) - only if user chose to test
					let sendResults: Record<string, any> = {};
					
					if (shouldTestModels) {
						progressReporter.reportStep(UI_TEXT.PROGRESS.TESTING, PROGRESS_STEPS.TEST_MODELS.increment);
						sendResults = await modelService.testModels(models, progressReporter.getVSCodeProgress(), cancellationToken);
					} else {
						// Skip testing but still report progress
						progressReporter.reportStep('Skipping model testing...', PROGRESS_STEPS.TEST_MODELS.increment);
						// Create empty results with a note that testing was skipped
						for (const model of models) {
							sendResults[model.id] = { 
								response: 'Testing skipped to avoid premium request usage',
								testSkipped: true
							};
						}
					}
					
					if (cancellationToken.isCancellationRequested) {
						logger.appendLine(`[${new Date().toISOString()}] Operation cancelled by user`);
						return;
					}

					// Step 5: Generate and show results
					progressReporter.reportStep(UI_TEXT.PROGRESS.PREPARING, PROGRESS_STEPS.PREPARE_RESULTS.increment);
					
					const explorerData: ModelExplorerData = {
						models,
						modelJson,
						sendResults
					};

					const html = HtmlGenerator.generateHtml(explorerData);
					
					const panel = vscode.window.createWebviewPanel(
						UI_TEXT.WEBVIEW.VIEW_TYPE,
						UI_TEXT.WEBVIEW.TITLE,
						vscode.ViewColumn.One,
						{ 
							enableFindWidget: true, 
							retainContextWhenHidden: true,
							enableScripts: true
						}
					);
					
					panel.webview.html = html;
					
					progress.report({ 
						message: UI_TEXT.PROGRESS.COMPLETE, 
						increment: 100 
					});
					logger.appendLine(`[${new Date().toISOString()}] Successfully discovered ${models.length} AI models`);
					
					// Show a helpful notification
					const successMessage = shouldTestModels 
						? UI_TEXT.NOTIFICATIONS.SUCCESS(models.length)
						: UI_TEXT.NOTIFICATIONS.SUCCESS_WITHOUT_TEST(models.length);
						
					vscode.window.showInformationMessage(
						successMessage,
						UI_TEXT.BUTTONS.OPEN_EXPLORER
					).then(selection => {
						if (selection === UI_TEXT.BUTTONS.OPEN_EXPLORER) {
							panel.reveal();
						}
					});
					
				} catch (err: any) {
					if (err instanceof vscode.CancellationError) {
						logger.appendLine(`[${new Date().toISOString()}] AI model discovery was cancelled`);
						vscode.window.showInformationMessage(UI_TEXT.NOTIFICATIONS.CANCELLED);
						return;
					}
					
					logger.appendLine(`[${new Date().toISOString()}] Error during AI model discovery: ${String(err)}`);
					
					if (err.message?.includes('No language models available')) {
						vscode.window.showWarningMessage(
							UI_TEXT.NOTIFICATIONS.NO_MODELS,
							UI_TEXT.BUTTONS.SETUP_GUIDE
						).then(selection => {
							if (selection === UI_TEXT.BUTTONS.SETUP_GUIDE) {
								vscode.env.openExternal(vscode.Uri.parse(URLS.COPILOT_SETUP_GUIDE));
							}
						});
					} else if (err instanceof ModelNotSupportedError) {
						vscode.window.showWarningMessage(
							UI_TEXT.NOTIFICATIONS.MODEL_NOT_SUPPORTED(err.message)
						);
					} else {
						vscode.window.showErrorMessage(UI_TEXT.NOTIFICATIONS.ERROR(err?.message || String(err)));
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

	const clearCacheDisposable = vscode.commands.registerCommand(COMMANDS.CLEAR_CACHE_AND_DISCOVER, async () => {
		const modelService = new ModelService(logger); // Reuse the main logger
		modelService.clearCache();
		vscode.window.showInformationMessage(UI_TEXT.NOTIFICATIONS.CACHE_CLEARED);
		await vscode.commands.executeCommand(COMMANDS.DISCOVER_MODELS);
	});
	context.subscriptions.push(clearCacheDisposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}

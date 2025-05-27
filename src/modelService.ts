import * as vscode from 'vscode';
import { ExtendedLanguageModelChat, ModelSummary, SendResult, ModelNotSupportedError } from './types';
import { UI_TEXT, ERROR_MESSAGES } from './constants';
import { ModelTestingProgressReporter } from './progressReporter';

export class ModelService {
	private logger: vscode.OutputChannel;
	private _cachedModels: ExtendedLanguageModelChat[] | null = null;
	private _cachedSendResults: Record<string, SendResult> | null = null;
	private context: vscode.ExtensionContext | null = null;

	private readonly MAX_FETCH_RETRIES = 3;
	private readonly FETCH_RETRY_DELAY_MS = 500;

	constructor(logger: vscode.OutputChannel, context?: vscode.ExtensionContext) {
		this.logger = logger;
		this.context = context || null;
	}	async fetchModels(cancellationToken?: vscode.CancellationToken): Promise<ExtendedLanguageModelChat[]> {
		this.logger.appendLine(`[${new Date().toISOString()}] Starting model fetch...`);

		if (this._cachedModels) {
			this.logger.appendLine(`[${new Date().toISOString()}] Returning cached models.`);
			return this._cachedModels;
		}

		if (cancellationToken?.isCancellationRequested) {
			throw new vscode.CancellationError();
		}

		let models: ExtendedLanguageModelChat[] = [];
		
		// First try to get Copilot models
		this.logger.appendLine(`[${new Date().toISOString()}] Fetching Copilot models...`);
		
		try {
			models = await vscode.lm.selectChatModels({ vendor: 'copilot' }) as ExtendedLanguageModelChat[];
			this.logger.appendLine(`[${new Date().toISOString()}] Found ${models.length} Copilot models`);
		} catch (err: any) {
			this.logger.appendLine(`[${new Date().toISOString()}] Error fetching Copilot models: ${String(err)}`);
			models = [];
		}

		if (cancellationToken?.isCancellationRequested) {
			throw new vscode.CancellationError();
		}

		// If no Copilot models, try all models
		if (!models || models.length === 0) {
			this.logger.appendLine(`[${new Date().toISOString()}] No Copilot models found, fetching all available models...`);
			
			try {
				models = await vscode.lm.selectChatModels({}) as ExtendedLanguageModelChat[];
				this.logger.appendLine(`[${new Date().toISOString()}] Found ${models.length} total models`);
			} catch (err) {
				this.logger.appendLine(`[${new Date().toISOString()}] Error fetching all models: ${String(err)}`);
				models = [];
			}
		}

		if (cancellationToken?.isCancellationRequested) {
			throw new vscode.CancellationError();
		}

		// If no models found, show the user-friendly message
		if (!models || models.length === 0) {
			throw new Error(ERROR_MESSAGES.NO_MODELS);
		}

		// Check permissions for the first available model to trigger consent dialog if needed
		await this.checkAndRequestPermission(models[0], cancellationToken);

		this.logger.appendLine(`[${new Date().toISOString()}] Successfully fetched ${models.length} models`);
		this._cachedModels = models; // Cache the fetched models
		return models;
	}

	/**
	 * Check if we have permission to use a model and trigger consent dialog if needed
	 */
	private async checkAndRequestPermission(model: ExtendedLanguageModelChat, cancellationToken?: vscode.CancellationToken): Promise<void> {
		if (!this.context) {
			// If no context available, skip permission check (mainly for tests)
			this.logger.appendLine(`[${new Date().toISOString()}] No extension context available, skipping permission check`);
			return;
		}

		try {
			const accessInfo = this.context.languageModelAccessInformation;
			const canSend = accessInfo.canSendRequest(model);
			
			this.logger.appendLine(`[${new Date().toISOString()}] Permission check for ${model.id}: ${canSend}`);
			
			// If permission is explicitly false or unknown (undefined), try to trigger consent dialog
			if (canSend !== true) {
				this.logger.appendLine(`[${new Date().toISOString()}] Triggering permission consent dialog for ${model.id}...`);
						// Try a minimal request to trigger the consent dialog
				try {
					const request = model.sendRequest(
						[vscode.LanguageModelChatMessage.User('Hi')],
						{ justification: 'Checking access permissions for model discovery' },
						cancellationToken
					);
					
					// Convert Thenable to Promise to handle errors properly
					Promise.resolve(request).catch(() => {
						// Ignore errors here as we're just trying to trigger the consent dialog
					});
					
					// Wait a bit to allow the consent dialog to appear
					await new Promise(resolve => setTimeout(resolve, 100));
					
				} catch (err: any) {
					if (err instanceof vscode.LanguageModelError && err.code === vscode.LanguageModelError.NoPermissions.name) {
						// This is expected - throw it to let the caller handle the permission error properly
						this.logger.appendLine(`[${new Date().toISOString()}] Permission denied for ${model.id}, throwing error for user handling`);
						throw err;
					}
					// For other errors, just log and continue
					this.logger.appendLine(`[${new Date().toISOString()}] Non-permission error during consent check: ${String(err)}`);
				}
			}
		} catch (err) {
			// Re-throw permission errors, but handle other errors gracefully
			if (err instanceof vscode.LanguageModelError && err.code === vscode.LanguageModelError.NoPermissions.name) {
				throw err;
			}
			this.logger.appendLine(`[${new Date().toISOString()}] Error during permission check: ${String(err)}`);
		}
	}

	buildModelSummary(models: ExtendedLanguageModelChat[], cancellationToken?: vscode.CancellationToken): Record<string, ModelSummary> {
		this.logger.appendLine(`[${new Date().toISOString()}] Building model summary...`);
		
		const modelJson: Record<string, ModelSummary> = {};
		
		for (const model of models) {
			if (cancellationToken?.isCancellationRequested) {
				throw new vscode.CancellationError();
			}

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
				this.logger.appendLine(`[${new Date().toISOString()}] Error building model summary for ${model?.id}: ${String(err)}`);
			}
		}

		this.logger.appendLine(`[${new Date().toISOString()}] Model summary built for ${Object.keys(modelJson).length} models`);
		return modelJson;
	}

	async testModels(
		models: ExtendedLanguageModelChat[], 
		progress: vscode.Progress<{ message?: string; increment?: number }>,
		cancellationToken?: vscode.CancellationToken
	): Promise<Record<string, SendResult>> {
		this.logger.appendLine(`[${new Date().toISOString()}] Starting model testing...`);
		
		const sendResults: Record<string, SendResult> = {};
		
		// Check if cached results exist for the current set of models
		if (this._cachedSendResults && this._cachedModels === models) {
			this.logger.appendLine(`[${new Date().toISOString()}] Returning cached test results.`);
			return this._cachedSendResults;
		}

		// Create a progress reporter for more precise tracking
		const progressReporter = new ModelTestingProgressReporter(models.length, progress);
		
		for (let i = 0; i < models.length; i++) {
			if (cancellationToken?.isCancellationRequested) {
				throw new vscode.CancellationError();
			}

			const model = models[i];
			progressReporter.reportModelStart(i, model.name);

			try {
				this.logger.appendLine(`[${new Date().toISOString()}] Testing model: ${model.id}`);
				const testOptions: vscode.LanguageModelChatRequestOptions = {
					justification: UI_TEXT.TEST.JUSTIFICATION
					// Note: Using model defaults (no explicit modelOptions)
				};

				let resp: vscode.LanguageModelChatResponse;
				let errorDetails: any = undefined;				try {
					resp = await model.sendRequest(
						[vscode.LanguageModelChatMessage.User(UI_TEXT.TEST.MESSAGE)], 
						testOptions,
						cancellationToken
					);
				} catch (err: any) {
					if (err instanceof vscode.CancellationError) {
						throw err;
					}
							// Handle LanguageModelError specifically
					if (err instanceof vscode.LanguageModelError) {
						if (err.code === vscode.LanguageModelError.NoPermissions.name) {
							throw new Error('Language model access permission not granted. Please run the command again and grant permission when prompted.');
						}
					}
					
					if (err && typeof err === 'object' && 'message' in err) {
						errorDetails = {
							message: err.message,
							code: (err as any).code || undefined,
							cause: (err as any).cause || undefined
						};
					}
					this.logger.appendLine(`[${new Date().toISOString()}] Error sending request to model ${model.id}: ${String(err)}`);
					
					if (err.message?.includes(ERROR_MESSAGES.MODEL_NOT_SUPPORTED) || err.message?.includes('Model is not supported')) {
						throw new ModelNotSupportedError(model.id, err.message);
					} else {
						throw err;
					}
				}

				let text = '';
				if (resp && resp.text) {
					try {
						for await (const chunk of resp.text) {
							if (cancellationToken?.isCancellationRequested) {
								throw new vscode.CancellationError();
							}
							text += chunk;
						}
					} catch (err) {
						if (err instanceof vscode.CancellationError) {
							throw err;
						}
						this.logger.appendLine(`[${new Date().toISOString()}] Error reading response from model ${model.id}: ${String(err)}`);
					}
				}

				sendResults[model.id] = {
					request: {
						model: model.id,
						messages: [{ role: 'user', content: UI_TEXT.TEST.MESSAGE }],
						options: testOptions
					},
					response: text,
					errorDetails
				};

				progressReporter.reportModelCompletion(i, model.name);
				this.logger.appendLine(`[${new Date().toISOString()}] Model ${model.id} tested successfully`);
			} catch (err) {
				if (err instanceof vscode.CancellationError) {
					throw err;
				}
				
				sendResults[model.id] = { error: String(err) };
				progressReporter.reportModelError(i, model.name, String(err));
				this.logger.appendLine(`[${new Date().toISOString()}] Error testing model ${model.id}: ${String(err)}`);
			}
		}

		this.logger.appendLine(`[${new Date().toISOString()}] Model testing completed`);
		this._cachedSendResults = sendResults; // Cache the test results
		return sendResults;
	}

	// Method to clear the cache, useful for testing or explicit refresh
	public clearCache(): void {
		this.logger.appendLine(`[${new Date().toISOString()}] Clearing ModelService cache.`);
		this._cachedModels = null;
		this._cachedSendResults = null;
	}
}

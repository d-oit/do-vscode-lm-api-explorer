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

		// Return cached models if available
		if (this._cachedModels) {
			this.logger.appendLine(`[${new Date().toISOString()}] Returning ${this._cachedModels.length} cached models`);
			return this._cachedModels;
		}

		this.logger.appendLine(`[${new Date().toISOString()}] Starting fresh model discovery...`);
		
		// Check if VS Code LM API is available
		if (!vscode.lm) {
			this.logger.appendLine(`[${new Date().toISOString()}] ERROR: VS Code Language Model API not available. Your VS Code version might be too old.`);
			throw new Error('VS Code Language Model API not available. Please update VS Code to version 1.90.0 or later.');
		}

		this.logger.appendLine(`[${new Date().toISOString()}] VS Code LM API is available`);

		// Check if GitHub Copilot Chat extension is active
		const copilotExtension = vscode.extensions.getExtension('github.copilot-chat');
		if (copilotExtension) {
			this.logger.appendLine(`[${new Date().toISOString()}] GitHub Copilot Chat extension found. Active: ${copilotExtension.isActive}`);
			if (!copilotExtension.isActive) {
				this.logger.appendLine(`[${new Date().toISOString()}] Attempting to activate GitHub Copilot Chat extension...`);
				try {
					await copilotExtension.activate();
					this.logger.appendLine(`[${new Date().toISOString()}] GitHub Copilot Chat extension activated successfully`);
				} catch (err) {
					this.logger.appendLine(`[${new Date().toISOString()}] Failed to activate GitHub Copilot Chat extension: ${String(err)}`);
				}
			}
		} else {
			this.logger.appendLine(`[${new Date().toISOString()}] WARNING: GitHub Copilot Chat extension not found`);
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

		// Enhanced debugging information
		this.logger.appendLine(`[${new Date().toISOString()}] Model discovery results:`);
		this.logger.appendLine(`[${new Date().toISOString()}] - Total models found: ${models?.length || 0}`);
		
		if (models && models.length > 0) {
			for (const model of models) {
				this.logger.appendLine(`[${new Date().toISOString()}] - Model: ${model.id} (vendor: ${model.vendor || 'unknown'})`);
			}
		}
		// If no models found, provide detailed troubleshooting information
		if (!models || models.length === 0) {
			this.logger.appendLine(`[${new Date().toISOString()}] No models found. Troubleshooting information:`);
			
			// Check various extensions that might provide language models
			const extensionsToCheck = [
				'github.copilot-chat',
				'github.copilot',
				'ms-vscode.vscode-copilot-chat'
			];
			
			for (const extId of extensionsToCheck) {
				const ext = vscode.extensions.getExtension(extId);
				if (ext) {
					this.logger.appendLine(`[${new Date().toISOString()}] - Extension ${extId}: installed, active: ${ext.isActive}`);
				} else {
					this.logger.appendLine(`[${new Date().toISOString()}] - Extension ${extId}: not installed`);
				}
			}
			
			// Show user-friendly error with guidance
			throw new Error(ERROR_MESSAGES.NO_MODELS);
		}
		// Check if models have permission without triggering consent dialogs
		if (this.context) {
			this.logger.appendLine(`[${new Date().toISOString()}] Checking permission status for discovered models...`);
			let modelsWithoutPermission = 0;
			
			try {
				const accessInfo = this.context.languageModelAccessInformation;
				for (const model of models) {
					const canSend = accessInfo.canSendRequest(model);
					if (canSend !== true) {
						modelsWithoutPermission++;
					}
				}
				
				this.logger.appendLine(`[${new Date().toISOString()}] Permission status: ${models.length - modelsWithoutPermission}/${models.length} models have permission`);
				
				// Log diagnostic information but don't block the flow
				// According to VS Code docs, permission dialogs should only appear during sendRequest() calls
				if (modelsWithoutPermission === models.length) {
					this.logger.appendLine(`[${new Date().toISOString()}] All models lack permission - permission dialog will appear naturally during testing phase`);
				} else if (modelsWithoutPermission > 0) {
					this.logger.appendLine(`[${new Date().toISOString()}] Some models lack permission - this is normal for first-time usage`);
				}
			} catch (err) {
				this.logger.appendLine(`[${new Date().toISOString()}] Error checking permissions (continuing anyway): ${String(err)}`);
			}
		}

		// Log permission status for diagnostics but don't trigger consent dialog here
		this.logPermissionStatus(models);

		this.logger.appendLine(`[${new Date().toISOString()}] Successfully fetched ${models.length} models`);
		this._cachedModels = models; // Cache the fetched models
		return models;
	}

	/**
	 * Log permission status for diagnostics but don't trigger consent dialog here
	 */
	private logPermissionStatus(models: ExtendedLanguageModelChat[]): void {
		if (!this.context) {
			this.logger.appendLine(`[${new Date().toISOString()}] No extension context available, skipping permission diagnostics`);
			return;
		}

		try {
			const accessInfo = this.context.languageModelAccessInformation;
			this.logger.appendLine(`[${new Date().toISOString()}] Permission diagnostics for ${models.length} models:`);
			
			for (const model of models) {
				const canSend = accessInfo.canSendRequest(model);
				this.logger.appendLine(`[${new Date().toISOString()}] - ${model.id}: ${canSend === true ? 'GRANTED' : canSend === false ? 'DENIED' : 'UNKNOWN'}`);
			}
		} catch (err) {
			this.logger.appendLine(`[${new Date().toISOString()}] Error during permission diagnostics: ${String(err)}`);
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

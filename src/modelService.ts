import * as vscode from 'vscode';
import { ExtendedLanguageModelChat, ModelSummary, SendResult, ModelNotSupportedError } from './types';

export class ModelService {
	private logger: vscode.OutputChannel;
private _cachedModels: ExtendedLanguageModelChat[] | null = null;
private _cachedSendResults: Record<string, SendResult> | null = null;

	constructor(logger: vscode.OutputChannel) {
		this.logger = logger;
	}

	async fetchModels(cancellationToken?: vscode.CancellationToken): Promise<ExtendedLanguageModelChat[]> {
	this.logger.appendLine(`[${new Date().toISOString()}] Starting model fetch...`);
	
	if (this._cachedModels) {
		this.logger.appendLine(`[${new Date().toISOString()}] Returning cached models.`);
		return this._cachedModels;
	}

	if (cancellationToken?.isCancellationRequested) {
		throw new vscode.CancellationError();
	}

	let models: ExtendedLanguageModelChat[] = [];
	
	// Try Copilot models first
		try {
			this.logger.appendLine(`[${new Date().toISOString()}] Fetching Copilot models...`);
			models = await vscode.lm.selectChatModels({ vendor: 'copilot' }) as ExtendedLanguageModelChat[];
            this.logger.appendLine(`[${new Date().toISOString()}] Found ${models.length} Copilot models`);
		} catch (err) {
			this.logger.appendLine(`[${new Date().toISOString()}] Error fetching Copilot models: ${String(err)}`);
			models = [];
		}

		if (cancellationToken?.isCancellationRequested) {
			throw new vscode.CancellationError();
		}

		// Fallback to all models if no Copilot models found
		if (!models || models.length === 0) {
			try {
				this.logger.appendLine(`[${new Date().toISOString()}] Fetching all available models...`);
				models = await vscode.lm.selectChatModels({}) as ExtendedLanguageModelChat[];
				this.logger.appendLine(`[${new Date().toISOString()}] Found ${models.length} total models`);
			} catch (err) {
				this.logger.appendLine(`[${new Date().toISOString()}] Error fetching all models: ${String(err)}`);
				throw new Error(`Failed to fetch language models: ${String(err)}`);
			}
		}

		if (cancellationToken?.isCancellationRequested) {
			throw new vscode.CancellationError();
		}

		if (!models || models.length === 0) {
			throw new Error('No language models available. Please ensure GitHub Copilot Chat or another provider is enabled.');
		}

		this.logger.appendLine(`[${new Date().toISOString()}] Successfully fetched ${models.length} models`);
		this._cachedModels = models; // Cache the fetched models
		return models;
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

		const totalModels = models.length;
		
		for (let i = 0; i < models.length; i++) {
			if (cancellationToken?.isCancellationRequested) {
				throw new vscode.CancellationError();
			}

			const model = models[i];
			const progressMessage = `Testing ${model.name} (${i + 1}/${totalModels})...`;
			progress.report({ 
				message: progressMessage,
				increment: (100 / totalModels)
			});

			try {
				this.logger.appendLine(`[${new Date().toISOString()}] Testing model: ${model.id}`);
						const testOptions: vscode.LanguageModelChatRequestOptions = {
					justification: 'Testing model capabilities for VS Code LM Explorer extension'
					// Note: Using model defaults (no explicit modelOptions)
				};

				let resp: vscode.LanguageModelChatResponse;
				let errorDetails: any = undefined;

				try {
					resp = await model.sendRequest(
						[vscode.LanguageModelChatMessage.User('Hello! Please respond with a brief greeting.')], 
						testOptions,
						cancellationToken
					);
				} catch (err: any) {
					if (err instanceof vscode.CancellationError) {
						throw err;
					}
					
					if (err && typeof err === 'object' && 'message' in err) {
						errorDetails = {
							message: err.message,
							code: (err as any).code || undefined,
							cause: (err as any).cause || undefined
						};
					}
					this.logger.appendLine(`[${new Date().toISOString()}] Error sending request to model ${model.id}: ${String(err)}`);
					
					if (err.message?.includes('model_not_supported') || err.message?.includes('Model is not supported')) {
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
						messages: [{ role: 'user', content: 'Hello! Please respond with a brief greeting.' }],
						options: testOptions
					},
					response: text,
					errorDetails
				};

				this.logger.appendLine(`[${new Date().toISOString()}] Model ${model.id} tested successfully`);
			} catch (err) {
				if (err instanceof vscode.CancellationError) {
					throw err;
				}
				
				sendResults[model.id] = { error: String(err) };
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

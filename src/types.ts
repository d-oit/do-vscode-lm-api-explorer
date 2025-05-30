import * as vscode from 'vscode';

// Extended interface for LanguageModelChat with capabilities (not in official API yet)
export interface ExtendedLanguageModelChat extends vscode.LanguageModelChat {
	capabilities?: {
		supportsImageToText?: boolean;
		supportsToolCalling?: boolean;
	};
}

export class ModelNotSupportedError extends Error {
    constructor(modelId: string, reason: string) {
        super(`Model ${modelId} not supported: ${reason}`);
        this.name = 'ModelNotSupportedError';
    }
}

export interface ModelSummary {
	name: string;
	id: string;
	vendor: string;
	family: string;
	version: string;
	maxInputTokens: number;
	capabilities?: any;
}

export interface SendResult {
	request?: {
		model: string;
		messages: Array<{ role: string; content: string }>;
		options: vscode.LanguageModelChatRequestOptions;
	};
	response?: string | undefined;
	errorDetails?: {
		message?: string;
		code?: string;
		cause?: any;
	};
	error?: string | undefined;
}

export interface ModelExplorerData {
	models: ExtendedLanguageModelChat[];
	modelJson: Record<string, ModelSummary>;
	sendResults: Record<string, SendResult>;
}

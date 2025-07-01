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
	testSkipped?: boolean;
	customTest?: boolean;
	responseTime?: number;
	tokenCount?: {
		input?: number;
		output?: number;
	};
}

export interface CustomTestRequest {
	prompt: string;
	modelIds: string[];
	options?: {
		temperature?: number;
		maxTokens?: number;
		justification?: string;
	};
}

export interface ModelComparison {
	prompt: string;
	results: Record<string, SendResult>;
	timestamp: number;
	summary: {
		fastest: string;
		slowest: string;
		averageResponseTime: number;
		successCount: number;
		errorCount: number;
	};
}

export interface ModelExplorerData {
	models: ExtendedLanguageModelChat[];
	modelJson: Record<string, ModelSummary>;
	sendResults: Record<string, SendResult>;
	comparisons?: ModelComparison[];
	filters?: {
		vendor?: string;
		family?: string;
		searchTerm?: string;
		supportedOnly?: boolean;
	};
}

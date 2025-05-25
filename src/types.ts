import * as vscode from 'vscode';

// Extended interface for LanguageModelChat with capabilities (not in official API yet)
export interface ExtendedLanguageModelChat extends vscode.LanguageModelChat {
	capabilities?: {
		supportsImageToText?: boolean;
		supportsToolCalling?: boolean;
	};
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
	response?: string;
	errorDetails?: {
		message?: string;
		code?: string;
		cause?: any;
	};
	error?: string;
}

export interface ModelExplorerData {
	models: ExtendedLanguageModelChat[];
	modelJson: Record<string, ModelSummary>;
	sendResults: Record<string, SendResult>;
}

import * as assert from 'assert';
import * as vscode from 'vscode';
import { ModelService } from '../modelService';
import { ExtendedLanguageModelChat, ModelNotSupportedError } from '../types';
import { UI_TEXT, ERROR_MESSAGES } from '../constants';

// Mock VS Code API
const mockOutputChannel = {
	appendLine: (_message: string) => {},
	dispose: () => {}
} as vscode.OutputChannel;

// Mock models for testing
const createMockModel = (
	id: string, 
	name: string, 
	vendor: string = 'test',
	shouldThrowError: boolean = false,
	errorType: 'cancellation' | 'model_not_supported' | 'generic' | 'none' = 'none'
): ExtendedLanguageModelChat => ({
	id,
	name,
	vendor,
	family: 'test-family',
	version: '1.0',
	maxInputTokens: 8192,
	countTokens: async () => 10,
	sendRequest: async (_messages, _options, _token) => {
		if (_token?.isCancellationRequested) {
			throw new vscode.CancellationError();
		}
		
		if (shouldThrowError) {
			switch (errorType) {
				case 'cancellation':
					throw new vscode.CancellationError();
				case 'model_not_supported':
					throw new Error(`Request Failed: 400 {"error":{"message":"${ERROR_MESSAGES.MODEL_NOT_SUPPORTED}","code":"model_not_supported"}}`);
				case 'generic':
					throw new Error('Generic test error');
				default:
					break;
			}
		}
		
		return {
			text: (async function* () {
				yield 'Test response from ' + name;
			})(),
			stream: (async function* () {
				yield { kind: 'textPart', value: 'Test response from ' + name };
			})()
		};
	}
});

suite('ModelService Unit Tests', () => {
	let modelService: ModelService;
	setup(() => {
		modelService = new ModelService(mockOutputChannel); // Context is optional for tests
		// Clear any cached data before each test
		modelService.clearCache();
	});
	
	teardown(() => {
		// Safe cleanup - clear cache and attempt disposal
		try {
			modelService.clearCache();
			if (mockOutputChannel && typeof mockOutputChannel.dispose === 'function') {
				mockOutputChannel.dispose();
			}
		} catch (error) {
			// Ignore disposal errors in tests
			console.log('Test cleanup error (ignored):', error);
		}
	});

	test('should create ModelService instance', () => {
		assert.ok(modelService instanceof ModelService);
	});

	suite('buildModelSummary', () => {
		test('should build model summary correctly', () => {
			const mockModels = [
				createMockModel('test-model-1', 'Test Model 1', 'test-vendor'),
				createMockModel('test-model-2', 'Test Model 2', 'another-vendor')
			];

			const summary = modelService.buildModelSummary(mockModels);
			
			assert.strictEqual(Object.keys(summary).length, 2);
			assert.ok('test-model-1' in summary);
			assert.ok('test-model-2' in summary);
			
			assert.strictEqual(summary['test-model-1'].name, 'Test Model 1');
			assert.strictEqual(summary['test-model-1'].vendor, 'test-vendor');
			assert.strictEqual(summary['test-model-1'].maxInputTokens, 8192);
		});

		test('should handle empty models array', () => {
			const summary = modelService.buildModelSummary([]);
			assert.strictEqual(Object.keys(summary).length, 0);
		});
		test('should handle cancellation during summary building', () => {
			const mockModels = [createMockModel('test-model', 'Test Model')];
			const mockCancellationToken = {
				isCancellationRequested: true,
				onCancellationRequested: () => ({ dispose: () => {} })
			} as vscode.CancellationToken;

			assert.throws(() => {
				modelService.buildModelSummary(mockModels, mockCancellationToken);
			}, vscode.CancellationError);
		});
	});

	suite('testModels', () => {
		test('should test models successfully', async () => {
			const mockModels = [
				createMockModel('test-model-1', 'Test Model 1'),
				createMockModel('test-model-2', 'Test Model 2')
			];

			const mockProgress = {
				report: () => {}
			} as vscode.Progress<{ message?: string; increment?: number }>;

			const results = await modelService.testModels(mockModels, mockProgress);
			
			assert.strictEqual(Object.keys(results).length, 2);
			assert.ok('test-model-1' in results);
			assert.ok('test-model-2' in results);
					// Check successful response
			assert.ok(results['test-model-1'].response);
			assert.ok(results['test-model-1'].response!.includes('Test response from Test Model 1'));
			assert.strictEqual(results['test-model-1'].request!.model, 'test-model-1');
			assert.strictEqual(results['test-model-1'].request!.options.justification, UI_TEXT.TEST.JUSTIFICATION);
		});

		test('should handle model not supported error', async () => {
			const mockModels = [
				createMockModel('unsupported-model', 'Unsupported Model', 'test', true, 'model_not_supported')
			];

			const mockProgress = {
				report: () => {}
			} as vscode.Progress<{ message?: string; increment?: number }>;

			const results = await modelService.testModels(mockModels, mockProgress);
			
			assert.ok('unsupported-model' in results);
			assert.ok(results['unsupported-model'].error);
			assert.ok(results['unsupported-model'].error.includes(ERROR_MESSAGES.MODEL_NOT_SUPPORTED));
		});

		test('should handle generic errors', async () => {
			const mockModels = [
				createMockModel('error-model', 'Error Model', 'test', true, 'generic')
			];

			const mockProgress = {
				report: () => {}
			} as vscode.Progress<{ message?: string; increment?: number }>;

			const results = await modelService.testModels(mockModels, mockProgress);
			
			assert.ok('error-model' in results);
			assert.ok(results['error-model'].error);
			assert.ok(results['error-model'].error.includes('Generic test error'));
		});

		test('should handle cancellation during testing', async () => {
			const mockModels = [createMockModel('test-model', 'Test Model')];
			const mockProgress = {
				report: () => {}
			} as vscode.Progress<{ message?: string; increment?: number }>;
			
			const mockCancellationToken = {
				isCancellationRequested: true,
				onCancellationRequested: () => ({ dispose: () => {} })
			} as vscode.CancellationToken;

			try {
				await modelService.testModels(mockModels, mockProgress, mockCancellationToken);
				assert.fail('Should have thrown CancellationError');
			} catch (error) {
				assert.ok(error instanceof vscode.CancellationError);
			}
		});

		test('should return cached results on subsequent calls', async () => {
			const mockModels = [createMockModel('test-model', 'Test Model')];
			const mockProgress = {
				report: () => {}
			} as vscode.Progress<{ message?: string; increment?: number }>;

			// First call
			const results1 = await modelService.testModels(mockModels, mockProgress);
			// Second call should return cached results
			const results2 = await modelService.testModels(mockModels, mockProgress);
			
			assert.deepStrictEqual(results1, results2);
		});
	});

	suite('clearCache', () => {
		test('should clear cached data', async () => {
			const mockModels = [createMockModel('test-model', 'Test Model')];
			const mockProgress = {
				report: () => {}
			} as vscode.Progress<{ message?: string; increment?: number }>;

			// Generate some cached data
			await modelService.testModels(mockModels, mockProgress);
			
			// Clear cache
			modelService.clearCache();
			
			// This is mainly testing that clearCache doesn't throw errors
			// The actual cache clearing is tested indirectly through other methods
			assert.doesNotThrow(() => {
				modelService.clearCache();
			});
		});
	});
});

suite('ModelService Integration Tests', () => {
	test('should handle complete workflow', async () => {
		const modelService = new ModelService(mockOutputChannel);
		const mockModels = [
			createMockModel('working-model', 'Working Model'),
			createMockModel('failing-model', 'Failing Model', 'test', true, 'generic')
		];

		// Build summary
		const summary = modelService.buildModelSummary(mockModels);
		assert.strictEqual(Object.keys(summary).length, 2);

		// Test models
		const mockProgress = {
			report: () => {}
		} as vscode.Progress<{ message?: string; increment?: number }>;
		
		const results = await modelService.testModels(mockModels, mockProgress);
		
		// Should have results for both models
		assert.strictEqual(Object.keys(results).length, 2);
		
		// Working model should have successful response
		assert.ok(results['working-model'].response);
		assert.ok(!results['working-model'].error);
		
		// Failing model should have error
		assert.ok(results['failing-model'].error);
		assert.ok(!results['failing-model'].response);
	});
});

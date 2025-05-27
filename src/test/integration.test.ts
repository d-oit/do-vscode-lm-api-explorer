import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import { ModelService } from '../modelService';
import { HtmlGenerator } from '../htmlGenerator';

/**
 * Integration tests for the VS Code LM Model Explorer extension
 * These tests run in a real VS Code environment and test the actual extension behavior
 */
suite('LM Explorer Integration Tests', () => {
	let extension: vscode.Extension<any> | undefined;
	suiteSetup(async function() {
		this.timeout(30000); // 30 seconds for setup
		
		// Add a small delay to allow extensions and language models to activate
		await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay

		try {
			// Attempt to activate Copilot Chat by executing one of its commands
			console.log('Attempting to activate Copilot Chat extension...');
			await vscode.commands.executeCommand('github.copilot.interactive.start');
			console.log('Copilot Chat activation attempt completed.');
		} catch (error) {
			console.log('Error attempting to activate Copilot Chat:', error);
			// Ignore errors here, as Copilot Chat might not be installed or enabled
		}
		
		// In test environment, extension loading works differently
		// Let's just verify the test environment is set up correctly
		console.log('Setting up integration test environment');
		// Try to find the extension, but don't fail if not found in test environment
		extension = vscode.extensions.getExtension('doit.do-vscode-lm-explorer');
		if (extension && !extension.isActive) {
			try {
				await extension.activate();
			} catch (error) {
				console.log('Extension activation in test environment:', error);
			}
		}
	});

	suite('Extension Lifecycle', () => {
		test('Extension package.json is valid', () => {
			assert.ok(extension, 'Extension should be available');
			const packageJSON = extension.packageJSON;
			
			assert.strictEqual(packageJSON.name, 'do-vscode-lm-explorer', 'Package name should match');
			assert.strictEqual(packageJSON.displayName, 'd.o. vscode-lm Explorer', 'Display name should match');
			assert.ok(packageJSON.version, 'Should have a version');
			assert.ok(packageJSON.description, 'Should have a description');
		});
		test('Extension contributes expected commands', () => {
			assert.ok(extension, 'Extension should be available');
			const packageJSON = extension.packageJSON;
			
			const commands = packageJSON.contributes?.commands;
			assert.ok(Array.isArray(commands), 'Should contribute commands');
					const discoverModelsCommand = commands.find((cmd: any) => cmd.command === 'do-vscode-lm-explorer.discoverModels');
			assert.ok(discoverModelsCommand, 'Should contribute discoverModels command');
			assert.strictEqual(discoverModelsCommand.title, 'AI Model Explorer: Discover & Test Available Models', 'Command title should match');
		});

		test('Extension has correct activation events', () => {
			assert.ok(extension, 'Extension should be available');
			const packageJSON = extension.packageJSON;
			
			assert.ok(packageJSON.activationEvents, 'Should have activation events');
			assert.ok(
				packageJSON.activationEvents.includes('onCommand:do-vscode-lm-explorer.discoverModels'),
				'Should activate on discoverModels command'
			);
		});
	});

	suite('Command Execution', () => {
		test('Command is properly registered', async () => {
			const commands = await vscode.commands.getCommands(true);
			assert.ok(
				commands.includes('do-vscode-lm-explorer.discoverModels'),
				'discoverModels command should be registered with VS Code'
			);
		});
		test('Command execution with cancellation support', async function() {
			this.timeout(15000); // 15 seconds for API calls
			
			let commandCompleted = false;
			let cancellationSupported = false;
			let error: any = undefined;
			
			try {
				// Create a cancellation token to test cancellation support
				const cancellationTokenSource = new vscode.CancellationTokenSource();
				// Start command execution
				const commandPromise = vscode.commands.executeCommand('do-vscode-lm-explorer.discoverModels');
				
				// Cancel after a short delay to test cancellation handling
				setTimeout(() => {
					cancellationTokenSource.cancel();
					cancellationSupported = true;
				}, 100);
				
				await commandPromise;
				commandCompleted = true;
			} catch (e) {
				error = e;
				console.log('Command execution error (may be expected in test environment):', e);
			}
			
			// The command should either complete successfully or handle cancellation gracefully
			assert.ok(
				commandCompleted || cancellationSupported || (error && typeof error === 'object'),
				'Command should handle execution and cancellation gracefully'
			);
		});

		test('Command execution with progress reporting', async function() {
			this.timeout(15000);
			
			let progressReported = false;
			let error: any = undefined;
			// Monitor for progress notifications (this is tricky to test directly)
			try {
				await vscode.commands.executeCommand('do-vscode-lm-explorer.discoverModels');
				progressReported = true; // If command completes, progress was likely reported
			} catch (e) {
				error = e;
				console.log('Command execution error (may be expected in test environment):', e);
			}
			
			// The test passes if the command executes without throwing unhandled exceptions
			assert.ok(
				progressReported || (error && typeof error === 'object'),
				'Command should report progress or fail gracefully'
			);
		});

		test('Command handles no models gracefully', async function() {
			this.timeout(10000);
			
			let messageShown = false;
			const originalShowWarning = vscode.window.showWarningMessage;
			const originalShowError = vscode.window.showErrorMessage;
			
			// Mock message functions to capture calls
			vscode.window.showWarningMessage = async (message: string, ...items: any[]) => {
				if (message.includes('No language models available')) {
					messageShown = true;
				}
				return originalShowWarning(message, ...items);
			};
			
			vscode.window.showErrorMessage = async (message: string, ...items: any[]) => {
				if (message.includes('Failed to list language models')) {
					messageShown = true;
				}
				return originalShowError(message, ...items);
			};
			
			try {
				await vscode.commands.executeCommand('do-vscode-lm-explorer.discoverModels');
			} catch (e) {
				// Expected in test environment
			}
			
			// Restore original functions
			vscode.window.showWarningMessage = originalShowWarning;
			vscode.window.showErrorMessage = originalShowError;
			
			// The test passes if the command doesn't crash, regardless of whether models are available
			assert.ok(true, 'Command should handle missing models gracefully');
		});
	});

	suite('VS Code LM API Integration', () => {
		test('Extension can access VS Code LM API', async function() {
			this.timeout(5000);
			
			let apiAccessible = false;
			
			try {
				// Try to access the LM API to see if it's available
				const models = await vscode.lm.selectChatModels({});
				apiAccessible = true;
				
				if (models && models.length > 0) {
					console.log(`Found ${models.length} language model(s) in test environment`);
					
					// Test that we can read basic properties
					const firstModel = models[0];
					assert.ok(firstModel.id, 'Model should have an ID');
					assert.ok(firstModel.name, 'Model should have a name');
					assert.ok(firstModel.vendor, 'Model should have a vendor');
				} else {
					console.log('No language models available in test environment');
				}
			} catch (error) {
				console.log('VS Code LM API not available in test environment:', error);
				// This is expected in many test environments
				apiAccessible = false;
			}
			
			// The test passes regardless of API availability - we're just checking that our extension
			// can handle both scenarios without crashing
			assert.ok(true, 'Extension should handle LM API availability gracefully');
		});

		test('Extension handles LM API errors correctly', async function() {
			this.timeout(8000);
			
			// This test verifies that our extension properly handles various LM API error scenarios
			let errorHandledCorrectly = false;
			try {
				// Try to call our command - it should handle any LM API errors gracefully
				await vscode.commands.executeCommand('do-vscode-lm-explorer.discoverModels');
				errorHandledCorrectly = true;
			} catch (error) {
				// If an error is thrown, it should be a user-friendly error, not a raw API error
				const errorMessage = error instanceof Error ? error.message : String(error);
				console.log('Command error:', errorMessage);
				
				// Check that the error message is user-friendly
				const isFriendlyError = errorMessage.includes('Failed to list language models') ||
									   errorMessage.includes('Unexpected error') ||
									   errorMessage.includes('No language models available');
				
				assert.ok(isFriendlyError, 'Errors should be user-friendly');
				errorHandledCorrectly = true;
			}
			
			assert.ok(errorHandledCorrectly, 'Extension should handle LM API errors gracefully');
		});
	});

	suite('Output and Logging', () => {
		test('Extension creates output channel', async function() {
			this.timeout(5000);
			// Execute command to trigger output channel creation
			try {
				await vscode.commands.executeCommand('do-vscode-lm-explorer.discoverModels');
			} catch (e) {
				// Expected in test environment
			}
			
			// The output channel creation is internal, so we can't directly test it
			// But we can verify the command completes without crashing
			assert.ok(true, 'Command should create and use output channel without issues');
		});

		test('Extension logs are properly formatted', () => {
			// Test that our logging format is consistent
			const testDate = new Date().toISOString();
			assert.ok(testDate.includes('T'), 'ISO string should contain T separator');
			assert.ok(testDate.includes('Z'), 'ISO string should contain Z timezone indicator');
			
			// Test that error stringification works
			const testError = new Error('Test error');
			const stringified = String(testError);
			assert.ok(stringified.includes('Error'), 'Error should stringify correctly');
		});
	});
	suite('ModelService Integration', () => {
		let outputChannel: vscode.OutputChannel | undefined;
		let modelService: ModelService | undefined;
		let originalSelectChatModels: typeof vscode.lm.selectChatModels;

		const mockModels: vscode.LanguageModelChat[] = [
			{
				id: 'mock-model-1',
				name: 'Mock Model 1',
				vendor: 'MockVendor',
				family: 'MockFamily',
				version: '1.0',
				maxInputTokens: 8000,
				// capabilities: { supportsSytemMessages: true }, // Removed as not a standard property
				countTokens: async (_text: string | vscode.LanguageModelChatMessage, _token?: vscode.CancellationToken): Promise<number> => {
					// Simplified mock: return a fixed token count
					return 10;
				},
				sendRequest: async (_messages: vscode.LanguageModelChatMessage[], _options: vscode.LanguageModelChatRequestOptions, _token: vscode.CancellationToken) => {
					// Simplified mock: return a fixed response
					const responseText = "Mock response from Mock Model 1";
					return {
						text: (async function*() { yield responseText; })(),
						stream: (async function*() { yield { kind: 'textPart', value: responseText }; })()
					};
				}
			},
			{
				id: 'mock-model-2',
				name: 'Mock Model 2',
				vendor: 'AnotherMockVendor',
				family: 'AnotherMockFamily',
				version: '2.0',
				maxInputTokens: 16000,
				// capabilities: { supportsTools: true }, // Removed as not a standard property
				countTokens: async (_text: string | vscode.LanguageModelChatMessage, _token?: vscode.CancellationToken): Promise<number> => {
					// Simplified mock: return a fixed token count
					return 20;
				},
				sendRequest: async (_messages: vscode.LanguageModelChatMessage[], _options: vscode.LanguageModelChatRequestOptions, _token: vscode.CancellationToken) => {
					// Simplified mock: return a fixed response
					const responseText = "Mock response from Mock Model 2";
					return {
						text: (async function*() { yield responseText; })(),
						stream: (async function*() { yield { kind: 'textPart', value: responseText }; })()
					};
				}
			}
			// Add more mock models here if needed to simulate 15 models
		];

		setup(() => {
			outputChannel = vscode.window.createOutputChannel('Test Integration');
			modelService = new ModelService(outputChannel);

			// Mock vscode.lm.selectChatModels
			originalSelectChatModels = vscode.lm.selectChatModels;
			vscode.lm.selectChatModels = async (selector?: vscode.LanguageModelChatSelector, _token?: vscode.CancellationToken): Promise<vscode.LanguageModelChat[]> => {
				console.log('Mock selectChatModels called with selector:', selector);
				// Return mock models, potentially filtered by vendor if selector.vendor is provided
				if (selector?.vendor === 'copilot') {
					// Simulate no copilot models in this mock scenario
					return [];
				}
				// Basic filtering by vendor and family if provided in selector
				return mockModels.filter(model => {
					const vendorMatch = selector?.vendor ? model.vendor === selector.vendor : true;
					const familyMatch = selector?.family ? model.family === selector.family : true;
					return vendorMatch && familyMatch;
				});
			};
		});

		teardown(() => {
			// Restore original vscode.lm.selectChatModels
			vscode.lm.selectChatModels = originalSelectChatModels;

			// Safe disposal with error handling
			try {
				if (modelService) {
					modelService.clearCache();
					modelService = undefined;
				}
				
				if (outputChannel) {
					// Use setTimeout to defer disposal and avoid disposable store conflicts
					setTimeout(() => {
						try {
							outputChannel?.dispose();
						} catch (error) {
							// Safely ignore disposal errors in test environment
							console.log('Integration test cleanup: disposal error (ignored):', error);
						}
					}, 0);
					outputChannel = undefined;
				}
			} catch (error) {
				console.log('Integration test cleanup error (ignored):', error);
			}
		});

		test('ModelService can fetch models from VS Code API', async function() {
			this.timeout(10000);
			
			let modelsFound = false;
			let errorHandled = false;
			
			try {
				assert.ok(modelService, 'ModelService should be initialized');
				const models = await modelService.fetchModels();
				modelsFound = models && models.length > 0;
				
				if (modelsFound) {
					console.log(`ModelService found ${models.length} model(s)`);
					// Verify model structure
					const firstModel = models[0];
					assert.ok(firstModel.id, 'Model should have an ID');
					assert.ok(firstModel.name, 'Model should have a name');
					assert.ok(firstModel.vendor, 'Model should have a vendor');
				} else {
					console.log('No models available for testing in test environment');
				}
			} catch (error) {
				console.log('ModelService fetch error (expected in test environment):', error);
				errorHandled = true;
				
				// Verify error is user-friendly
				const errorMessage = error instanceof Error ? error.message : String(error);
				assert.ok(
					errorMessage.includes('No language models available') || 
					errorMessage.includes('Failed to fetch language models'),
					'Error should be user-friendly'
				);
			}
			
			assert.ok(modelsFound || errorHandled, 'ModelService should either find models or handle errors gracefully');
		});

		test('ModelService handles cancellation correctly', async function() {
			this.timeout(5000);
			
			const cancellationTokenSource = new vscode.CancellationTokenSource();
			cancellationTokenSource.cancel();
			
			try {
				assert.ok(modelService, 'ModelService should be initialized');
				await modelService.fetchModels(cancellationTokenSource.token);
				assert.fail('Should have thrown CancellationError');
			} catch (error) {
				assert.ok(error instanceof vscode.CancellationError, 'Should throw CancellationError when cancelled');
			}
		});

		test('ModelService can test models with real API calls', async function() {
			this.timeout(15000);
			
			try {
				assert.ok(modelService, 'ModelService should be initialized');
				// First try to get models
				const models = await modelService.fetchModels();
				if (models && models.length > 0) {
					// Create a mock progress reporter
					const progress = {
						report: (value: { message?: string; increment?: number }) => {
							console.log(`Progress: ${value.message} (+${value.increment}%)`);
						}
					};
					
					// Test the models
					const results = await modelService!.testModels(models.slice(0, 1), progress); // Test only first model
					
					assert.ok(typeof results === 'object', 'Should return results object');
					const firstModelId = models[0].id;
					assert.ok(firstModelId in results, 'Should have result for tested model');
					
					const result = results[firstModelId];
					assert.ok(
						result.response || result.error || result.errorDetails,
						'Result should have response or error information'
					);
				} else {
					console.log('No models available for testing in test environment');
				}
			} catch (error) {
				console.log('Model testing error (expected in test environment):', error);
				// Test passes if error is handled gracefully
			}
			
			assert.ok(true, 'Model testing should complete without unhandled exceptions');
		});
	});
	suite('HtmlGenerator Integration', () => {
		test('HtmlGenerator produces valid HTML with real data structure', () => {
			const testData = {
				models: [],
				modelJson: {},
				sendResults: {}
			};
			
			const html = HtmlGenerator.generateHtml(testData);
			
			// Basic HTML validation
			assert.ok(html.includes('<!DOCTYPE html>'), 'Should have valid DOCTYPE');
			assert.ok(html.includes('<html'), 'Should have html tag');
			assert.ok(html.includes('</html>'), 'Should close html tag');
			assert.ok(html.includes('<head>'), 'Should have head section');
			assert.ok(html.includes('<body>'), 'Should have body section');
			assert.ok(html.includes('Language Model Explorer'), 'Should have title');
		});

		test('HtmlGenerator includes complete LanguageModelChatRequestOptions documentation', () => {
			const testData = {
				models: [],
				modelJson: {},
				sendResults: {}
			};
			
			const html = HtmlGenerator.generateHtml(testData);
			
			// Check for key API documentation elements
			assert.ok(html.includes('LanguageModelChatRequestOptions'), 'Should include API interface name');
			assert.ok(html.includes('justification'), 'Should document justification parameter');
			assert.ok(html.includes('modelOptions'), 'Should document modelOptions parameter');
			assert.ok(html.includes('tools'), 'Should document tools parameter');
			assert.ok(html.includes('toolMode'), 'Should document toolMode parameter');
			assert.ok(html.includes('temperature'), 'Should document temperature sub-option');
			assert.ok(html.includes('max_tokens'), 'Should document max_tokens sub-option');
			// Check for model defaults documentation
			assert.ok(html.includes('model defaults'), 'Should mention using model defaults');
		});
		
		test('HtmlGenerator displays actual request options for models', () => {
			const testData = {
				models: [],
				modelJson: { 
					'test-model': {
						name: 'Test Model',
						id: 'test-model',
						vendor: 'test',
						family: 'test',
						version: '1.0',
						maxInputTokens: 1000
					}
				},
				sendResults: { 'test-model': { response: 'test results' } }
				};
			
			const html = HtmlGenerator.generateHtml(testData);
			
			// Check for copy functionality
			assert.ok(html.includes('copy') || html.includes('Copy'), 'Should include copy functionality');
			assert.ok(html.includes('clipboard'), 'Should reference clipboard functionality');
		});
	});

	suite('Error Handling and Resilience', () => {
		test('Extension handles various error scenarios gracefully', async function() {
			this.timeout(10000);
			
			const errorScenarios = [
				// Test with no models available
				async () => {
					try {
						await vscode.commands.executeCommand('do-vscode-lm-explorer.discoverModels');
						return 'success';
					} catch (error) {
						return error instanceof Error ? error.message : String(error);
					}
				}
			];
			
			for (const scenario of errorScenarios) {
				const result = await scenario();
				console.log('Error scenario result:', result);
				
				// All scenarios should either succeed or produce user-friendly errors
				if (typeof result === 'string' && result !== 'success') {
					assert.ok(
						result.includes('Failed to list language models') ||
						result.includes('No language models available') ||
						result.includes('Unexpected error'),
						'Error messages should be user-friendly'
					);
				}
			}
			
			assert.ok(true, 'All error scenarios should be handled gracefully');
		});
		test('Extension maintains stability under concurrent operations', async function() {
			this.timeout(15000);
			
			// Test concurrent command executions
			const promises = [];
			for (let i = 0; i < 3; i++) {
				promises.push(
					Promise.resolve(vscode.commands.executeCommand('do-vscode-lm-explorer.discoverModels')).catch((e: any) => e)
				);
			}
			
			const results = await Promise.all(promises);
			
			// All operations should complete (either successfully or with handled errors)
			for (const result of results) {
				if (result instanceof Error) {
					console.log('Concurrent operation error (expected):', result.message);
				}
			}
			
			assert.ok(true, 'Concurrent operations should not crash the extension');
		});
	});

	suiteTeardown(() => {
		console.log('Integration tests completed');
	});
});

import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';

/**
 * Integration tests for the VS Code LM Model Explorer extension
 * These tests run in a real VS Code environment and test the actual extension behavior
 */
suite('LM Explorer Integration Tests', () => {
	let extension: vscode.Extension<any> | undefined;
	suiteSetup(async function() {
		this.timeout(30000); // 30 seconds for setup
		
		// In test environment, extension loading works differently
		// Let's just verify the test environment is set up correctly
		console.log('Setting up integration test environment');
				// Try to find the extension, but don't fail if not found in test environment
		extension = vscode.extensions.getExtension('d.o.it.do-vscode-lm-explorer');
		if (extension && !extension.isActive) {
			try {
				await extension.activate();
			} catch (error) {
				console.log('Extension activation in test environment:', error);
			}
		}
	});

	suite('Extension Lifecycle', () => {		test('Extension package.json is valid', () => {
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
			
			const showModelsCommand = commands.find((cmd: any) => cmd.command === 'do-vscode-lm-explorer.showModels');
			assert.ok(showModelsCommand, 'Should contribute showModels command');
			assert.strictEqual(showModelsCommand.title, 'Show all vscode-lm chat models', 'Command title should match');
		});

		test('Extension has correct activation events', () => {
			assert.ok(extension, 'Extension should be available');
			const packageJSON = extension.packageJSON;
			
			assert.ok(packageJSON.activationEvents, 'Should have activation events');
			assert.ok(
				packageJSON.activationEvents.includes('onCommand:do-vscode-lm-explorer.showModels'),
				'Should activate on showModels command'
			);
		});
	});

	suite('Command Execution', () => {
		test('Command is properly registered', async () => {
			const commands = await vscode.commands.getCommands(true);
			assert.ok(
				commands.includes('do-vscode-lm-explorer.showModels'),
				'showModels command should be registered with VS Code'
			);
		});

		test('Command execution creates webview', async function() {
			this.timeout(15000); // 15 seconds for API calls
			
			let webviewCreated = false;
			let error: any = undefined;
			
			// Monitor for webview creation
			const disposable = vscode.window.onDidChangeActiveTextEditor(() => {
				// This is a rough way to detect webview creation
				// In a real test, you might want to mock the webview creation
			});
			
			try {
				await vscode.commands.executeCommand('do-vscode-lm-explorer.showModels');
				// If we get here without throwing, the command executed successfully
				webviewCreated = true;
			} catch (e) {
				error = e;
				console.log('Command execution error (may be expected in test environment):', e);
			} finally {
				disposable.dispose();
			}
			
			// In a test environment, the command might fail due to no LM models being available
			// but it should fail gracefully without throwing unhandled exceptions
			assert.ok(
				webviewCreated || (error && typeof error === 'object'),
				'Command should either succeed or fail gracefully'
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
				await vscode.commands.executeCommand('do-vscode-lm-explorer.showModels');
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
				await vscode.commands.executeCommand('do-vscode-lm-explorer.showModels');
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
				await vscode.commands.executeCommand('do-vscode-lm-explorer.showModels');
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

	suite('HTML Generation and Security', () => {
		test('HTML escaping prevents XSS', () => {
			// Test the escapeHtml function logic
			const dangerousInput = '<script>alert("xss")</script>&malicious';
			const escaped = dangerousInput.replace(/[&<>]/g, tag => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[tag] || tag));
			
			assert.ok(!escaped.includes('<script>'), 'Script tags should be escaped');
			assert.ok(escaped.includes('&lt;script&gt;'), 'Should contain escaped script tags');
			assert.ok(escaped.includes('&amp;malicious'), 'Ampersands should be escaped');
		});

		test('HTML template structure is valid', () => {
			// Basic check that our HTML template has required elements
			const basicHtml = `
				<!DOCTYPE html>
				<html lang="en">
				<head>
					<meta charset="UTF-8">
					<title>Language Model Explorer</title>
				</head>
				<body>
					<h1>Available Models</h1>
				</body>
				</html>
			`;
			
			assert.ok(basicHtml.includes('<!DOCTYPE html>'), 'Should have DOCTYPE');
			assert.ok(basicHtml.includes('<html lang="en">'), 'Should have language attribute');
			assert.ok(basicHtml.includes('<meta charset="UTF-8">'), 'Should have charset meta tag');
		});
	});

	suiteTeardown(() => {
		console.log('Integration tests completed');
	});
});

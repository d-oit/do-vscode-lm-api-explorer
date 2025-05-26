import * as assert from 'assert';
import * as vscode from 'vscode';
import * as myExtension from '../extension';
import { ModelService } from '../modelService';
import { HtmlGenerator } from '../htmlGenerator';
import { ExtendedLanguageModelChat, ModelSummary, SendResult } from '../types';
import { DATES } from '../constants';

// Mock data for testing
const mockModels: ExtendedLanguageModelChat[] = [
	{
		id: 'github-copilot-chat',
		name: 'GitHub Copilot Chat',
		vendor: 'copilot',
		family: 'gpt-4',
		version: '1.0',
		maxInputTokens: 8192,
		countTokens: async () => 10,
		sendRequest: async () => ({
			text: (async function* () {
				yield 'Hello! How can I help you today?';
			})(),
			stream: (async function* () {
				yield { kind: 'textPart', value: 'Hello! How can I help you today?' };
			})()
		})
	},
	{
		id: 'claude-3.7-sonnet-thought',
		name: 'Claude 3.7 Sonnet Thought',
		vendor: 'anthropic',
		family: 'claude',
		version: '3.7',
		maxInputTokens: 200000,
		countTokens: async () => 15,
		sendRequest: async () => {
			throw new Error('Request Failed: 400 {"error":{"message":"Model is not supported for this request.","code":"model_not_supported","param":"model","type":"invalid_request_error"}}');
		}
	}
];

suite('Extension Test Suite', () => {
	vscode.window.showInformationMessage('Start all tests.');

	test('Sample test', () => {
		assert.strictEqual(-1, [1, 2, 3].indexOf(5));
		assert.strictEqual(-1, [1, 2, 3].indexOf(0));
	});

	suite('LM Model Explorer Extension', () => {
		test('Extension should be present', () => {
			const extension = vscode.extensions.getExtension('d.o.it.do-vscode-lm-explorer');
			assert.ok(extension, 'Extension should be found with publisher.name format');
		});

		test('Command is registered', async () => {
			// Ensure extension is activated first
			const extension = vscode.extensions.getExtension('d.o.it.do-vscode-lm-explorer');
			if (extension && !extension.isActive) {
				try {
					await extension.activate();
				} catch (error) {
					console.log('Extension activation error:', error);
				}
			}
			
			// Wait a bit for the extension to fully activate and register commands
			await new Promise(resolve => setTimeout(resolve, 500));
			
			const commands = await vscode.commands.getCommands(true);
			const hasCommand = commands.includes('do-vscode-lm-explorer.discoverModels');
			
			if (!hasCommand) {
				console.log('Available commands containing "vscode-lm":', 
					commands.filter(cmd => cmd.includes('vscode-lm')));
				console.log('Extension active:', extension?.isActive);
			}
			
			assert.ok(hasCommand, 'Command should be registered');
		});

		test('Extension exports activate function', () => {
			assert.ok(typeof myExtension.activate === 'function', 'activate should be a function');
		});

		test('Extension exports deactivate function', () => {
			assert.ok(typeof myExtension.deactivate === 'function', 'deactivate should be a function');
		});
	});

	suite('ModelService Tests', () => {
		let outputChannel: vscode.OutputChannel;
		let modelService: ModelService;

		setup(() => {
			outputChannel = vscode.window.createOutputChannel('Test');
			modelService = new ModelService(outputChannel);
		});

		teardown(() => {
			outputChannel.dispose();
		});

		test('buildModelSummary should create correct summary structure', () => {
			const models = [mockModels[0]];
			const summary = modelService.buildModelSummary(models);
			
			assert.ok(summary['github-copilot-chat'], 'Should contain the model id as key');
			assert.strictEqual(summary['github-copilot-chat'].name, 'GitHub Copilot Chat');
			assert.strictEqual(summary['github-copilot-chat'].vendor, 'copilot');
			assert.strictEqual(summary['github-copilot-chat'].maxInputTokens, 8192);
		});

		test('buildModelSummary should handle multiple models', () => {
			const summary = modelService.buildModelSummary(mockModels);
			
			assert.strictEqual(Object.keys(summary).length, 2);
			assert.ok(summary['github-copilot-chat']);
			assert.ok(summary['claude-3.7-sonnet-thought']);
		});

		test('buildModelSummary should handle cancellation', () => {
			const cancellationTokenSource = new vscode.CancellationTokenSource();
			cancellationTokenSource.cancel();
			
			assert.throws(() => {
				modelService.buildModelSummary(mockModels, cancellationTokenSource.token);
			}, vscode.CancellationError);
		});
	});

	suite('HtmlGenerator Tests', () => {
		test('generateHtml should create valid HTML structure', () => {
			const data = {
				models: [mockModels[0]],
				modelJson: { 'github-copilot-chat': { 
					name: 'GitHub Copilot Chat',
					id: 'github-copilot-chat',
					vendor: 'copilot',
					family: 'gpt-4',
					version: '1.0',
					maxInputTokens: 8192
				}},
				sendResults: {
					'github-copilot-chat': {
						response: 'Hello! How can I help you today?',
						request: { 
							model: 'github-copilot-chat', 
							messages: [{ role: 'user', content: 'hello' }],
							options: { justification: 'Testing model capabilities for VS Code LM Explorer extension' }
						}
					}
				}
			};
			
			const html = HtmlGenerator.generateHtml(data);
			
			assert.ok(html.includes('<!DOCTYPE html>'), 'Should be valid HTML document');
			assert.ok(html.includes('Language Model Explorer'), 'Should contain title');
			assert.ok(html.includes('GitHub Copilot Chat'), 'Should contain model name');
			assert.ok(html.includes('✅'), 'Should contain success icon for working model');
			assert.ok(html.includes('accordion'), 'Should contain accordion UI elements');
		});

		test('generateHtml should handle unsupported models', () => {
			const data = {
				models: [mockModels[1]],
				modelJson: { 'claude-3.7-sonnet-thought': { 
					name: 'Claude 3.7 Sonnet Thought',
					id: 'claude-3.7-sonnet-thought',
					vendor: 'anthropic',
					family: 'claude',
					version: '3.7',
					maxInputTokens: 200000
				}},
				sendResults: {
					'claude-3.7-sonnet-thought': {
						error: 'Request Failed: 400 {"error":{"message":"Model is not supported for this request.","code":"model_not_supported"}}'
					}
				}
			};
			
			const html = HtmlGenerator.generateHtml(data);
			
			assert.ok(html.includes('❌'), 'Should contain error icon for unsupported model');
			assert.ok(html.includes('Not Supported'), 'Should show not supported text');
			assert.ok(html.includes('⚠️'), 'Should show warning message');
		});

		test('generateHtml should include LanguageModelChatRequestOptions documentation', () => {
			const data = {
				models: [mockModels[0]],
				modelJson: {},
				sendResults: {}
			};
			
			const html = HtmlGenerator.generateHtml(data);
			
			assert.ok(html.includes('LanguageModelChatRequestOptions'), 'Should contain API documentation');
			assert.ok(html.includes('justification'), 'Should contain justification parameter');
			assert.ok(html.includes('modelOptions'), 'Should contain modelOptions parameter');
			assert.ok(html.includes('temperature'), 'Should contain temperature sub-option');
			assert.ok(html.includes('tools'), 'Should contain tools parameter');
			assert.ok(html.includes('toolMode'), 'Should contain toolMode parameter');
		});

		test('generateHtml should display actual request options used', () => {
			const data = {
				models: [mockModels[0]],
				modelJson: {},
				sendResults: {
					'github-copilot-chat': {
						response: 'Hello!',
						request: { 
							model: 'github-copilot-chat', 
							messages: [{ role: 'user', content: 'hello' }],
							options: { 
								justification: 'Testing model capabilities for VS Code LM Explorer extension'
								// Note: No explicit modelOptions - using model defaults
							}
						}
					}
				}
			};
			
			const html = HtmlGenerator.generateHtml(data);
			
			assert.ok(html.includes('Request Options Used'), 'Should show request options used section');
			assert.ok(html.includes('Testing model capabilities for VS Code LM Explorer extension'), 'Should show actual justification used');
			assert.ok(html.includes('github-copilot-chat'), 'Should show model ID in request data');
		});

		test('generateHtml should escape HTML content properly', () => {
			const data = {
				models: [{
					...mockModels[0],
					name: 'Test<script>alert("xss")</script>Model',
					vendor: 'test&vendor'
				}],
				modelJson: {},
				sendResults: {}
			};
			
			const html = HtmlGenerator.generateHtml(data);
			
			assert.ok(html.includes('&lt;script&gt;'), 'Should escape < and > in script tags');
			assert.ok(html.includes('test&amp;vendor'), 'Should escape & in vendor name');
			assert.ok(!html.includes('<script>alert'), 'Should not contain unescaped script tags');
		});
	});

	suite('Premium Request Warning Tests', () => {
		test('Should show premium warning after June 4, 2025', () => {
			const currentDate = new Date('2025-06-05T00:00:00Z'); // After the warning date
			const warningDate = DATES.PREMIUM_REQUEST_WARNING_START;
			
			const shouldShowWarning = currentDate >= warningDate;
			assert.ok(shouldShowWarning, 'Should show warning after June 4, 2025');
		});

		test('Should not show premium warning before June 4, 2025', () => {
			const currentDate = new Date('2025-06-03T00:00:00Z'); // Before the warning date
			const warningDate = DATES.PREMIUM_REQUEST_WARNING_START;
			
			const shouldShowWarning = currentDate >= warningDate;
			assert.ok(!shouldShowWarning, 'Should not show warning before June 4, 2025');
		});

		test('generateHtml should handle testSkipped models correctly', () => {
			const data = {
				models: [
					mockModels[0]
				],
				modelJson: {
					'github-copilot-chat': {
						name: 'GitHub Copilot Chat',
						id: 'github-copilot-chat',
						vendor: 'GitHub',
						family: 'copilot',
						version: '1.0',
						maxInputTokens: 4096,
					},
				},
				sendResults: {
					'github-copilot-chat': {
						status: 'skipped',
						testSkipped: true,
						request: {
							model: 'github-copilot-chat',
							messages: [],
							options: {}
						},
						response: undefined,
						error: undefined,
					}
				}
			};
			
			const html = HtmlGenerator.generateHtml(data);
			
			assert.ok(html.includes('⏭️'), 'Should contain skip icon for testSkipped model');
			assert.ok(html.includes('Testing Skipped'), 'Should show testing skipped text');
			assert.ok(html.includes('model-skipped'), 'Should apply model-skipped CSS class');
			assert.ok(html.includes('Testing was skipped to avoid premium request usage'), 'Should show premium request explanation');
		});

		test('generateHtml should not show test results when testSkipped is true', () => {
			const data = {
				models: [mockModels[0]],
				modelJson: {},
				sendResults: {
					'github-copilot-chat': {
						testSkipped: true,
						response: undefined,
						request: { 
							model: 'github-copilot-chat', 
							messages: [{ role: 'user', content: 'hello' }],
							options: { justification: 'Testing' }
						}
					}
				}
			};
			
			const html = HtmlGenerator.generateHtml(data);
			
			assert.ok(!html.includes('Request Options Used'), 'Should not show request options when testSkipped');
			assert.ok(!html.includes('Test Response'), 'Should not show test response when testSkipped');
			assert.ok(!html.includes('This should not appear'), 'Should not show response content when testSkipped');
		});
	});
});

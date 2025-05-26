import * as vscode from 'vscode';
import { PROGRESS_STEPS } from './constants';

/**
 * Enhanced progress reporter that provides more precise progress calculation
 * based on the actual complexity and estimated time of each step.
 */
export class ProgressReporter {
	private progress: vscode.Progress<{ message?: string; increment?: number }>;
	private currentStep: number = 0;
	private totalSteps: number = 0;
	private stepWeights: number[] = [];
	
	constructor(progress: vscode.Progress<{ message?: string; increment?: number }>) {
		this.progress = progress;
		this.initializeSteps();
	}

	private initializeSteps(): void {
		// Calculate total steps and weights based on the progress configuration
		const steps = Object.values(PROGRESS_STEPS);
		this.totalSteps = steps.length;
		this.stepWeights = steps.map(step => step.weight);
	}

	/**
	 * Report progress for fetching models step
	 */
	reportFetchModels(message: string = 'Discovering available AI models...'): void {
		this.reportStep(message, PROGRESS_STEPS.FETCH_MODELS.increment);
	}

	/**
	 * Report progress for analyzing capabilities step
	 */
	reportAnalyzingCapabilities(message: string = 'Analyzing model capabilities...'): void {
		this.reportStep(message, PROGRESS_STEPS.ANALYZE_CAPABILITIES.increment);
	}

	/**
	 * Report progress for testing models with dynamic calculation based on model count
	 */
	reportTestingModels(currentModel: number, totalModels: number, modelName: string): void {
		const baseMessage = `Testing ${modelName} (${currentModel}/${totalModels})...`;
		
		// Calculate progress within the testing step
		const testStepProgress = totalModels > 0 ? (currentModel / totalModels) * PROGRESS_STEPS.TEST_MODELS.increment : 0;
		
		this.reportStep(baseMessage, Math.floor(testStepProgress));
	}

	/**
	 * Report progress for preparing results step
	 */
	reportPreparingResults(message: string = 'Preparing AI model explorer...'): void {
		this.reportStep(message, PROGRESS_STEPS.PREPARE_RESULTS.increment);
	}

	/**
	 * Report completion
	 */
	reportComplete(message: string = 'AI Model Discovery Complete!'): void {
		this.progress.report({ message, increment: 100 });
	}

	/**
	 * Get the underlying VS Code progress reporter for direct use
	 */
	getVSCodeProgress(): vscode.Progress<{ message?: string; increment?: number }> {
		return this.progress;
	}

	/**
	 * Report progress for a specific step
	 */
	reportStep(message: string, increment: number): void {
		this.progress.report({
			message,
			increment
		});
	}

	/**
	 * Calculate estimated time remaining based on current progress and step weights
	 */
	getEstimatedTimeRemaining(startTime: number): number {
		const elapsed = Date.now() - startTime;
		const totalWeight = this.stepWeights.reduce((sum, weight) => sum + weight, 0);
		const completedWeight = this.stepWeights.slice(0, this.currentStep).reduce((sum, weight) => sum + weight, 0);
		
		if (completedWeight === 0) {
			return 0;
		}
		
		const estimatedTotal = (elapsed * totalWeight) / completedWeight;
		return Math.max(0, estimatedTotal - elapsed);
	}

	/**
	 * Get current progress percentage
	 */
	getCurrentProgress(): number {
		const totalWeight = this.stepWeights.reduce((sum, weight) => sum + weight, 0);
		const completedWeight = this.stepWeights.slice(0, this.currentStep).reduce((sum, weight) => sum + weight, 0);
		
		return totalWeight > 0 ? (completedWeight / totalWeight) * 100 : 0;
	}
}

/**
 * Enhanced model testing progress reporter specifically for the model testing phase
 */
export class ModelTestingProgressReporter {
	private progress: vscode.Progress<{ message?: string; increment?: number }>;
	private baseIncrement: number;
	private modelsCompleted: number = 0;
	private totalModels: number;

	constructor(
		totalModels: number,
		progress: vscode.Progress<{ message?: string; increment?: number }>
	) {
		this.progress = progress;
		this.totalModels = totalModels;
		this.baseIncrement = PROGRESS_STEPS.TEST_MODELS.increment;
	}

	/**
	 * Report progress for starting to test a specific model
	 */
	reportModelStart(modelIndex: number, modelName: string): void {
		const progressMessage = `Testing ${modelName} (${modelIndex + 1}/${this.totalModels})...`;
		
		// Calculate incremental progress for this model
		const modelIncrement = this.totalModels > 0 ? this.baseIncrement / this.totalModels : 0;
		
		this.progress.report({
			message: progressMessage,
			increment: Math.floor(modelIncrement)
		});
	}
	/**
	 * Report that a model test completed successfully
	 */
	reportModelCompletion(modelIndex: number, _modelName: string): void {
		this.modelsCompleted = modelIndex + 1;
	}

	/**
	 * Report that a model test failed
	 */
	reportModelError(modelIndex: number, _modelName: string, _error: string): void {
		this.modelsCompleted = modelIndex + 1;
	}

	/**
	 * Get the current testing progress percentage
	 */
	getTestingProgress(): number {
		return this.totalModels > 0 ? (this.modelsCompleted / this.totalModels) * 100 : 0;
	}
}

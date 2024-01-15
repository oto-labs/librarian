import { pipeline, env } from '@xenova/transformers';

env.allowLocalModels = false;
env.backends.onnx.wasm.numThreads = 1;

class PipelineSingleton {
	static task = 'feature-extraction';
	static model = 'Xenova/all-MiniLM-L6-v2';
	static instance = null;

	static async getInstance(progress_callback = null) {
		if (this.instance === null) {
			console.log('Setting up Pipeline...');
			this.instance = pipeline(this.task, this.model, { progress_callback });
		}

		return this.instance;
	}
}

const embed = async (pipelineInstance, text) => {
	const output = await pipelineInstance(text, {
        pooling: 'mean',
        normalize: true
    });

	return Array.from(output.data);
};

export { embed, PipelineSingleton };
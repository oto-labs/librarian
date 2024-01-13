import { pipeline, env } from '@xenova/transformers';

env.allowLocalModels = false;
env.backends.onnx.wasm.numThreads = 1;

class PipelineSingleton {
	static task = 'feature-extraction';
	static model = 'Xenova/all-MiniLM-L6-v2';
	static instance = null;

	static async getInstance(progress_callback = null) {
		if (this.instance === null) {
			this.instance = pipeline(this.task, this.model, { progress_callback });
		}

		return this.instance;
	}
}

const embed = async (text) => {
	let model = await PipelineSingleton.getInstance((data) => {
		// You can track the progress of the pipeline creation here.
		// e.g., you can send `data` back to the UI to indicate a progress bar
		// console.log('progress', data);
	});

	const output = await model(text, {
        pooling: 'mean', 
        normalize: true
    });

	return Array.from(output.data);
};

export { embed };
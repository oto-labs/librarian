import { pipeline, env } from '@xenova/transformers';
import { indexBookmarks } from './bookutils.js';
import { create } from '@orama/orama'
import { restore, persist } from '@orama/plugin-data-persistence'

env.allowLocalModels = false;
env.backends.onnx.wasm.numThreads = 1;

class PipelineSingleton {
	static task = 'text-classification';
	static model = 'Xenova/distilbert-base-uncased-finetuned-sst-2-english';
	static instance = null;

	static async getInstance(progress_callback = null) {
		if (this.instance === null) {
			this.instance = pipeline(this.task, this.model, { progress_callback });
		}

		return this.instance;
	}
}

class LocalDBSingleton {
	static dbName = 'librarian-vector-db'
	static dbInstance = null;

	static async getInstance() {
		if (this.dbInstance == null) {
			this.dbInstance = await create({
				id: this.dbName,
				schema: {
					title: 'string',
				  	id: 'string',
				  	// embedding: 'vector[384]',
				},
			})
		}

		return this.dbInstance;
	}

    static async saveVector() {
        if (this.dbInstance) { 
            await persist(this.dbInstance, 'json');
        }
    }

    static async restoreVector() {
        if (this.dbInstance) {
            await restore('json', this.dbInstance);
        }
    }
}

const classify = async (text) => {
	let model = await PipelineSingleton.getInstance((data) => {
		// You can track the progress of the pipeline creation here.
		// e.g., you can send `data` back to the UI to indicate a progress bar
		// console.log('progress', data);
	});

	let result = await model(text);
	return result;
};
import { indexBookmarks, searchBookmarks, LocalDBSingleton } from './bookutils.js';

////////////////////// 1. Context Menus //////////////////////
chrome.runtime.onInstalled.addListener(async function () {
	const dbInstance = await LocalDBSingleton.getInstance();
	console.log('Setup DB Instance: ' + dbInstance);
	indexBookmarks(dbInstance);

	chrome.alarms.create('librarian-indexer', {
		periodInMinutes: 15
	});
});

// Indexer scheduling
chrome.alarms.onAlarm.addListener(async (alarm) => {
	if (alarm.name == 'librarian-indexer') {
		const dbInstance = await LocalDBSingleton.getInstance();
		indexBookmarks(dbInstance);
	}
});
//////////////////////////////////////////////////////////////

////////////////////// 2. Message Events /////////////////////
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
	if (message.action !== 'search') return;

	(async function () {
		const dbInstance = await LocalDBSingleton.getInstance();
		let result = await searchBookmarks(dbInstance, message.query);
		sendResponse(result);
	})();

	return true;
});
//////////////////////////////////////////////////////////////


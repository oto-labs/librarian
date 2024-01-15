import { create, count, insertMultiple, searchVector } from '@orama/orama';
import { restore, persist } from '@orama/plugin-data-persistence';
import { PipelineSingleton, embed } from './llm.js';

class LocalDBSingleton {
	static dbNamePrefix = 'librarian-vector-db-'
	static dbInstance = null;
	static shouldSave = false;

	static async getInstance() {
		const profile = await chrome.identity.getProfileUserInfo();
		if (this.dbInstance == null) {
			this.dbInstance = await create({
				id: this.dbName + profile.id,
				schema: {
					title: 'string',
					url: 'string',
				  	embedding: 'vector[384]',
				},
			});
			// await this.restoreVector();
		}

		return this.dbInstance;
	}

	static async saveVectorIfNeeded() {
        if (this.dbInstance && this.shouldSave) { 
			console.log('Saving DB Instance');
            // await persist(this.dbInstance, 'json');
            this.shouldSave = false;
        }
    }

	static markForSave() {
		console.log('Marking DB Instance for save');
        this.shouldSave = true;
    }

	static async restoreVector() {
        if (this.dbInstance) {
			console.log('Restoring DB Instance');
            // await restore('json', this.dbInstance);
        }
    }
}

const getDBCount = async (dbInstance) => {
	return await count(dbInstance);
};

const indexBookmarks = (dbInstance) => {
	if (dbInstance) {
		chrome.bookmarks.getTree(async (tree) => {
			const bookmarksList = dumpTreeNodes(tree[0].children);
			const pipelineInstance = await PipelineSingleton.getInstance();

			let dataToInsert = [];
			let c = 0;

			for (let i = 0; i < bookmarksList.length; i++) {
				const key = bookmarksList[i].url;
				const vector = await embed(pipelineInstance, bookmarksList[i].title);
				dataToInsert.push({
					title: bookmarksList[i].title,
					url: key,
					embedding: vector
				});
				c++;
				// chrome.storage.local.get(key).then(async (result) => {
				// 	if (!result.key) {
				// 		c = c + 1;
				// 		const vector = await embed(bookmarksList[i].title);
				// 		dataToInsert.push({
				// 			title: bookmarksList[i].title,
				// 			id: key,
				// 			embedding: embed(bookmarksList[i].title)
				// 		});
				// 		chrome.storage.local.set({ key: key });
				// 	}
				// });
			}

			await insertMultiple(dbInstance, dataToInsert, 750);
			console.log("Finished indexing: " + c);
		});
	}
}

const dumpTreeNodes = (nodes) => {
	let sublist = [];

	for (const node of nodes) {
		if (node.children)
			sublist.push(...dumpTreeNodes(node.children));

		if (node.url)
			sublist.push({
				'url': node.url,
				'title': node.title
			});
	}

	return sublist;
}

const searchBookmarks = async (dbInstance, query) => {
	if (!dbInstance) return [];

	const pipelineInstance = await PipelineSingleton.getInstance();
	const queryEmbed = await embed(pipelineInstance, query);
	const result = await searchVector(dbInstance, {
		vector: queryEmbed,
		property: 'embedding',
		similarity: 0.01,
		includeVectors: false,
		limit: 10,
		offset: 0,
	})

	return result.hits;
};

export { getDBCount, indexBookmarks, searchBookmarks, LocalDBSingleton };

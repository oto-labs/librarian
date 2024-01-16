import { create, count, insertMultiple, searchVector, getByID } from '@orama/orama';
import { restore, persist } from '@orama/plugin-data-persistence';
import { PipelineSingleton, embed } from './llm.js';
import * as cheerio from 'cheerio';

class LocalDBSingleton {
	static dbNamePrefix = 'librarian-vector-db-'
	static dbInstance = null;
	static shouldSave = false;
	static profileId = '';
	static dbName = '';

	static async getInstance() {
		const profile = await chrome.identity.getProfileUserInfo();
		this.dbName = this.dbNamePrefix + profile.id;

		if (this.dbInstance == null) {
			console.log('Creating DB: ' + this.dbName);
			this.dbInstance = await create({
				// id: this.dbName,
				schema: {
					id: 'string',
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

const makeIndexedDB = async (dbName) => {
	// const request = indexedDB.open("librarian-db", 2);
	// request.onupgradeneeded = (event) => {
	// 	const db = event.target.result;
	// 	db.createObjectStore(dbName, { keyPath: "url" });
	// 	console.log('Updated IndexedDB');
	// };
};

const scrapeAndVectorize = async (dbInstance, pipelineInstance, bookmark, dataToInsert, semaphore) => {
	const url = bookmark.url;
	const result = await getByID(dbInstance, url);

	if (!result) {
		let text = bookmark.title;

		// try {
		// 	const res = await fetch(url);
		// 	const dom = cheerio.load(await res.text());
		// 	text = dom('div').text().trim().replace(/\n\s*\n/g, '\n').substring(0, 50);
		// } catch (error) {
		// 	// console.log(error);
		// }

		// if (i % 100 == 1) {
		// 	console.log(i + ' : '  + (sum / i) + 'ms');
		// }

		const vector = await embed(pipelineInstance, text);
		dataToInsert[url] = {	
			id: url,
			title: bookmark.title,
			url: url,
			embedding: vector
		};
	}

	--semaphore.count;
};

const indexBookmarks = (dbInstance) => {
	if (dbInstance) {
		chrome.bookmarks.getTree(async (tree) => {
			const bookmarksList = dumpTreeNodes(tree[0].children);
			const pipelineInstance = await PipelineSingleton.getInstance();

			let dataToInsert = {};
			let semaphore = {'count': bookmarksList.length}

			for (let i = 0; i < bookmarksList.length; i++) {
				// scrapeAndVectorize(dbInstance, pipelineInstance, bookmarksList[i], dataToInsert, semaphore);
				const bookmark = bookmarksList[i];

				const url = bookmark.url;
				const result = await getByID(dbInstance, url);

				if (!result) {
					let text = bookmark.title;

					try {
						const res = await fetch(url);
						const dom = cheerio.load(await res.text());
						text = dom('div').text().trim().replace(/\n\s*\n/g, '\n').substring(0, 50);
					} catch (error) {
						// console.log(error);
					}

					const vector = await embed(pipelineInstance, text);
					dataToInsert[url] = {	
						id: url,
						title: bookmark.title,
						url: url,
						embedding: vector
					};
				}
			}
			// setTimeout(() => {console.log(dataToInsert)}, 1000);
			// while(semaphore.count > 0) {
				// setTimeout(() => {console.log(semaphore)}, 1000);
			// }

			await insertMultiple(dbInstance, Object.values(dataToInsert), 750);
			console.log("Finished indexing");
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

export { getDBCount, makeIndexedDB, indexBookmarks, searchBookmarks, LocalDBSingleton };

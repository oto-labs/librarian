import * as cheerio from 'cheerio';
import { create, count, insertMultiple, searchVector, getByID, save, load } from '@orama/orama';
import { PipelineSingleton, embed } from './llm.js';

class LocalDBSingleton {
	static dbNamePrefix = 'librarian-vector-db-'
	static dbInstance = null;
	static profileId = '';
	static dbName = '';

	static async getInstance() {
		if (this.dbInstance == null) {
			const profile = await chrome.identity.getProfileUserInfo();
			this.dbName = this.dbNamePrefix + profile.id;

			console.log('Creating DB: ' + this.dbName);
			this.dbInstance = await create({
				id: this.dbName,
				schema: {
					id: 'string',
					embedding: 'vector[384]',
				},
			});
			await this.restoreVector();
		}

		return this.dbInstance;
	}

	static async saveVectorIfNeeded() {
        if (this.dbInstance) { 
			console.log('Saving DB Instance');
            const dbExport = await save(this.dbInstance);
			if (dbExport) {
				let serialized = {};
				serialized[this.dbName] = JSON.stringify(dbExport);
				chrome.storage.local.set(serialized).then(() => {
					console.log('Saved OK');
				});
			}
        }
    }

	static async restoreVector() {
        if (this.dbInstance) {
			console.log('Restoring DB Instance');
            chrome.storage.local.get(this.dbName).then((result) => {
				if (result && Object.keys(result).includes(this.dbName)) {
					load(this.dbInstance, JSON.parse(result[this.dbName]));
				}
			});
        }
    }
}

const getDBCount = async (dbInstance) => {
	return await count(dbInstance);
};

const scrapeAndVectorize = async (dbInstance, pipelineInstance, bookmark) => {
	return new Promise(resolve => {
		const url = bookmark.url;
		getByID(dbInstance, url).then((result) => {
			if (result) {
				resolve({});
				return;
			}

			const text = fetch(url).then(res => res.text()).then(res => {
				const dom = cheerio.load(res);
				return dom('div').text().trim().replace(/\n\s*\n/g, '\n').substring(0, 50);
			}).catch(error => bookmark.title);

			text.then((res) => {
				embed(pipelineInstance, res).then(vector => {
					resolve({
						id: url,
						title: bookmark.title,
						url: url,
						embedding: vector
					});
				}).catch(error => resolve({}));
			}).catch(error => resolve({}));
		}).catch(error => {
			resolve({});
		});
	});
};

const indexBookmarks = (dbInstance) => {
	if (dbInstance) {
		console.log('Indexing bookmarks')
		chrome.bookmarks.getTree(async (tree) => {
			const bookmarksList = dumpTreeNodes(tree[0].children).slice(0, 5);
			const pipelineInstance = await PipelineSingleton.getInstance();
			let dataToInsert = {};

			chrome.storage.sync.set({ 'indexingStarted': true });

			console.log('Started indexing: ' + Date.now());
			const embeddedDate = await Promise.all(bookmarksList.map((bookmark) => {
				return scrapeAndVectorize(dbInstance, pipelineInstance, bookmark);
			}));
			console.log(embeddedDate);
			embeddedDate.forEach((result) => {
				if (result)
					dataToInsert[result.url] = result;
			});

			await insertMultiple(dbInstance, Object.values(dataToInsert), 750);
			LocalDBSingleton.saveVectorIfNeeded();
			console.log("Finished indexing: " + Date.now());

			chrome.storage.sync.set({ 'indexingStarted': false });

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
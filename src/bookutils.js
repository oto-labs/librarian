import { create, insertMultiple, search, searchVector } from '@orama/orama'
import { embed } from './llm.js';

class LocalDBSingleton {
	static dbName = 'librarian-vector-db'
	static dbInstance = null;

	static async getInstance() {
		if (this.dbInstance == null) {
			this.dbInstance = await create({
				id: this.dbName,
				schema: {
					title: 'string',
					url: 'string',
				  	embedding: 'vector[384]',
				},
			})
		}

		return this.dbInstance;
	}
}

const indexBookmarks = (dbInstance) => {
	if (!dbInstance) return;

	chrome.bookmarks.getTree(async (tree) => {
		const bookmarksList = dumpTreeNodes(tree[0].children);
		let dataToInsert = [];

		for (let i = 0; i < bookmarksList.length; i++) {
			const vector = await embed(bookmarksList[i].title);
			dataToInsert.push({
				title: bookmarksList[i].title,
				url: bookmarksList[i].url,
				embedding: vector
			});
			// chrome.storage.local.get([key]).then((result) => {
			// 	if (!result.key) {
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
		console.log("Finished indexing")
    });
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

	const queryEmbed = await embed(query);
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

export { indexBookmarks, searchBookmarks, LocalDBSingleton };
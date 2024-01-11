import { insert, insertMultiple, remove, search, searchVector } from '@orama/orama'

const indexBookmarks = (dbInstance) => {
	if (dbInstance) {
		chrome.bookmarks.getTree(async (tree) => {
			const bookmarksList = dumpTreeNodes(tree[0].children);
			let dataToInsert = [];
			for (let i = 0; i < bookmarksList.length; i++) {
				dataToInsert.push({
					title: bookmarksList[i].title,
					id: bookmarksList[i].url
					// embedding: getVector(bookmarksList[i].url)
				})
			}
			await insertMultiple(dbInstance, dataToInsert, 750);

			console.log(await search(dbInstance, {
				term: 'Neural'
			}));
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

export { indexBookmarks };
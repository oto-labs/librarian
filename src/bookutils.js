import { insert, remove, search, searchVector } from '@orama/orama'

const indexBookmarks = (dbInstance) => {
	if (dbInstance) {
		chrome.bookmarks.getTree(async (tree) => {
			const bookmarksList = dumpTreeNodes(tree[0].children);
			console.log(bookmarksList);
			bookmarksList.forEach(async (data) => {
				await insert(dbInstance, {
					title: data.title,
					url: data.url,
					// embedding: getVector(data.content)
				})
			});

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
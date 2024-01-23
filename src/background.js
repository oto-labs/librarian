import { getDBCount, indexBookmarks, searchBookmarks, LocalDBSingleton } from './bookutils.js';

////////////////////// Init //////////////////////
chrome.runtime.onInstalled.addListener(async function () {
	const dbInstance = await LocalDBSingleton.getInstance();
	indexBookmarks(dbInstance);

	chrome.alarms.create('librarian-indexer', {
		periodInMinutes: 1
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

////////////////////// Message Events /////////////////////
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
	if (message.action !== 'search') return;

	(async function () {
		const dbInstance = await LocalDBSingleton.getInstance();
		let result = await searchBookmarks(dbInstance, message.query);
		sendResponse({
			result: result,
			dbCount: await getDBCount(dbInstance)
		});
	})();

	return true;
});
//////////////////////////////////////////////////////////////

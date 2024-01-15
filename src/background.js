import { getDBCount, indexBookmarks, searchBookmarks, LocalDBSingleton, makeIndexedDB } from './bookutils.js';

////////////////////// 1. Context Menus //////////////////////
chrome.runtime.onInstalled.addListener(async function () {
	console.log('Setting up DBs...');

	const dbInstance = await LocalDBSingleton.getInstance();
	makeIndexedDB(LocalDBSingleton.dbName);
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
        LocalDBSingleton.markForSave();
	}
});

// Regularly save the state of the database
// setInterval(async () => {
// 	await LocalDBSingleton.saveVectorIfNeeded();
// }, 60000); // Save every 60 seconds, adjust as needed
//////////////////////////////////////////////////////////////

////////////////////// 2. Message Events /////////////////////
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

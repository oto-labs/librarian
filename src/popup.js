const inputElement = document.getElementById('text');
const searchButton = document.getElementById('search-button');
const outputElement = document.getElementById('output');
const loader = document.getElementById('loader');
const indexLoader = document.getElementById('index-loader');
const progressBar = document.getElementById('progress-bar');

const makeBookmarkItem = (bookDoc) => {
	const a = document.createElement('a');
	a.href = bookDoc.url;
	a.appendChild(document.createTextNode(bookDoc.title));
	const d = document.createElement('div');
	d.appendChild(a);
	return d;
};

searchButton.addEventListener('click', () => {
	const query = inputElement.value;
	if (!query)
		return;

	loader.style.display = 'block';
	outputElement.innerText = '';

	const message = {
		action: 'search',
		query: query,
	}
	chrome.runtime.sendMessage(message, (response) => {
		loader.style.display = 'none';
		if (response.result.length > 0) {
			response.result.forEach((element) => {
				outputElement.appendChild(makeBookmarkItem(element.document));
			});
		} else {
			outputElement.innerText = 'No results found';
		}
	});
});

async function checkIndexingStatus() {
	const storageVar = await chrome.storage.sync.get(['indexingStarted', 'bookmarksLength', 'bookmarksIndexProgress']);

	const indexingStarted = storageVar['indexingStarted'];
	const bookmarksLength = storageVar['bookmarksLength'];
	const bookmarksIndexProgress = storageVar['bookmarksIndexProgress'];

	if (indexingStarted && bookmarksLength > bookmarksIndexProgress) {
		indexLoader.style.display = 'flex';
		progressBar.value = bookmarksIndexProgress ? bookmarksIndexProgress : 0;
		progressBar.max = bookmarksLength ? bookmarksLength : 100;

	} else {
		indexLoader.style.display = 'none';
	}
}

window.onload=function(){
	checkIndexingStatus();
	setInterval(checkIndexingStatus, 1000);
}

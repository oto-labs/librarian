const inputElement = document.getElementById('text');
const searchButton = document.getElementById('search-button');
const clearButton = document.getElementById('clear-button');
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

const buildResultsDiv = (results) => {
	results.forEach((element) => {
		outputElement.appendChild(makeBookmarkItem(element.document));
	});
};

clearButton.addEventListener('click', () => {
	inputElement.value = '';
	outputElement.innerText = '';
});

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
			chrome.storage.sync.set({'librarian-saved-results': {
				'saveTime': Date.now(),
				'results': response.result,
				'query': query
			}});
			buildResultsDiv(response.result);
		} else {
			outputElement.innerText = 'No results found :(';
		}
	});
});

const reopenResults = (expirationTimeInMinutes = 5) => {
	/*
	pastResults = {
		'saveTime': ...,
		'results': [...],
		'query': '...'
	}
	*/
	chrome.storage.sync.get('librarian-saved-results').then((pastResults) => {
		pastResults = pastResults['librarian-saved-results'];
		if (pastResults) {
			if (Date.now() < pastResults.saveTime + (expirationTimeInMinutes * 60 * 1000)) {
				inputElement.value = pastResults.query;
				buildResultsDiv(pastResults.results);
			}
		}
	});
};

async function checkIndexingStatus() {
	const storageVar = await chrome.storage.sync.get([
		'librarian-ops-indexingInProgress',
		'librarian-ops-bookmarksLength',
		'librarian-ops-bookmarksCounter'
	]);

	const indexingInProgress = storageVar['librarian-ops-indexingInProgress'];
	const bookmarksLength = storageVar['librarian-ops-bookmarksLength'];
	const bookmarksIndexProgress = storageVar['librarian-ops-bookmarksCounter'];

	if (indexingInProgress) {
		indexLoader.style.display = 'flex';
		progressBar.value = bookmarksIndexProgress ? bookmarksIndexProgress : 0;
		progressBar.max = bookmarksLength ? bookmarksLength : 100;
	} else {
		indexLoader.style.display = 'none';
	}
};

window.onload = function() {
	reopenResults();
	checkIndexingStatus();
	setInterval(checkIndexingStatus, 2000);
}

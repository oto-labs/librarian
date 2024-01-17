const inputElement = document.getElementById('text');
const searchButton = document.getElementById('search-button');
const outputElement = document.getElementById('output');
const loader = document.getElementById('loader');
const indexLoader = document.getElementById('index-loader');

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
	const storageVar = await chrome.storage.sync.get(['indexingStarted']);
	
	if (storageVar['indexingStarted']) {
		indexLoader.style.display = 'flex';
	} else {
		indexLoader.style.display = 'none';
	}
}

window.onload=function(){
	setInterval(checkIndexingStatus, 1000);
}

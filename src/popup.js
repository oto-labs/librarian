const inputElement = document.getElementById('text');
const searchButton = document.getElementById('search-button');
const outputElement = document.getElementById('output');
const loader = document.getElementById('loader');

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
		response.result.forEach((element) => {
			outputElement.appendChild(makeBookmarkItem(element.document));
		});
	});
});
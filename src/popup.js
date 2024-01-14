import { indexBookmarks } from "./bookutils.js";

const inputElement = document.getElementById('text');
const searchButton = document.getElementById('search-button');
const outputElement = document.getElementById('output');
const loader = document.getElementById('loader');

searchButton.addEventListener('click', () => {
	const query = inputElement.value;
	if (!query)
		return;

	loader.style.display = 'block';

	const message = {
		action: 'search',
		query: query,
	}

	chrome.runtime.sendMessage(message, (response) => {
		loader.style.display = 'none';
		outputElement.innerText = JSON.stringify(response, null, 2);
	});
});
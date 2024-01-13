import { indexBookmarks } from "./bookutils.js";

const inputElement = document.getElementById('text');
const searchButton = document.getElementById('search-button');
const outputElement = document.getElementById('output');

indexBookmarks();

searchButton.addEventListener('click', () => {
	const message = {
		action: 'search',
		query: inputElement.value,
	}

	chrome.runtime.sendMessage(message, (response) => {
        console.log(event.target.value, "response", response);
		outputElement.innerText = JSON.stringify(response, null, 2);
	});
});
import { indexBookmarks } from "./bookutils.js";

const inputElement = document.getElementById('text');
const searchButton = document.getElementById('search-button');
const outputElement = document.getElementById('output');
const loader = document.getElementById('loader');
const indexLoader = document.getElementById('index-loader');

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

// function checkIndexingStatus() {
// 	const indexingStatus = localStorage.getItem('indexingStatus');
// 	if (indexingStatus === 'completed') {
// 		indexLoader.style.display = 'none';
// 	} else if (indexingStatus === 'started') {
// 		indexLoader.style.display = 'block';
// 	}
// }

// setInterval(checkIndexingStatus, 1000);

chrome.storage.onChanged.addListener((changes, namespace) => {
	for (let [key, { oldValue, newValue }] of Object.entries(changes)) {
	  console.log(
		`Storage key "${key}" in namespace "${namespace}" changed.`,
		`Old value was "${oldValue}", new value is "${newValue}".`
	  );
	}
  });


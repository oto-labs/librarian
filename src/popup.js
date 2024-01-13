import { indexBookmarks } from "./bookutils.js";

const inputElement = document.getElementById('text');
const outputElement = document.getElementById('output');

indexBookmarks();

inputElement.addEventListener('input', (event) => {
	const message = {
		action: 'classify',
		text: event.target.value,
	}

	chrome.runtime.sendMessage(message, (response) => {
        console.log(event.target.value, "response", response);
		outputElement.innerText = JSON.stringify(response, null, 2);
	});
});
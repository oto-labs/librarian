// Search the bookmarks when entering the search keyword.
$('#search').change(function () {
    console.log($('#search').val());
    queryGPT($('#search').val());
});


// Traverse the bookmark tree, and print the folder and nodes.
async function queryGPT(query) {
    console.log(query, 'qqq');
    let queryOptions = { active: true, lastFocusedWindow: true };
    let [tab] = await chrome.tabs.query(queryOptions);

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [
                {
                role: 'system',
                content: 'You are an assistant, skilled in reading the contents of the webpage and understanding the context.'
                },
                {
                role: 'user',
                content: `URL: ${tab}`
                },
                {
                    role: 'user',
                    content: 'Summarize the contents of the webpage.'
                }
            ]
            })
        });

        const data = await response.json();
        console.log(data);
        $('#response').append(data.choices[0].text);
        } catch (error) {
        console.error('Error:', error);
    }

    
}

// document.addEventListener('DOMContentLoaded', function () {
//     queryGPT();
// });
# Librarian

### Better Bookmark Search

<img src="media/example.png" alt="Librarian" width="392"/>

Chrome extension to search your bookmarks' content right in your browser. Private and Fast. 

➤ Scrape content and embed using [Sentence-BERT](https://arxiv.org/abs/1908.10084) (through [transformer.js](https://github.com/xenova/transformers.js))\
➤ Store in localStorage\
➤ Semantic vector search (with [orama](https://oramasearch.com/)).

Stay tuned for enhancements and fixes:
- [ ] Settings (similarity threshold, num results, etc.)
- [ ] Accurate progress bar
- [ ] Smarter salient text subselection
- [ ] Faster scraping
- [ ] Better UI/UX

------

### Setup

Please run `npm install` and `npm run build`. This will generate the `build` directory, which you can load into Chrome by 
following the [extensions dev instructions](https://developer.chrome.com/docs/extensions/get-started/tutorial/hello-world#load-unpacked).
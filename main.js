
import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.14.0';
import { LocalIndex } from 'https://cdn.jsdelivr.net/npm/vectra@0.5.5/';
// const { LocalIndex } = require('vectra');
// const { pipeline, env } = require('https://cdn.jsdelivr.net/npm/@xenova/transformers@2.14.0');

env.localModelPath = 'models';
env.allowRemoteModels = true;

// Search the bookmarks when entering the search keyword.
$('#search').change(function () {
    // console.log("here")
    $('#bookmarks').empty();
    const searchText = $('#search').val();
    console.log(searchText.length > 0, searchText, searchText.length);
    if (searchText.length > 0)
      $('#query-response').removeAttr('hidden');
    else 
      $('#query-response').attr("hidden", '')
    dumpBookmarks(searchText);
  });
  
  // Traverse the bookmark tree, and print the folder and nodes.
  function dumpBookmarks(query) {
    const bookmarkTreeNodes = chrome.bookmarks.getTree(function (
      bookmarkTreeNodes
    ) {
      $('#bookmarks').append(dumpTreeNodes(bookmarkTreeNodes, query));
    });
  }
  
  function dumpTreeNodes(bookmarkNodes, query) {
    const list = $('<ul>');
    // console.log(bookmarkNodes.length, "bookmarkNodes", bookmarkNodes);
    for (let i = 0; i < bookmarkNodes.length; i++) {
      list.append(dumpNode(bookmarkNodes[i], query));
    }
    // console.log("list", list);
    if (list.length > 0)
      return list;
  }

  const index = new LocalIndex(path.join(__dirname, '..', 'index'));
  const button = document.getElementById('hitme');
  
  async function getVector(text) {
    // const response = await api.createEmbedding({
    //     'model': 'text-embedding-ada-002',
    //     'input': text,
    // });
    // return response.data.data[0].embedding;

    const extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    const output = await extractor(text, {
      pooling: 'mean', 
      normalize: true
    });
    return output.data;
  }

  async function addItem(text) {
    await index.insertItem({
        vector: await getVector(text),
        metadata: { text }
    });
  }
  
  async function query(text) {
    const vector = await getVector(text);
    const results = await index.queryItems(vector, 3);
    if (results.length > 0) {
        for (const result of results) {
            console.log(`[${result.score}] ${result.item.metadata.text}`);
        }
    } else {
        console.log(`No results found.`);
    }
}

  async function initIndex() {
    if (!await index.isIndexCreated()) {
      await index.createIndex();
    }
  }

  function dumpNode(bookmarkNode, query) {
    let span = '';
    if (bookmarkNode.title) {
      if (query && !bookmarkNode.children) {
        if (
          String(bookmarkNode.title.toLowerCase()).indexOf(query.toLowerCase()) ==
          -1
        ) {
          return $('<span></span>');
        }
      }
  
      const anchor = $('<a>');
      anchor.attr('href', bookmarkNode.url);
      anchor.text(bookmarkNode.title);
  
      /*
       * When clicking on a bookmark in the extension, a new tab is fired with
       * the bookmark url.
       */
      anchor.click(function () {
        chrome.tabs.create({ url: bookmarkNode.url });
      });
  
      span = $('<span>');
    //   const options = bookmarkNode.children
    //     ? $('<span>[<a href="#" id="addlink">Add</a>]</span>')
    //     : $(
    //         '<span>[<a id="editlink" href="#">Edit</a> <a id="deletelink" ' +
    //           'href="#">Delete</a>]</span>'
    //       );
    //   const edit = bookmarkNode.children
    //     ? $(
    //         '<table><tr><td>Name</td><td>' +
    //           '<input id="title"></td></tr><tr><td>URL</td><td><input id="url">' +
    //           '</td></tr></table>'
    //       )
    //     : $('<input>');
  
      // Show add and edit links when hover over.
      span
        .hover(
          function () {
          },
  
        )
        .append(anchor);
    }
  
    const li = $(bookmarkNode.title ? '<li>' : '<div>').append(span);
  
    if (bookmarkNode.children && bookmarkNode.children.length > 0) {
      li.append(dumpTreeNodes(bookmarkNode.children, query));
    }
  
    return li;
  }

function traverseBookmarks() {
  chrome.bookmarks.getTree(function (bookmarkTreeNodes) {
    indexTreeNodes(bookmarkTreeNodes, '');
  });
}

function indexTreeNodes(bookmarkNodes, query) {
  for (var i = 0; i < bookmarkNodes.length; i++) {
    var node = bookmarkNodes[i];
    dumpNode(node, query);
    if (node.children) {
      dumpTreeNodes(node.children, query);
    }
  }
}

function indexNode(bookmarkNode, query) {
  if (bookmarkNode.url) {
    var title = bookmarkNode.title;
    getVector(title).then(function (vector) {
      addIndex(vector);
    });
  }
}
  
  document.addEventListener('DOMContentLoaded', function () {
    initIndex();
    traverseBookmarks();
    dumpBookmarks();
  });
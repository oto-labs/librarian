
// import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.14.0';
// import { LocalIndex } from 'https://cdn.jsdelivr.net/npm/vectra@0.5.5/';
// const { LocalIndex } = require('vectra');
// const { pipeline, env } = require('https://cdn.jsdelivr.net/npm/@xenova/transformers@2.14.0');

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


  import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.14.0';
// import { LocalIndex } from 'https://cdn.jsdelivr.net/npm/vectra@0.5.5/';

import { create, insert, remove, search, searchVector } from 'https://unpkg.com/@orama/orama@latest/dist/index.js'
import { restore, persist } from 'https://unpkg.com/@orama/plugin-data-persistence@latest/dist/index.js'

env.localModelPath = 'models';
env.allowRemoteModels = true;


// const index = new LocalIndex(path.join(__dirname, '..', 'index'));
// const button = document.getElementById('hitme');

const dbInstance = await create({
    schema: {
      title: 'string',
      content: 'string',
      embedding: 'vector[1536]', // Vector size must be expressed during schema initialization
    },
})

async function getVector(text) {

    const extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    const output = await extractor(text, {
        pooling: 'mean', 
        normalize: true
    });
    return output.data;
}

async function addItem(data) {
    await insert(db, {
        name: data.title,
        description: data.content,
        embedding: getVector(data.content)
      })
}

export async function query(text) {
    await search(db, {
        term: text,
        // properties: ['description'],
      })
}



export async function initIndex() {
    console.log("in init index")
    try {
        restoreDb();
    } catch (error) {
        console.error('restoreDB', error);
    }

    chrome.bookmarks.getTree(function (bookmarkTreeNodes) {
        traverseBookmarks(bookmarkTreeNodes);
    });

    saveDb();
}

async function saveDb() {
    console.log("in saveDb");
    const JSONIndex = await persist(dbInstance, 'json');
}

async function restoreDb() {
    console.log("in restoreDb");
    const db = await restore('json', dbInstance);
}

function traverseBookmarks(bookmarkNodes) {
    bookmarkNodes.forEach(function (node) {
        if (node.children) {
            traverseBookmarks(node.children);
        } else if (node.url) {
            const title = node.title;
            fetch(node.url)
                .then((response) => response.text())
                .then((content) => {
                    addItem({ title, content });
                })
                .catch((error) => {
                    console.error('Error fetching bookmark content:', error);
                });
        }
    });
}



  
  document.addEventListener('DOMContentLoaded', function () {
    // initIndex();
    // traverseBookmarks();
    initIndex();
    dumpBookmarks();
  });
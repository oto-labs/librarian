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


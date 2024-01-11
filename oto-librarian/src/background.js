import { pipeline, env } from '@xenova/transformers';
import { LocalIndex } from 'vectra';

env.localModelPath = 'models';
env.allowRemoteModels = true;

const index = new LocalIndex(path.join(__dirname, '..', 'index'));
// const button = document.getElementById('hitme');

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
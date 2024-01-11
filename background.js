import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.14.0';
import { LocalIndex } from 'https://cdn.jsdelivr.net/npm/vectra@0.5.5/';

env.localModelPath = 'models';
env.allowRemoteModels = true;


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
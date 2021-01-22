const epub = require("./lib/epub-gen");
const { execSync } = require("child_process");
const { writeFile, readFileSync } = require('fs');
const { Readability } = require('@mozilla/readability');
const { JSDOM } = require('jsdom');
const { get } = require('https');
const { v4: newUuid } = require("uuid");

const config = JSON.parse(readFileSync(__dirname + "/config.json"));
const ROOT_COLLECTION_ID = config.root_collection_id;

const dateStr = execSync("date +'%Y - %m - %d'").toString().trim();
const folder = "/home/root/.local/share/remarkable/xochitl/";

console.log("Creating folder...");
const folderMeta = metadata(dateStr, ROOT_COLLECTION_ID, true); 
const todayFolderId = newUuid();
writeFile(folder + todayFolderId + ".metadata", folderMeta, () => {});

// Main
(async () => {
    console.log("Downloading news list...");
    const hnRaw = await htmlRaw("https://news.ycombinator.com/news");
    const hnParsed = new JSDOM(hnRaw);
    const stories = hnParsed.window.document.getElementsByClassName("storylink");

    let numArticle = stories.length;
    let numDone = 0;

    console.log("Downloading articles and packing epubs...");
    const arts = [...stories]
        .map(url => url.getAttribute("href"))
        .filter(url => url.startsWith("http") && !url.endsWith(".pdf"))
        .map(url => article(url, todayFolderId)
            .then(() => {
                numDone++;
                console.log("PROG:" + Math.round(numDone / numArticle * 100));
            })
            .catch(err => console.error(err))
        );

    await Promise.all(arts);
    console.log("PROG:100");
})();

function metadata(name, parent, isCollection) {
    return `{
    "deleted": false,
    "lastModified": "1",
    "lastOpenedPage": 0,
    "metadatamodified": false,
    "modified": false,
    "parent": "${parent ? parent : ""}",
    "pinned": false,
    "synced": false,
    "type": "${isCollection ? "CollectionType" : "DocumentType"}",
    "version": 1,
    "visibleName": "${name}"
}`;
}

function htmlRaw(url) {
    if (url.startsWith("http:")) {
        url = url.replace("http", "https");
    }
    return new Promise((resolve, reject) => {
        let str = ""
        try {
            get(url, {}, res => {
                res.on('data', (d) => {
                    str += d;
                });
                res.on('error', (err) => reject(err));
                res.on('end', () => resolve(str));
            })
            .on('error', (err) => reject(err));
        } catch(err) {
            reject(err);
        }
    });
}

async function article(url) {
    const doc = new JSDOM(await htmlRaw(url), { url });
    const reader = new Readability(doc.window.document);
    const item = reader.parse();
    
    if (!item || !item.title || !item.content) {
        return;
    }

    const uuid = newUuid();
    const file = folder + uuid + ".epub";
    const meta = metadata(item.title, todayFolderId);
    writeFile(folder + uuid + ".metadata", meta, () => {});

    return await new epub({
        title: item.title,
        author: item.byline,
        output: file,
        version: 2,
        appendChapterTitles: true,
        content: [{
            title: item.title,
            data: item.content,
            author: item.byline,
            url: item.siteName,
        }],
        verbose: false,
    }).promise;
}

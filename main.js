const { firefox } = require('playwright');
const epub = require('epub-gen');
const { exec } = require("child_process");

const ARTICLE_TIMEOUT = 10000;
const TITLE = "HackerNews " + (new Date()).toDateString();

(async () => {
    const browser = await firefox.launch({
        // executablePath: 'C:\\Program Files\\Mozilla Firefox\\firefox.exe'
    });
    const page = await browser.newPage();

    async function fetchArticle(url) {
        const page = await browser.newPage();

        await page.goto('about:reader?url=' + url);

        const startCallback = Date.now();

        let title = await page.innerText(".reader-title");

        while (title.length == 0) {
            title = await page.innerText(".reader-title");
            if (Date.now() - startCallback > ARTICLE_TIMEOUT) {
                return undefined;
            }
        }
        const author = [await page.innerText(".reader-credits")];
        const data = await page.innerHTML(".moz-reader-content");

        console.log(title);

        return ({
            title,
            data,
            author,
            url,
        });
    }

    await page.goto("https://news.ycombinator.com/news");

    const linkList = await page.$$eval(".storylink", nodes => nodes.map(a => a.href));
    
    //// Fetch articles sequently 
    // const content = [];
    // for (const link of linkList) {
    //     const article = await fetchArticle(link);
    //     if (!article) continue;
    //     content.push(article);
    //     break;
    // }

    /**
     * Fetch all articles parallelly. If you receive too few articles, try:
     *      - Increase ARTICLE_TIMEOUT
     *      - or Use Fetch articles sequently above instead of this block below
     */
    let content = await Promise.all(linkList.map(fetchArticle));
    content = content.filter(article => article);

    // Output file name
    const file = TITLE + ".epub";

    const options = {
        title: TITLE,
        author: "HackerNews",
        output: file,
        version: 2,
        tocTitle: TITLE,
        content,
    };

    browser.close();

    new epub(options).promise.then(() => {
        console.log('EPUB Done');

        // Send to Remarkable cloud
        exec("rmapi put \"" + file + "\"", (err, stdout, stderr) => {
            if (err || stderr) {
                console.error(err || stderr);
                return;
            }

            if (stdout) {
                console.log(stdout);
            }
        })
    });
})();
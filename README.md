# hackernews2remarkable
Fetch top articles from HackerNews, pack as EPUB right in your reMarkable device

<p align="center">
  <img src="https://i.imgur.com/lK0AlqI.png" width="350" title="Folder of articles">
  <img src="https://i.imgur.com/UBt2rPI.png" width="350" title="Article title and content">
  <img src="https://i.imgur.com/caONUHZ.png" width="350" title="Take notes on article">
</p>

## Requirements
This project is meant to run on reMarkable device, not your local machine. So there are few requirements you need to set up:
- [NodeJS](https://nodejs.org/) and `npm`
You can easily install both with [toltec](https://github.com/toltec-dev/toltec/), a package manager for reMarakble devices:
```bash
opkg update
opkg install node-npm
```

## How to use
1. Clone repo:
```bash
git clone https://github.com/khanhas/hackernews2remarkable
```

If you don't have `git`, just download repo zip file and unzip:
```bash
wget "https://github.com/khanhas/hackernews2remarkable/archive/main.zip" -O "hackernews2remarkable.zip"
unzip "hackernews2remarkable.zip"
```

2. Download dependencies:
```bash
cd hackernews2remarkable
npm install
```

3. On your reMarkable device, create a Folder that will be used to store articles. You can name whatever you want, for example, I name it "HackerNews".  
Run following commands to find out what this new folder guid is:
```bash
grep -il '"visibleName": ".*HackerNews.*"' /home/root/.local/share/remarkable/xochitl/*.metadata
```
Your folder id should look somewhat similar to this: `764bceb9-abf1-4229-a025-f0dc59ac5c0c`. Copy that id and set it in `config.json`.

3. Run:
```bash
node main.js
```

4. Restart reMarkable reading app:
```bash
systemctl restart xochitl
```

## Credits
This project uses a modified version of [`epub-gen`](https://www.npmjs.com/package/epub-gen) NPM package by [cyrilis](https://github.com/cyrilis).

# GitHub Actions Search

A browser extension that adds a search bar to the GitHub Actions sidebar, letting you filter workflows by name across all pages.

GitHub only shows ~10 workflows at a time with a "Show more" button. This extension silently fetches all workflow pages in the background so you can search the entire list instantly.

## Features

- Search/filter all workflows in the sidebar, not just the visible ones
- Press `/` to focus the search bar, `Escape` to clear
- Works with GitHub's light and dark themes
- No scrolling or loading flicker -- extra pages are fetched silently in the background
- Works on any GitHub repository's Actions page

## Install

### Chrome

1. Clone or download this repo
2. Go to `chrome://extensions`
3. Enable **Developer mode** (top-right toggle)
4. Click **Load unpacked** and select this folder

### Firefox (temporary)

1. Go to `about:debugging#/runtime/this-firefox`
2. Click **Load Temporary Add-on...**
3. Select the `manifest.json` file from this folder

### Firefox (permanent)

1. Download the signed `.xpi` from [Releases](../../releases)
2. Drag it into Firefox or open it with Firefox

## License

MIT

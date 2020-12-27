async function bookmarkTab() {
	let tab = await u.currentTab()
	if (specialPage(tab.url)) {
		return
	}
	await u.addBookmark(tab.title, tab.url)

	chrome.browserAction.setBadgeText({text: "★"})
	setTimeout(() => chrome.browserAction.setBadgeText({text: ""}), 1000)
}

function specialPage(url) {
	return !url.startsWith("https://") && !url.startsWith("http://") && !url.startsWith("file://")
}

async function init() {
	await u.initBookmarkId()
	chrome.browserAction.onClicked.addListener(bookmarkTab)
}

init()

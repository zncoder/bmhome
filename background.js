async function bookmarkTab() {
	let folderId = await u.folderId()
	let tab = await u.currentTab()
	if (specialPage(tab.url)) {
		return
	}
	let bn = await u.newBookmark({parentId: folderId, index: 0, title: tab.title, url: tab.url})
	await u.dedupBookmark(folderId, bn.id, tab.url)
}

function specialPage(url) {
	return !url.startsWith("https://") && !url.startsWith("http://") && !url.startsWith("file://")
}

async function initBookmarkId() {
	let folderId = await u.folderId()
	if (folderId === "") {
		let bn = await u.newBookmark({title: u.bmTitle})
		folderId = bn.id
	}
	
	let historyId = await u.historyId()
	if (historyId === "") {
		await u.newBookmark({title: u.bmHistoryTitle, parentId: folderId})
	}
}

async function init() {
	await initBookmarkId()
	chrome.browserAction.onClicked.addListener(bookmarkTab)
}

init()

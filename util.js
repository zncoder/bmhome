var u = {
  listTabs: () => new Promise(r => chrome.tabs.query({}, x => r(x))),
  getTab: (id) => new Promise(r => chrome.tabs.get(id, x => r(x))),
  currentTab: async () => {
    let tabs = await new Promise(r => chrome.tabs.query({currentWindow: true, active: true}, x => r(x)))
    return tabs[0]
  },
  currentWindow: () => new Promise(r => chrome.windows.getCurrent({populate: true}, x => r(x))),
  newBookmark: (arg) => new Promise(r => chrome.bookmarks.create(arg, x => r(x))),
  removeBookmark: (id) => new Promise(r => chrome.bookmarks.remove(id, x => r(x))),
  listBookmarks: (folder) => new Promise(r => chrome.bookmarks.getChildren(folder, x => r(x))),
  findBookmarkId: async (title) => {
	  let items = await new Promise(r => chrome.bookmarks.search({title: title}, x => r(x)))
    switch (items.length) {
    case 0:
      return ""
    case 1:
      return items[0].id
    default:
      throw `title:${title} matches ${items.length} entries`
    }
  },
  dedupBookmark: async (folder, keep, url) => {
    let items = await u.listBookmarks(folder)
	  for (let x of items) {
		  if (x.id !== keep && x.url === url) {
			  u.removeBookmark(x.id)
		  }
	  }
  },
  //
  bmTitle: "bmtab-bn4yaq",
  bmHistoryTitle: "history-bn4yaq",
  folderId: () => u.findBookmarkId(u.bmTitle),
  historyId: () => u.findBookmarkId(u.bmHistoryTitle),
	favIcon: "icons/favicon.png",
}

var u = {
  listTabs: () => new Promise(r => chrome.tabs.query({}, x => r(x))),
  getTab: (id) => new Promise(r => chrome.tabs.get(id, x => r(x))),
  currentTab: async () => {
    let tabs = await new Promise(r => chrome.tabs.query({currentWindow: true, active: true}, x => r(x)))
    return tabs[0]
  },
  currentWindow: () => new Promise(r => chrome.windows.getCurrent({populate: true}, x => r(x))),
  newBookmark: (arg) => new Promise(r => chrome.bookmarks.create(arg, x => r(x))),
  deleteBookmark: (id) => new Promise(r => chrome.bookmarks.remove(id, x => r(x))),
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
		//console.log(`dedup ${folder}:${url}`)
    let items = await u.listBookmarks(folder)
	  for (let x of items) {
		  if (x.id !== keep && x.url === url) {
			  u.deleteBookmark(x.id)
		  }
	  }
  },
	addBookmark: async (title, url) => {
		//console.log(`addbookmark: ${title},${url}`)
		let folder = await u.folderId()
		let bn = await u.newBookmark({parentId: folder, index: 0, title: title, url: url})
		await u.dedupBookmark(folder, bn.id, url)
		return bn
	},
	removeBookmark: async (id, title, url) => {
		//console.log(`removebookmark: ${id},${title}`)
		let history = await u.historyId()
		let bn = await u.newBookmark({parentId: history, index: 0, title: title, url: url})
		await u.dedupBookmark(history, bn.id, url)
		await u.deleteBookmark(id)
	},
	initBookmarkId: async () => {
		u.folderId_ = await u.findBookmarkId(u.bmTitle)
		if (u.folderId_ === "") {
			let bn = await u.newBookmark({title: u.bmTitle})
			u.folderId_ = bn.id
		}
	
		u.historyId_ = await u.findBookmarkId(u.bmHistoryTitle)
		if (u.historyId_ === "") {
			bn = await u.newBookmark({title: u.bmHistoryTitle, parentId: folder})
			u.historyId_ = bn.id
		}
	},
  //
  bmTitle: "bmtab-bn4yaq",
  bmHistoryTitle: "history-bn4yaq",
  folderId: async () => {
		if (u.folderId_ === "") {
			u.folderId_ = await u.findBookmarkId(u.bmTitle)
		}
		return u.folderId_
	},
	folderId_: "",
  historyId: async () => {
		if (u.historyId_ === "") {
			u.historyId_ = await u.findBookmarkId(u.bmHistoryTitle)
		}
		return u.historyId_
	},
	historyId_: "",
	favIcon: "icons/favicon.png",
}

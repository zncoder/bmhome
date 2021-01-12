var vm = new Vue({
	el: "#app",
	data: {
		columns: [],
		searchWords: "",
		showSearchBox: false,
	},
	created: onCreated,
	methods: {
		matchEntries: matchEntries,
		selectFirstEntry: selectFirstEntry,
		selectEntry: ei => selectEntry(ei),
		removeEntry: ei => removeEntry(ei),
		showSearch: showSearch,
		setAltImg: ev => {ev.target.src = u.favIcon},
	},
})

async function onCreated() {
	let tabs = await listTabs()
	let bms = await listBookmarks()
	vm.columns = [
		{
			cls: "tab",
			title: "Tabs",
			entries: tabs,
		},
		{
			cls: "bookmark",
			title: "Bookmarks",
			entries: bms,
		}
	]
	//console.log(`columns:`); console.log(vm.columns)

	// keyword
	chrome.omnibox.setDefaultSuggestion({
		description: "Search opened tabs and bookmarks"
	})
	chrome.omnibox.onInputChanged.addListener(omniboxMatchEntries)
	chrome.omnibox.onInputEntered.addListener(omniboxSelectEntry)
}

function showSearch() {
	vm.showSearchBox = true
	setTimeout(() => vm.$refs.searchbox.focus(), 10)
}

function newEntry(id, title, favIcon, url) {
	return {
		id: id,
		title: title,
		favIcon: favIcon || u.favIcon,
		url: url,
		unmatched: false,
		removed: false,
	}
}

async function listTabs() {
	let tabs = await u.listTabs()
	let cur = await u.currentTab()
	let entries = []
	tabs.sort((a, b) => {
		if (a.windowId === b.windowId) {
			return a.index - b.index
		} else {
			return a.windowId - b.windowId
		}
	})
	for (let t of tabs) {
		if (t.id === cur.id) {
			continue
		}
		entries.push(newEntry(`t-${t.id}`, t.title, t.favIconUrl, t.url))
	}
	return entries
}

async function listBookmarks() {
	let folder = await u.folderId()
	let bms = await u.listBookmarks(folder)
	let entries = []
	for (let b of bms) {
		if (!b.url) {
			continue
		}
		entries.push(newEntry(`b-${b.id}`, b.title, guessFavIcon(b.url), b.url))
	}
	return entries
}

function guessFavIcon(url) {
	let u = new URL(url)
	return `${u.protocol}//${u.host}/favicon.ico`
}

async function matchEntries() {
	//console.log(`matchentries ${vm.searchWords}`)
	let kws = vm.searchWords.toUpperCase().split(/ +/).filter(w => w.length > 0)
	//console.log(vm.columns)
	let matched = []
	for (let col of vm.columns) {
		for (let ei of col.entries) {
			if (ei.removed) {
				ei.unmatched = true
				continue
			}
			ei.unmatched = false
			let title = ei.title.toUpperCase()
			for (let kw of kws) {
				if (title.indexOf(kw) < 0) {
					ei.unmatched = true
					break
				}
			}
			if (!ei.unmatched) {
				matched.push(ei)
			}
		}
	}
	return matched
}

async function selectFirstEntry() {
	//console.log("selectfirstentry")
	for (let col of vm.columns) {
		for (let ei of col.entries) {
			if (!ei.unmatched) {
				selectEntry(ei)
				return
			}
		}
	}
}

async function selectEntry(ei) {
	//console.log("selectentry"); console.log(ei)
	if (ei.id.startsWith("t-")) {
		await gotoTab(parseInt(ei.id.substring(2)))
	} else {
		if (!inTopN(ei, 10)) {
			// move bookmark entry to top
			await u.addBookmark(ei.title, ei.url)
		}
		window.location = ei.url
	}
}

function inTopN(ei, n) {
	let entries = vm.columns[1].entries
	for (let i = 0; i < n; i++) {
		if (entries[i].id === ei.id) {
			return true
		}
	}
	return false
}

async function gotoTab(tid) {
	let tab = await u.getTab(tid)
	let cw = await u.currentWindow()
	let cur = await u.currentTab()
	if (cw.id != tab.windowId) {
		chrome.windows.update(tab.windowId, {focused: true})
	}
	chrome.tabs.update(tab.id, {active: true})
	chrome.tabs.remove(cur.id)
}

async function removeEntry(ei) {
	ei.removed = true
	let id = ei.id.substring(2)
	if (ei.id.startsWith("b-")) {
		u.removeBookmark(id, ei.title, ei.url)
	} else {
		chrome.tabs.remove(parseInt(id))
	}	
}

async function omniboxMatchEntries(text, suggest) {
	vm.searchWords = text
	let matched = await matchEntries()
	let res = matched.map(ei => {
		return {
			content: ei.url,
			description: escapeText(ei.title),
		}
	})
	//console.log(`text:${text} => `); console.log(res)
	suggest(res)
}

function escapeText(s) {
	return s.replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;")
}

function omniboxSelectEntry(text, disposition) {
	if (text.indexOf("://") < 0) {
		selectFirstEntry()
		return
	}
	
	for (let col of vm.columns) {
		for (let ei of col.entries) {
			if (!ei.removed && !ei.unmatched && ei.url === text) {
				selectEntry(ei)
				return
			}
		}
	}
}

chrome.runtime.onInstalled.addListener(function () {
  console.log('Extension installed');
});

chrome.action.onClicked.addListener(async function (tab) {
  const currentUrl = tab.url;
  if (currentUrl.startsWith('https')) {
    const lastUrl = await getLastUrl(currentUrl);
    if (lastUrl) {
      chrome.tabs.create({ url: lastUrl });
      chrome.tabs.remove(tab.id)
    }
  }
});

async function getLastUrl(url) {
  const domain = new URL(url).hostname;

  // Query the sessions API for the most recently closed tab/window on this domain
  const sessions = await chrome.sessions.getRecentlyClosed({ maxResults: 25 });
  const lastSession = sessions.find(session => {
    const tabUrl = session.tab ? session.tab.url : undefined;
    const windowTabs = session.window ? session.window.tabs : undefined;
    return tabUrl && new URL(tabUrl).hostname === domain ||
      windowTabs && windowTabs.some(tab => new URL(tab.url).hostname === domain);
  });

  // If a relevant session was found, return its URL
  if (lastSession) {
    if (lastSession.tab && lastSession.tab.url) {
      return lastSession.tab.url;
    } else if (lastSession.window && lastSession.window.tabs) {
      const lastTab = lastSession.window.tabs.find(tab => new URL(tab.url).hostname === domain);
      if (lastTab && lastTab.url) {
        return lastTab.url;
      }
    }
  }

  // Otherwise, return undefined
  return undefined;
}


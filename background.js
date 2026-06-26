const tabCounts = {};

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'AD_BLOCKED' && sender.tab?.id) {
    const tabId = sender.tab.id;
    tabCounts[tabId] = (tabCounts[tabId] || 0) + 1;

    chrome.action.setBadgeText({ text: String(tabCounts[tabId]), tabId });
    chrome.action.setBadgeBackgroundColor({ color: '#e53935' });

    chrome.storage.local.get(['totalBlocked'], ({ totalBlocked = 0 }) => {
      chrome.storage.local.set({ totalBlocked: totalBlocked + 1 });
    });
  }

  if (msg.type === 'GET_PAGE_COUNT') {
    sendResponse({ count: tabCounts[msg.tabId] || 0 });
    return true;
  }
});

chrome.tabs.onRemoved.addListener((tabId) => {
  delete tabCounts[tabId];
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === 'loading') {
    tabCounts[tabId] = 0;
    chrome.action.setBadgeText({ text: '', tabId });
  }
});

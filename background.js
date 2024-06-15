chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'speak',
    title: 'Speak Text',
    contexts: ['selection']
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'speak') {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: (selectedText) => {
        return selectedText;
      },
      args: [info.selectionText],
    }, (results) => {
      const text = results[0].result;
      chrome.runtime.sendMessage({ action: 'speakText', text });
    });
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'extractText') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.scripting.executeScript(
        {
          target: { tabId: tabs[0].id },
          function: () => document.body.innerText
        },
        (results) => {
          sendResponse({ text: results[0].result });
        }
      );
    });
    return true; // Will respond asynchronously.
  }
});

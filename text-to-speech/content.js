chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'extractText') {
      sendResponse({ text: document.body.innerText });
    }
  });
  
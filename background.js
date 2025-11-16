// Grokify - Vanilla Background Service Worker
// Handles HEAD requests to bypass CORS restrictions

const DEBUG = true;

function log(...args) {
  if (DEBUG) {
    console.log('[Grokify Background]', ...args);
  }
}

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'checkGrokExists') {
    log('Received check request for:', request.url);
    
    // Make HEAD request from background script (bypasses CORS)
    fetch(request.url, {
      method: 'HEAD',
      cache: 'no-cache',
      redirect: 'follow' // Follow redirects automatically
    })
      .then(response => {
        log('Response status:', response.status, 'URL:', response.url);
        
        // 2xx means exists
        if (response.status >= 200 && response.status < 300) {
          sendResponse({ exists: true, status: response.status });
          return;
        }

        // 404 means not exists
        if (response.status === 404) {
          sendResponse({ exists: false, status: 404 });
          return;
        }

        // 3xx redirects should be followed automatically, but if we get here, treat as unknown
        if (response.status >= 300 && response.status < 400) {
          log('Unexpected redirect status:', response.status);
          sendResponse({ exists: null, status: response.status });
          return;
        }

        // Other status codes - treat as unknown
        sendResponse({ exists: null, status: response.status });
      })
      .catch(error => {
        log('Error checking existence:', error.message);
        sendResponse({ exists: null, error: error.message });
      });

    // Return true to indicate we will send a response asynchronously
    return true;
  }
});

log('Background service worker loaded');


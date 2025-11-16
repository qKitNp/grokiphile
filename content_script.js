// Grokify - Vanilla Content Script
// All logic runs locally, no server/proxy

const DEBUG = true; // Set to false in production
const GROK_DOMAIN = "https://grokipedia.com/page/";

// Logging helper
function log(...args) {
  if (DEBUG) {
    console.log('[Grokify]', ...args);
  }
}

// Extract article title from page
function extractTitle() {
  // Try to get from DOM first
  const heading = document.getElementById('firstHeading');
  if (heading && heading.textContent.trim()) {
    log('Title from DOM:', heading.textContent.trim());
    return heading.textContent.trim();
  }

  // Fallback to URL parsing
  const urlMatch = window.location.pathname.match(/\/wiki\/(.+)$/);
  if (urlMatch) {
    const title = decodeURIComponent(urlMatch[1].replace(/_/g, ' '));
    log('Title from URL:', title);
    return title;
  }

  log('Could not extract title');
  return null;
}

// Build Grokipedia URL from title
function buildGrokUrl(title) {
  if (!title) return null;
  // Replace spaces with underscores for URL
  const urlTitle = title.replace(/\s+/g, '_');
  const encodedTitle = encodeURIComponent(urlTitle);
  const fullUrl = `${GROK_DOMAIN}${encodedTitle}`;
  log('Built URL - Original title:', title, '| URL title:', urlTitle, '| Encoded:', encodedTitle, '| Full URL:', fullUrl);
  return fullUrl;
}

// Check if Grokipedia page exists via HEAD request
// Uses background service worker to bypass CORS restrictions
async function checkGrokExists(url) {
  try {
    log('Checking existence via background script:', url);
    
    // Send message to background script to make the request
    const response = await chrome.runtime.sendMessage({
      action: 'checkGrokExists',
      url: url
    });

    if (!response) {
      log('No response from background script');
      return { exists: null, error: 'No response from background script' };
    }

    log('Check result from background:', response);
    return response;
  } catch (error) {
    // Error communicating with background script
    log('Error checking existence:', error.message);
    return { exists: null, error: error.message };
  }
}

// Get user mode from storage
async function getUserMode() {
  try {
    const result = await chrome.storage.sync.get(['mode']);
    return result.mode || 'prompt';
  } catch (error) {
    log('Error getting user mode:', error);
    return 'prompt';
  }
}

// Detect if Wikipedia is in dark mode
function detectDarkMode() {
  // Check for common dark mode indicators
  const body = document.body;
  const html = document.documentElement;
  
  // Check for dark mode classes
  if (body.classList.contains('dark') || 
      html.classList.contains('dark') ||
      body.classList.contains('skin-vector-dark') ||
      html.classList.contains('skin-vector-dark')) {
    return true;
  }
  
  // Check computed background color
  const bgColor = window.getComputedStyle(body).backgroundColor;
  if (bgColor) {
    // Parse RGB values
    const rgbMatch = bgColor.match(/\d+/g);
    if (rgbMatch && rgbMatch.length >= 3) {
      const r = parseInt(rgbMatch[0]);
      const g = parseInt(rgbMatch[1]);
      const b = parseInt(rgbMatch[2]);
      // If background is dark (low brightness), it's dark mode
      const brightness = (r * 299 + g * 587 + b * 114) / 1000;
      return brightness < 128;
    }
  }
  
  // Check media query
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    // Also check if page background is actually dark
    const bgColor = window.getComputedStyle(body).backgroundColor;
    const rgbMatch = bgColor.match(/\d+/g);
    if (rgbMatch && rgbMatch.length >= 3) {
      const r = parseInt(rgbMatch[0]);
      const g = parseInt(rgbMatch[1]);
      const b = parseInt(rgbMatch[2]);
      const brightness = (r * 299 + g * 587 + b * 114) / 1000;
      return brightness < 200; // More lenient threshold
    }
  }
  
  // Default to light mode
  return false;
}

// Inject panel UI near heading
function injectPanel(grokUrl, state) {
  // Remove existing panel if any
  const existing = document.getElementById('grokify-panel');
  if (existing) {
    existing.remove();
  }

  // Don't show panel if page doesn't exist
  if (state === 'not-exists') {
    return;
  }

  const heading = document.getElementById('firstHeading') || document.querySelector('h1');
  if (!heading) {
    log('No heading found for panel injection');
    return;
  }

  // Detect if Wikipedia is in dark mode
  const isDarkMode = detectDarkMode();
  
  // Create icon button
  const panel = document.createElement('button');
  panel.id = 'grokify-panel';
  panel.setAttribute('role', 'button');
  panel.setAttribute('type', 'button');
  
  // Add class based on theme
  if (isDarkMode) {
    panel.classList.add('grokify-dark-mode');
  } else {
    panel.classList.add('grokify-light-mode');
  }
  
  // Set aria-label and title based on state
  let ariaLabel = 'Open Grokipedia';
  let titleText = 'Open Grokipedia';
  if (state === 'exists') {
    ariaLabel = 'Open Grokipedia (available)';
    titleText = 'Grokipedia (available)';
  } else if (state === 'unknown') {
    ariaLabel = 'Open Grokipedia (unknown)';
    titleText = 'Grokipedia (unknown)';
  }
  panel.setAttribute('aria-label', ariaLabel);
  panel.title = titleText;
  panel.tabIndex = 0;

  // Create icon
  const icon = document.createElement('img');
  icon.className = 'grokify-icon';
  icon.src = chrome.runtime.getURL('icons/grok_icon.png');
  icon.alt = '';
  icon.setAttribute('aria-hidden', 'true');

  panel.appendChild(icon);

  // Click handler - open Grokipedia in new tab
  panel.addEventListener('click', () => {
    window.open(grokUrl, '_blank');
  });

  // Keyboard handler
  panel.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      window.open(grokUrl, '_blank');
    } else if (e.key === 'Escape') {
      e.preventDefault();
      panel.remove();
    }
  });

  // Insert after heading
  heading.parentNode.insertBefore(panel, heading.nextSibling);

  log('Panel injected with state:', state);
}

// Extract title from URL (faster, doesn't require DOM)
function extractTitleFromUrl() {
  const urlMatch = window.location.pathname.match(/\/wiki\/(.+)$/);
  if (urlMatch) {
    const title = decodeURIComponent(urlMatch[1].replace(/_/g, ' '));
    log('Title from URL:', title);
    return title;
  }
  return null;
}

// Main execution
async function main() {
  log('Content script loaded');

  // Check mode first - for redirect mode, prefer URL extraction for speed
  const mode = await getUserMode();
  log('User mode:', mode);

  let title;
  if (mode === 'redirect') {
    // For redirect mode, try URL first (faster, reduces flicker)
    title = extractTitleFromUrl() || extractTitle();
  } else {
    // For prompt mode, prefer DOM (more accurate)
    title = extractTitle();
  }

  if (!title) {
    log('No title found, aborting');
    return;
  }

  const grokUrl = buildGrokUrl(title);
  if (!grokUrl) {
    log('Could not build Grokipedia URL');
    return;
  }

  log('Grokipedia URL:', grokUrl);

  const checkResult = await checkGrokExists(grokUrl);
  log('Check result:', checkResult);

  // Determine state
  let state;
  if (checkResult.exists === true) {
    state = 'exists';
  } else if (checkResult.exists === null) {
    state = 'unknown';
  } else {
    state = 'not-exists';
  }

  // Handle redirect mode
  if (mode === 'redirect' && state === 'exists') {
    log('Redirecting to Grokipedia');
    window.location.replace(grokUrl);
    return;
  }

  // Inject panel for prompt mode or unknown state
  if (mode === 'prompt' || state === 'unknown') {
    // Wait for DOM to be ready if needed
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        injectPanel(grokUrl, state);
      });
    } else {
      injectPanel(grokUrl, state);
    }
  }
}

// Run main function
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', main);
} else {
  main();
}


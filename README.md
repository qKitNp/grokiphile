# Grokiphile

A Chrome extension (Manifest V3) that provides quick access to Grokipedia from Wikipedia articles. Built with vanilla JavaScript - no frameworks, all logic runs locally in the content script.

## Features

- **Automatic URL Building**: Extracts the Wikipedia article title and builds the corresponding Grokipedia URL
- **Existence Check**: Performs a client-side HEAD request to check if the Grokipedia page exists
- **Two Modes**:
  - **Prompt Mode** (default): Shows a small, unobtrusive panel near the article heading
  - **Redirect Mode**: Automatically redirects to Grokipedia when the page exists
- **Graceful CORS Handling**: If the HEAD request is blocked by CORS, shows the panel in `(unknown)` state so users can manually check
- **Keyboard Accessible**: Panel is keyboard accessible with Esc to dismiss
- **Privacy-Focused**: Only reads article titles, no content or user data is collected or stored

## Installation

### Load Unpacked (Development)

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** (toggle in the top-right corner)
3. Click **Load unpacked**
4. Select the `grokmeup` folder (the folder containing `manifest.json`)
5. The extension should now appear in your extensions list

### Verify Installation

- The extension icon should appear in your Chrome toolbar
- Right-click the icon and select "Options" to access the settings page

## Usage

1. Visit any Wikipedia article (e.g., `https://en.wikipedia.org/wiki/Assassination_of_Archduke_Franz_Ferdinand`)
2. The extension will:
   - Extract the article title
   - Build the Grokipedia URL: `https://grokipedia.com/page/Assassination_of_Archduke_Franz_Ferdinand`
   - Check if the page exists via HEAD request
   - Show a panel or redirect based on your mode setting

### Panel States

- **(available)**: The Grokipedia page exists (HEAD returned 2xx)
- **(unknown)**: CORS blocked the check or network error occurred
- No panel: The page doesn't exist (HEAD returned 404)

### Options

Right-click the extension icon → **Options** to toggle between:
- **Prompt Mode**: Shows panel/icon, click to open in new tab
- **Redirect Mode**: Auto-redirects when page exists

## Testing

### Example Test Case

Visit: `https://en.wikipedia.org/wiki/Assassination_of_Archduke_Franz_Ferdinand`

**Expected Behavior:**
1. Extension builds URL: `https://grokipedia.com/page/Assassination_of_Archduke_Franz_Ferdinand`
2. If HEAD returns 200:
   - **Prompt mode**: Panel appears with "(available)" state
   - **Redirect mode**: Page redirects to Grokipedia
3. If HEAD is blocked by CORS:
   - Panel appears with "(unknown)" state
   - Clicking the icon opens Grokipedia in a new tab

### Testing Non-Existent Pages

Visit a Wikipedia article that doesn't have a corresponding Grokipedia page. The extension should:
- Not show a panel
- Not redirect

## Configuration

### Changing the Grokipedia Domain

If you need to change the Grokipedia domain, edit `content_script.js`:

```javascript
const GROK_DOMAIN = "https://grokipedia.com/page/";
```

Change this constant to your desired domain.


## Troubleshooting

### CORS Issues

**Problem**: Panel shows "(unknown)" state even when the page exists.

**Cause**: The HEAD request is being blocked by CORS (Cross-Origin Resource Sharing) policy. This is common when `grokipedia.com` doesn't allow cross-origin requests from Wikipedia domains.

**Solution**: 
- The extension handles this gracefully by showing the panel in "(unknown)" state
- Users can click the icon to manually open Grokipedia
- This is expected behavior and not a bug

### Panel Not Appearing

**Possible Causes:**
1. The page doesn't exist (404) - this is expected, no panel should appear
2. The article title couldn't be extracted - check browser console for errors
3. The content script hasn't loaded - check `chrome://extensions/` to ensure the extension is enabled

**Debug Steps:**
1. Open browser DevTools (F12)
2. Check the Console tab for `[Grokiphile]` log messages
3. Verify the extension is enabled and has permissions

### Redirect Mode Not Working

**Possible Causes:**
1. The page doesn't exist (404) - redirect only happens when page exists
2. CORS blocked the check - redirect only happens when existence is confirmed
3. Mode not saved - check Options page to verify mode is set to "redirect"

**Debug Steps:**
1. Check Options page to confirm mode is "redirect"
2. Check console logs to see the check result
3. Try a page you know exists on Grokipedia

### Extension Not Loading

**Possible Causes:**
1. Manifest V3 compatibility - ensure you're using Chrome 88+ or Edge 88+
2. Invalid manifest.json - check for syntax errors
3. Missing files - ensure all files are present

**Debug Steps:**
1. Check `chrome://extensions/` for error messages
2. Click "Errors" button if available
3. Verify all files are in the correct locations

## File Structure

```
grokmeup/
├── manifest.json          # Extension manifest (MV3)
├── content_script.js      # Main content script logic
├── content_style.css      # Panel styling
├── options.html           # Options page UI
├── options.js             # Options page logic
├── icons/                 # Extension icons
│   ├── grok-16.png
│   ├── grok-32.png
│   ├── grok-48.png
│   └── grok-128.png
├── generate_icons.py      # Icon generator script (optional)
├── generate_icons.html    # Alternative icon generator (optional)
└── README.md              # This file
```

## Privacy

This extension:
- ✅ Only reads Wikipedia article titles
- ✅ Performs local HEAD requests to check page existence
- ✅ Stores only the user's mode preference (prompt/redirect)
- ❌ Does NOT collect or store page content
- ❌ Does NOT collect or store user data
- ❌ Does NOT transmit data to any server

All checks are performed locally in your browser. The only external request is the HEAD request to Grokipedia to check if a page exists.

## Technical Details

- **Manifest Version**: 3
- **Content Script**: Runs on `*://*.wikipedia.org/wiki/*` and `*://*.wikipedia.org/*/wiki/*`
- **Permissions**: `storage`, `tabs`, `scripting`
- **Host Permissions**: `https://*.wikipedia.org/*`, `https://grokipedia.com/*`
- **Run At**: `document_idle` (can be changed to `document_start` for faster redirects)

### Title Extraction

The extension extracts the article title using:
1. Primary: DOM element `#firstHeading` (if available)
2. Fallback: URL parsing `/wiki/<title>` with URL decoding

### URL Building

Titles are converted to Grokipedia URLs by:
1. Replacing spaces with underscores
2. URL encoding the result
3. Appending to `https://grokipedia.com/page/`

### Existence Check

The extension uses `fetch()` with `method: 'HEAD'` and `mode: 'cors'`:
- **2xx status**: Page exists
- **404 status**: Page doesn't exist
- **3xx status**: Follows redirect and checks final URL
- **CORS/Network error**: Treated as unknown

## License

This extension is provided as-is for educational and personal use.

## Support

For issues or questions:
1. Check the Troubleshooting section above
2. Verify all files are present and manifest.json is valid
3. Ensure the extension is enabled and has proper permissions


// Grokify - Vanilla Options Script

const DEBUG = true;

function log(...args) {
  if (DEBUG) {
    console.log('[Grokify Options]', ...args);
  }
}

// Load saved mode
async function loadMode() {
  try {
    const result = await chrome.storage.sync.get(['mode']);
    const mode = result.mode || 'prompt';
    log('Loaded mode:', mode);

    // Set radio button
    const radio = document.getElementById(`mode-${mode}`);
    if (radio) {
      radio.checked = true;
    }
  } catch (error) {
    log('Error loading mode:', error);
  }
}

// Save mode
async function saveMode(mode) {
  try {
    await chrome.storage.sync.set({ mode });
    log('Saved mode:', mode);
    showStatus('Settings saved!');
  } catch (error) {
    log('Error saving mode:', error);
    showStatus('Error saving settings. Please try again.', true);
  }
}

// Show status message
function showStatus(message, isError = false) {
  const status = document.getElementById('status');
  status.textContent = message;
  status.className = 'status success';
  if (isError) {
    status.style.backgroundColor = '#f8d7da';
    status.style.borderColor = '#dc3545';
    status.style.color = '#721c24';
  }
  setTimeout(() => {
    status.className = 'status';
  }, 3000);
}

// Handle radio button changes
document.addEventListener('DOMContentLoaded', () => {
  log('Options page loaded');

  // Load current mode
  loadMode();

  // Listen for mode changes
  const radios = document.querySelectorAll('input[name="mode"]');
  radios.forEach(radio => {
    radio.addEventListener('change', (e) => {
      if (e.target.checked) {
        saveMode(e.target.value);
      }
    });
  });
});


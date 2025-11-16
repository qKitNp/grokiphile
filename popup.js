// Grokiphile - Popup Script

// Load saved mode
async function loadMode() {
  try {
    const result = await chrome.storage.sync.get(['mode']);
    const mode = result.mode || 'prompt';

    // Set radio button
    const radio = document.getElementById(`mode-${mode}`);
    if (radio) {
      radio.checked = true;
      updateSelectedOption(mode);
    }
  } catch (error) {
    // Silently handle error
  }
}

// Update visual selection
function updateSelectedOption(mode) {
  // Remove selected class from all options
  document.querySelectorAll('.mode-option').forEach(option => {
    option.classList.remove('selected');
  });
  
  // Add selected class to current option
  const optionElement = document.getElementById(`option-${mode}`);
  if (optionElement) {
    optionElement.classList.add('selected');
  }
}

// Save mode
async function saveMode(mode) {
  try {
    await chrome.storage.sync.set({ mode });
    updateSelectedOption(mode);
    showStatus('Saved!');
  } catch (error) {
    showStatus('Error saving', true);
  }
}

// Show status message
function showStatus(message, isError = false) {
  const status = document.getElementById('status');
  status.textContent = message;
  status.className = 'status success';
  if (isError) {
    status.style.backgroundColor = '#f8d7da';
    status.style.color = '#721c24';
  }
  setTimeout(() => {
    status.className = 'status';
  }, 2000);
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
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

  // Also listen for clicks on the label containers
  document.querySelectorAll('.mode-option').forEach(option => {
    option.addEventListener('click', (e) => {
      // If clicking on the label itself (not the radio), trigger the radio
      if (e.target !== option.querySelector('input[type="radio"]')) {
        const radio = option.querySelector('input[type="radio"]');
        if (radio) {
          radio.checked = true;
          radio.dispatchEvent(new Event('change'));
        }
      }
    });
  });
});


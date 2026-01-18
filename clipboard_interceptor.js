// This script runs in the "MAIN" world, giving it access to the page's global variables and APIs like navigator.

// Save original method
const originalWriteText = navigator.clipboard.writeText;

// Monkey-patch writeText to intercept programmatic copies (like "Copy" buttons)
navigator.clipboard.writeText = async function (text) {
    // Dispatch event for our isolated content script to catch
    // We use a custom event because we can't talk to chrome.runtime directly from here easily
    const event = new CustomEvent('SmartClipboard_Intercept', { detail: text });
    document.dispatchEvent(event);

    // Call original
    return originalWriteText.call(this, text);
};

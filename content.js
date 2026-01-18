// Listen for copy events on the page
document.addEventListener('copy', () => {
    // We use a slight delay to ensure the copy operation (default) has processed 
    // and we capture the current selection.
    setTimeout(() => {
        const selection = window.getSelection();
        const selectionText = selection.toString().trim();
        if (!selectionText) return;

        saveToHistory(selectionText);
    }, 10);
});

// Listen for intercepted events (from Copy buttons like in ChatGPT)
document.addEventListener('SmartClipboard_Intercept', (e) => {
    // Note: Detail is the captured text
    const text = e.detail;
    if (text) {
        saveToHistory(text);
    }
});

function saveToHistory(text) {
    const item = {
        text: text,
        url: window.location.href,
        title: document.title,
        timestamp: new Date().toISOString(),
        id: Date.now()
    };

    chrome.storage.local.get(['clipboardHistory'], (result) => {
        const history = result.clipboardHistory || [];

        // Avoid saving the exact same thing twice in a row
        if (history.length > 0 && history[0].text === item.text && history[0].url === item.url) {
            return;
        }

        // Add to top
        history.unshift(item);

        // Keep only last 100 items
        if (history.length > 100) {
            history.pop();
        }

        chrome.storage.local.set({ clipboardHistory: history }, () => {
            console.log('Clipboard Saver: Saved item from', item.url);
            showToast();

            // If manual selection exists, highlight it
            highlightCurrentSelection();

            // Also try to find and highlight the text (good for Programmatic copies)
            findAndHighlightString(text);
        });
    });
}

// Restore highlights on load
window.addEventListener('load', () => {
    restoreHighlights();
});

// --- Highlighting Logic ---

function highlightCurrentSelection() {
    const selection = window.getSelection();
    if (!selection.rangeCount || selection.isCollapsed) return;

    try {
        const range = selection.getRangeAt(0);
        applyHighlightToRange(range);
        // Clear selection so the user sees the yellow highlight clearly
        selection.removeAllRanges();
    } catch (e) {
        // console.error("Highlight error", e);
    }
}

function applyHighlightToRange(range) {
    // Create a highlight wrapper
    const span = document.createElement('span');
    span.style.backgroundColor = 'yellow';
    span.style.color = 'black';
    span.className = 'smart-clipboard-highlight';

    // Surround contents (works best if selection is clean)
    try {
        range.surroundContents(span);
    } catch (e) {
        // Fallback for complex selections that cross block boundaries
        // console.log('Complexity preventing simple highlight wrap.');
    }
}

function restoreHighlights() {
    chrome.storage.local.get(['clipboardHistory'], (result) => {
        const history = result.clipboardHistory || [];
        const currentUrl = window.location.href;

        // Filter items that belong to this page
        const pageItems = history.filter(item => item.url === currentUrl);

        pageItems.forEach(item => {
            findAndHighlightString(item.text);
        });
    });
}

function findAndHighlightString(text) {
    if (!text || text.length < 5) return; // Skip very short text to avoid noise

    // Simple robust approach: Search in text nodes
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);

    let node;
    while (node = walker.nextNode()) {
        const index = node.nodeValue.indexOf(text);
        if (index !== -1) {
            // Found it! Split and wrap.
            try {
                const range = document.createRange();
                range.setStart(node, index);
                range.setEnd(node, index + text.length);
                applyHighlightToRange(range);
            } catch (e) { }
            return; // Assume unique or just highlight first occurrence for now
        }
    }
}

// Optional: Visual Feedback
function showToast() {
    const toast = document.createElement('div');
    toast.textContent = "📋 Saved & Highlighted";
    toast.style.position = "fixed";
    toast.style.bottom = "20px";
    toast.style.right = "20px";
    toast.style.backgroundColor = "#ffd700"; // Yellow to match highlight
    toast.style.color = "#000";
    toast.style.padding = "10px 20px";
    toast.style.borderRadius = "5px";
    toast.style.zIndex = "2147483647";
    toast.style.boxShadow = "0 4px 6px rgba(0,0,0,0.1)";
    toast.style.fontFamily = "sans-serif";
    toast.style.fontSize = "14px";
    toast.style.fontWeight = "bold";
    toast.style.opacity = "0";
    toast.style.transition = "opacity 0.3s ease";

    document.body.appendChild(toast);

    // Animate in
    requestAnimationFrame(() => {
        toast.style.opacity = "1";
    });

    // Remove
    setTimeout(() => {
        toast.style.opacity = "0";
        setTimeout(() => toast.remove(), 300);
    }, 2000);
}

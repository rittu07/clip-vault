document.addEventListener('DOMContentLoaded', () => {
    const listContainer = document.getElementById('list-container');
    const clearBtn = document.getElementById('clear-btn');
    const exportBtn = document.getElementById('export-btn');

    loadHistory();

    exportBtn.addEventListener('click', () => {
        chrome.storage.local.get(['clipboardHistory'], (result) => {
            const history = result.clipboardHistory || [];
            if (history.length === 0) {
                alert('No history to export!');
                return;
            }
            exportToWord(history);
        });
    });

    clearBtn.addEventListener('click', () => {
        if (confirm('Clear all history?')) {
            chrome.storage.local.set({ clipboardHistory: [] }, () => {
                loadHistory();
            });
        }
    });

    function loadHistory() {
        chrome.storage.local.get(['clipboardHistory'], (result) => {
            const history = result.clipboardHistory || [];
            renderList(history);
        });
    }

    function exportToWord(history) {
        let contentHtml = `
            <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
            <head>
                <meta charset='utf-8'>
                <title>Clipboard History</title>
                <style>
                    body { font-family: 'Calibri', sans-serif; }
                    .item { margin-bottom: 20px; padding: 10px; border-bottom: 1px solid #ccc; }
                    .source a { color: blue; text-decoration: underline; }
                    .text { background-color: yellow; padding: 5px; display: inline-block; }
                    .meta { color: #666; font-size: 0.8em; margin-bottom: 5px; }
                </style>
            </head>
            <body>
                <h1>Clipboard History Export</h1>
                <p>Generated on ${new Date().toLocaleString()}</p>
                <hr/>
        `;

        history.forEach(item => {
            contentHtml += `
                <div class="item">
                    <div class="meta">
                        <strong>Date:</strong> ${new Date(item.timestamp).toLocaleString()}<br/>
                        <strong>Source:</strong> <a href="${item.url}">${item.title || item.url}</a>
                    </div>
                    <div class="text">
                        ${item.text.replace(/\n/g, '<br/>')}
                    </div>
                </div>
            `;
        });

        contentHtml += `</body></html>`;

        const blob = new Blob(['\ufeff', contentHtml], {
            type: 'application/msword'
        });

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'Clipboard_History_' + new Date().toISOString().slice(0, 10) + '.doc';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    function deleteItem(id) {
        chrome.storage.local.get(['clipboardHistory'], (result) => {
            let history = result.clipboardHistory || [];
            history = history.filter(item => item.id !== id);

            chrome.storage.local.set({ clipboardHistory: history }, () => {
                loadHistory(); // Reload UI
            });
        });
    }

    function renderList(history) {
        listContainer.innerHTML = '';

        if (history.length === 0) {
            listContainer.innerHTML = `
                <div class="empty-state">
                    <p>No history yet.</p>
                    <p>Copy text from any website to see it here.</p>
                </div>
            `;
            return;
        }

        history.forEach(item => {
            const el = document.createElement('div');
            el.className = 'clipboard-item';

            // Format stats
            const date = new Date(item.timestamp);
            const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            // Extract domain
            let domain = 'Unknown';
            try {
                const urlObj = new URL(item.url);
                domain = urlObj.hostname.replace('www.', '');
            } catch (e) { }

            el.innerHTML = `
                <div class="item-header">
                    <span class="item-source" title="${domain}">${domain}</span>
                    <span class="item-time">${timeString}</span>
                </div>
                <div class="item-text"></div>
                <div class="item-actions">
                    <a href="${item.url}" target="_blank" class="link-btn">
                        🔗 Source
                    </a>
                    <div style="display: flex; gap: 5px;">
                        <button class="delete-btn" data-id="${item.id}" title="Remove Item">🗑️</button>
                        <button class="copy-btn" data-text="">Copy</button>
                    </div>
                </div>
            `;

            // Safely set text content
            el.querySelector('.item-text').textContent = item.text;
            el.querySelector('.copy-btn').dataset.text = item.text;

            // Delete handler
            el.querySelector('.delete-btn').addEventListener('click', (e) => {
                const idToDelete = parseInt(e.target.dataset.id);
                deleteItem(idToDelete);
            });

            // Copy handler
            el.querySelector('.copy-btn').addEventListener('click', (e) => {
                const text = e.target.dataset.text;
                navigator.clipboard.writeText(text).then(() => {
                    const originalText = e.target.textContent;
                    e.target.textContent = 'Copied!';
                    setTimeout(() => {
                        e.target.textContent = originalText;
                    }, 1000);
                });
            });

            listContainer.appendChild(el);
        });
    }
});

# ClipVault - Smart Link Saver

ClipVault is a smart clipboard manager extension that automatically saves copied text along with the source URL. It ensures you never lose the context of your snippets and allows for easy retrieval.

## Features

-   **Auto-Save**: Automatically captures copied text and links it to the page where it was found.
-   **Source Tracking**: Keeps track of the original URL for every text snippet.
-   **History Management**: View, search, and manage your clipboard history in a pop-up interface.
-   **Privacy Focused**: All data is stored locally in your browser/storage.

## Technologies Used

-   **Frontend**: HTML, CSS, JavaScript
-   **Extension**: Chrome Extension Manifest V3
-   **Storage**: `chrome.storage.local` API

## Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/rittu07/clipvault.git
    ```
2.  Open Chrome and navigate to `chrome://extensions/`.
3.  Enable **Developer mode**.
4.  Click **Load unpacked** and select the `clip-vault` directory.

## Usage

-   Simply copy text from any webpage (`Ctrl+C`).
-   Click the ClipVault icon in the toolbar to search or view your saved clips and their sources.


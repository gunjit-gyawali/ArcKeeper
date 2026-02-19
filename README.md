# Arc Keeper — Anime & Manga Progress Tracker

A Chrome extension for tracking your anime and manga progress, with automatic cover art fetching, a dark-themed UI, statistics, filtering, and full list management.

---

## Features

### Add & Track Entries
- **Title** — Save any anime or manga by name
- **Type** — Categorize entries as Anime or Manga
- **Status** — Mark entries as Watching, Completed, On Hold, Dropped, or Plan to Watch
- **Season** — Optionally track which season you are on
- **Episode / Chapter** — Log exactly where you left off
- **Rating** — Score entries from 0 to 10 in 0.5 increments, with a live star display
- **Notes** — Add freeform notes such as "Final battle of the arc!"

---

### Automatic Cover Art via Jikan API
When you save an entry, Arc Keeper automatically queries the Jikan API (an unofficial MyAnimeList REST API) using the title you entered. It fetches the official cover image for that anime or manga and displays it alongside your saved entry as a poster thumbnail.

The API endpoint used is:
```
https://api.jikan.moe/v4/{endpoint}?q={title}&limit=1
```

Where `endpoint` is either `anime` or `manga` depending on the type selected. The first result returned is used, pulling the cover image directly from MyAnimeList. This means entries are visually identifiable at a glance without any manual image uploading. If the API is unavailable or returns no result, the entry is still saved normally without a cover.

---

### Quick Progress Controls
Each saved entry has + and - buttons so you can increment or decrement your episode or chapter count in one click without opening the edit modal.

---

### Edit Entries
Click the edit button on any saved entry to open a full edit modal where every field can be updated: title, type, status, season, episode/chapter, rating, and notes.

---

### Delete Entries
Remove any entry with the delete button. A confirmation dialog prevents accidental deletions.

---

### Search and Filter
- **Search bar** — Filter your list in real time by title
- **Type filter** — Show all entries, anime only, or manga only
- **Status filter** — Filter by any watch status

---

### Sorting
Sort your saved list by newest or oldest first, title A-Z or Z-A, or progress high to low or low to high.

---

### Statistics
Click Stats in the toolbar to view an overview of your list, including total entries, a breakdown by type and status, and total episodes and chapters tracked.

---

### Export and Import
- **Export** — Download your entire progress list as a .json file for backup or transfer
- **Import** — Load a previously exported .json file to restore or migrate your data

---

### Dark and Light Mode
Toggle between dark mode (dark navy gradient) and light mode (purple gradient) using the button in the header. Your preference is saved automatically.

---

### Persistent Storage
All data is saved using Chrome's storage API, so your list persists across browser sessions and popup closes.

---

## Installation

1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable Developer Mode using the toggle in the top right
4. Click Load unpacked and select the extension folder
5. The Arc Keeper icon will appear in your Chrome toolbar

---

## File Structure

```
arc-keeper/
├── manifest.json     # Extension configuration (Manifest V3)
├── popup.html        # Main UI layout
├── popup.css         # Styles and theming
├── popup.js          # All logic, Jikan API calls, and Chrome storage interactions
├── icon16.png        # Extension icon (16x16)
├── icon48.png        # Extension icon (48x48)
└── icon128.png       # Extension icon (128x128)
```

---

## Tech Stack

- Manifest V3 Chrome Extension
- Vanilla HTML, CSS, and JavaScript
- Chrome Storage API for persistence
- Jikan API v4 (https://api.jikan.moe) for anime and manga metadata and cover art
- No external dependencies or frameworks

---

## License

This project is open source. Feel free to fork, modify, and build upon it.

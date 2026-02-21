document.addEventListener('DOMContentLoaded', () => {

  const form = document.getElementById('progressForm');
  const titleInput = document.getElementById('titleInput');
  const typeSelect = document.getElementById('typeSelect');
  const statusSelect = document.getElementById('statusSelect');
  const seasonInput = document.getElementById('seasonInput');
  const progressInput = document.getElementById('progressInput');
  const ratingInput = document.getElementById('ratingInput');
  const ratingValue = document.getElementById('ratingValue');
  const notesInput = document.getElementById('notesInput');
  const savedList = document.getElementById('savedList');
  const emptyMessage = document.getElementById('emptyMessage');
  const searchInput = document.getElementById('searchInput');
  const filterType = document.getElementById('filterType');
  const filterStatus = document.getElementById('filterStatus');
  const sortSelect = document.getElementById('sortSelect');
  const darkModeToggle = document.getElementById('darkModeToggle');
  const statsBtn = document.getElementById('statsBtn');
  const exportBtn = document.getElementById('exportBtn');
  const importBtn = document.getElementById('importBtn');
  const importFile = document.getElementById('importFile');
  const statsModal = document.getElementById('statsModal');
  const confirmModal = document.getElementById('confirmModal');
  const editModal = document.getElementById('editModal');
  const editForm = document.getElementById('editForm');

  let allEntries = [];
  let pendingDeleteId = null;
  let coverImageCache = {};

  chrome.storage.local.get(['darkMode'], (result) => {
    if (result.darkMode === false) {
      document.body.setAttribute('data-theme', 'light');
      darkModeToggle.textContent = '🌙';
    } else {
      document.body.setAttribute('data-theme', 'dark');
      darkModeToggle.textContent = '☀️';
      if (result.darkMode === undefined) {
        chrome.storage.local.set({ darkMode: true });
      }
    }
  });

  darkModeToggle.addEventListener('click', () => {
    const isDark = document.body.getAttribute('data-theme') === 'dark';
    if (isDark) {
      document.body.setAttribute('data-theme', 'light');
      darkModeToggle.textContent = '🌙';
      chrome.storage.local.set({ darkMode: false });
    } else {
      document.body.setAttribute('data-theme', 'dark');
      darkModeToggle.textContent = '☀️';
      chrome.storage.local.set({ darkMode: true });
    }
  });

  loadSavedEntries();

  ratingInput.addEventListener('input', () => {
    const value = ratingInput.value || 0;
    ratingValue.textContent = value;
  });

  const editRatingInput = document.getElementById('editRatingInput');
  const editRatingValue = document.getElementById('editRatingValue');
  editRatingInput.addEventListener('input', () => {
    const value = editRatingInput.value || 0;
    editRatingValue.textContent = value;
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const entry = {
      id: Date.now(),
      title: titleInput.value.trim(),
      type: typeSelect.value,
      status: statusSelect.value,
      season: seasonInput.value ? parseInt(seasonInput.value) : null,
      progress: parseInt(progressInput.value),
      rating: ratingInput.value ? parseFloat(ratingInput.value) : null,
      notes: notesInput.value.trim(),
      timestamp: new Date().toISOString(),
      coverImage: null
    };


    fetchCoverImage(entry.title, entry.type).then(coverUrl => {
      entry.coverImage = coverUrl;
      saveEntry(entry);
    });
  });

  searchInput.addEventListener('input', filterAndDisplay);
  filterType.addEventListener('change', filterAndDisplay);
  filterStatus.addEventListener('change', filterAndDisplay);
  sortSelect.addEventListener('change', filterAndDisplay);

  statsBtn.addEventListener('click', showStats);

  exportBtn.addEventListener('click', exportData);

  importBtn.addEventListener('click', () => importFile.click());
  importFile.addEventListener('change', importData);

  document.querySelectorAll('.close-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      statsModal.classList.remove('active');
      editModal.classList.remove('active');
    });
  });

  statsModal.addEventListener('click', (e) => {
    if (e.target === statsModal) {
      statsModal.classList.remove('active');
    }
  });

  editModal.addEventListener('click', (e) => {
    if (e.target === editModal) {
      editModal.classList.remove('active');
    }
  });

  document.getElementById('closeEditModal').addEventListener('click', () => {
    editModal.classList.remove('active');
  });

  editForm.addEventListener('submit', (e) => {
    e.preventDefault();
    updateEntry();
  });

  document.getElementById('confirmNo').addEventListener('click', () => {
    confirmModal.classList.remove('active');
    pendingDeleteId = null;
  });

  document.getElementById('confirmYes').addEventListener('click', () => {
    if (pendingDeleteId) {
      confirmDelete(pendingDeleteId);
    }
    confirmModal.classList.remove('active');
    pendingDeleteId = null;
  });

  function saveEntry(entry) {
    chrome.storage.local.get(['progressEntries'], (result) => {
      const entries = result.progressEntries || [];
      entries.unshift(entry);

      chrome.storage.local.set({ progressEntries: entries }, () => {
        form.reset();
        titleInput.focus();
        allEntries = entries;
        filterAndDisplay();
      });
    });
  }

  function loadSavedEntries() {
    chrome.storage.local.get(['progressEntries'], (result) => {
      allEntries = result.progressEntries || [];
      filterAndDisplay();
    });
  }

  function filterAndDisplay() {
    const searchTerm = searchInput.value.toLowerCase();
    const typeFilter = filterType.value;
    const statusFilter = filterStatus.value;
    const sortOption = sortSelect.value;

    let filtered = allEntries.filter(entry => {
      const matchesSearch = entry.title.toLowerCase().includes(searchTerm);
      const matchesType = typeFilter === 'all' || entry.type === typeFilter;
      const matchesStatus = statusFilter === 'all' || entry.status === statusFilter;
      return matchesSearch && matchesType && matchesStatus;
    });

    filtered.sort((a, b) => {
      switch(sortOption) {
        case 'date-desc':
          return new Date(b.timestamp) - new Date(a.timestamp);
        case 'date-asc':
          return new Date(a.timestamp) - new Date(b.timestamp);
        case 'title-asc':
          return a.title.localeCompare(b.title);
        case 'title-desc':
          return b.title.localeCompare(a.title);
        case 'progress-desc':
          return b.progress - a.progress;
        case 'progress-asc':
          return a.progress - b.progress;
        default:
          return 0;
      }
    });

    displayEntries(filtered);
  }

  function deleteEntry(entryId) {
    pendingDeleteId = entryId;
    document.getElementById('confirmMessage').textContent =
      'Are you sure you want to delete this entry? This cannot be undone.';
    confirmModal.classList.add('active');
  }

  function confirmDelete(entryId) {
    chrome.storage.local.get(['progressEntries'], (result) => {
      const entries = result.progressEntries || [];
      const updatedEntries = entries.filter(entry => entry.id !== entryId);

      chrome.storage.local.set({ progressEntries: updatedEntries }, () => {
        allEntries = updatedEntries;
        filterAndDisplay();
      });
    });
  }

  function updateProgress(entryId, change) {
    chrome.storage.local.get(['progressEntries'], (result) => {
      const entries = result.progressEntries || [];
      const entry = entries.find(e => e.id === entryId);

      if (entry) {
        const newProgress = entry.progress + change;
        if (newProgress >= 0) {
          entry.progress = newProgress;
          entry.timestamp = new Date().toISOString();

          chrome.storage.local.set({ progressEntries: entries }, () => {
            allEntries = entries;
            filterAndDisplay();
          });
        }
      }
    });
  }

  function displayEntries(entries) {
    savedList.innerHTML = '';

    if (entries.length === 0) {
      savedList.style.display = 'none';
      emptyMessage.style.display = 'block';
      return;
    }

    savedList.style.display = 'flex';
    emptyMessage.style.display = 'none';

    entries.forEach((entry) => {
      const item = document.createElement('div');
      item.className = 'saved-item';

      const progressLabel = entry.type === 'anime' ? 'Episode' : 'Chapter';
      const date = new Date(entry.timestamp);
      const formattedDate = date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });

      const statusLabel = entry.status.split('-').map(word =>
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ');

      const seasonBadge = entry.season ?
        `<span class="saved-item-season">S${entry.season}</span>` : '';

      const ratingDisplay = entry.rating ?
        `<span class="saved-item-rating">★ ${entry.rating}/10</span>` : '';

      const notesHtml = entry.notes ?
        `<div class="saved-item-notes"><b>Note:</b> ${escapeHtml(entry.notes)}</div>` : '';

      const coverHtml = entry.coverImage ?
        `<img src="${entry.coverImage}" class="saved-item-cover" alt="${escapeHtml(entry.title)}" onerror="this.style.display='none'">` : 
        '<div class="saved-item-cover" style="background: rgba(255,255,255,0.1);"></div>';

      item.innerHTML = `
        ${coverHtml}
        <div class="saved-item-content">
          <div class="saved-item-header">
            <div class="saved-item-title">${escapeHtml(entry.title)}${ratingDisplay}</div>
            <div>
              <button class="btn-edit" data-id="${entry.id}" title="Edit"> Edit</button>
              <button class="btn-delete" data-id="${entry.id}" title="Delete">Delete</button>
            </div>
          </div>
          <div class="saved-item-details">
            <div class="saved-item-badges">
              <span class="saved-item-type">${entry.type}</span>
              ${seasonBadge}
              <span class="saved-item-status status-${entry.status}">${statusLabel}</span>
            </div>
            <div class="progress-controls">
              <button class="btn-decrement" data-id="${entry.id}" title="Decrease">-</button>
              <span class="saved-item-progress">${progressLabel} ${entry.progress}</span>
              <button class="btn-increment" data-id="${entry.id}" title="Increase">+</button>
            </div>
          </div>
          ${notesHtml}
          <div class="saved-item-date">Updated: ${formattedDate}</div>
        </div>
      `;

      savedList.appendChild(item);
    });

    document.querySelectorAll('.btn-edit').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const entryId = parseInt(e.target.dataset.id);
        editEntry(entryId);
      });
    });

    document.querySelectorAll('.btn-delete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const entryId = parseInt(e.target.dataset.id);
        deleteEntry(entryId);
      });
    });

    document.querySelectorAll('.btn-increment').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const entryId = parseInt(e.target.dataset.id);
        updateProgress(entryId, 1);
      });
    });

    document.querySelectorAll('.btn-decrement').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const entryId = parseInt(e.target.dataset.id);
        updateProgress(entryId, -1);
      });
    });
  }

  function showStats() {
    const totalEntries = allEntries.length;
    const animeCount = allEntries.filter(e => e.type === 'anime').length;
    const mangaCount = allEntries.filter(e => e.type === 'manga').length;
    const totalEpisodes = allEntries
      .filter(e => e.type === 'anime')
      .reduce((sum, e) => sum + e.progress, 0);
    const totalChapters = allEntries
      .filter(e => e.type === 'manga')
      .reduce((sum, e) => sum + e.progress, 0);
    const watchingCount = allEntries.filter(e => e.status === 'watching').length;
    const completedCount = allEntries.filter(e => e.status === 'completed').length;
    
    const ratedEntries = allEntries.filter(e => e.rating);
    const avgRating = ratedEntries.length > 0 
      ? (ratedEntries.reduce((sum, e) => sum + e.rating, 0) / ratedEntries.length).toFixed(1)
      : 0;

    const statsContent = document.getElementById('statsContent');
    statsContent.innerHTML = `
      <div class="stat-row">
        <span class="stat-label">Total Entries</span>
        <span class="stat-value">${totalEntries}</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">Anime Tracked</span>
        <span class="stat-value">${animeCount}</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">Manga Tracked</span>
        <span class="stat-value">${mangaCount}</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">Total Episodes</span>
        <span class="stat-value">${totalEpisodes}</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">Total Chapters</span>
        <span class="stat-value">${totalChapters}</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">Currently Watching</span>
        <span class="stat-value">${watchingCount}</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">Completed</span>
        <span class="stat-value">${completedCount}</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">Average Rating</span>
        <span class="stat-value">★ ${avgRating}/10</span>
      </div>
    `;

    statsModal.classList.add('active');
  }

  function exportData() {
    const dataStr = JSON.stringify(allEntries, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `anime-progress-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function importData(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target.result);
        if (!Array.isArray(imported)) {
          alert('Invalid file format!');
          return;
        }

        chrome.storage.local.get(['progressEntries'], (result) => {
          const existing = result.progressEntries || [];
          const merged = [...imported, ...existing];

          const unique = merged.filter((entry, index, self) =>
            index === self.findIndex((e) => (
              e.title === entry.title && e.type === entry.type
            ))
          );

          chrome.storage.local.set({ progressEntries: unique }, () => {
            allEntries = unique;
            filterAndDisplay();
            alert(`Imported ${imported.length} entries successfully!`);
          });
        });
      } catch (error) {
        alert('Error reading file!');
      }
    };
    reader.readAsText(file);
    importFile.value = '';
  }

  async function fetchCoverImage(title, type) {
    const cacheKey = `${type}-${title.toLowerCase()}`;
    if (coverImageCache[cacheKey]) {
      return coverImageCache[cacheKey];
    }

    try {
      const endpoint = type === 'anime' ? 'anime' : 'manga';
      const response = await fetch(`https://api.jikan.moe/v4/${endpoint}?q=${encodeURIComponent(title)}&limit=1`);

      if (!response.ok) throw new Error('API request failed');

      const data = await response.json();

      if (data.data && data.data.length > 0) {
        const coverUrl = data.data[0].images.jpg.image_url;
        coverImageCache[cacheKey] = coverUrl;
        return coverUrl;
      }
    } catch (error) {
      console.error('Error fetching cover image:', error);
    }

    return null;
  }

  function editEntry(entryId) {
    const entry = allEntries.find(e => e.id === entryId);
    if (!entry) return;

    document.getElementById('editEntryId').value = entry.id;
    document.getElementById('editTitleInput').value = entry.title;
    document.getElementById('editTypeSelect').value = entry.type;
    document.getElementById('editStatusSelect').value = entry.status;
    document.getElementById('editSeasonInput').value = entry.season || '';
    document.getElementById('editProgressInput').value = entry.progress;
    document.getElementById('editRatingInput').value = entry.rating || '';
    document.getElementById('editRatingValue').textContent = entry.rating || 0;
    document.getElementById('editNotesInput').value = entry.notes || '';

    editModal.classList.add('active');
  }

  function updateEntry() {
    const entryId = parseInt(document.getElementById('editEntryId').value);
    const updatedTitle = document.getElementById('editTitleInput').value.trim();
    const updatedType = document.getElementById('editTypeSelect').value;

    chrome.storage.local.get(['progressEntries'], (result) => {
      const entries = result.progressEntries || [];
      const entryIndex = entries.findIndex(e => e.id === entryId);
      
      if (entryIndex !== -1) {
        const oldTitle = entries[entryIndex].title;
        const oldType = entries[entryIndex].type;
        
        entries[entryIndex] = {
          ...entries[entryIndex],
          title: updatedTitle,
          type: updatedType,
          status: document.getElementById('editStatusSelect').value,
          season: document.getElementById('editSeasonInput').value ? 
                  parseInt(document.getElementById('editSeasonInput').value) : null,
          progress: parseInt(document.getElementById('editProgressInput').value),
          rating: document.getElementById('editRatingInput').value ? 
                  parseFloat(document.getElementById('editRatingInput').value) : null,
          notes: document.getElementById('editNotesInput').value.trim(),
          timestamp: new Date().toISOString()
        };

        if (oldTitle !== updatedTitle || oldType !== updatedType) {
          fetchCoverImage(updatedTitle, updatedType).then(coverUrl => {
            entries[entryIndex].coverImage = coverUrl;
            chrome.storage.local.set({ progressEntries: entries }, () => {
              allEntries = entries;
              filterAndDisplay();
              editModal.classList.remove('active');
            });
          });
        } else {
          chrome.storage.local.set({ progressEntries: entries }, () => {
            allEntries = entries;
            filterAndDisplay();
            editModal.classList.remove('active');
          });
        }
      }
    });
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
});

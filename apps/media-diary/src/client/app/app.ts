import type {
  MediaCategory,
  MediaEntry,
  MediaType,
  CreateEntryRequest,
  EntriesResponse,
  EntryResponse,
  DeleteResponse,
} from '../../shared/types/api';
import {
  MEDIA_TYPES_BY_CATEGORY,
  MEDIA_TYPE_LABELS,
  CATEGORY_ICONS,
} from '../../shared/types/api';

let currentCategory: MediaCategory | 'all' = 'all';
let entries: MediaEntry[] = [];
let editingId: string | null = null;

const $ = <T extends HTMLElement>(id: string): T => document.getElementById(id) as T;

const entriesList = $<HTMLDivElement>('entries-list');
const emptyState = $<HTMLDivElement>('empty-state');
const loading = $<HTMLDivElement>('loading');
const modalOverlay = $<HTMLDivElement>('modal-overlay');
const modalTitle = $<HTMLHeadingElement>('modal-title');
const entryForm = $<HTMLFormElement>('entry-form');
const entryType = $<HTMLSelectElement>('entry-type');
const entryTitle = $<HTMLInputElement>('entry-title');
const entryDate = $<HTMLInputElement>('entry-date');
const ratingSlider = $<HTMLInputElement>('rating-slider');
const ratingValue = $<HTMLSpanElement>('rating-value');
const entryComments = $<HTMLTextAreaElement>('entry-comments');
const headerStats = $<HTMLDivElement>('header-stats');

function todayStr(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function updateTypeOptions(category: MediaCategory): void {
  const types = MEDIA_TYPES_BY_CATEGORY[category];
  entryType.innerHTML = '';
  for (const t of types) {
    const opt = document.createElement('option');
    opt.value = t;
    opt.textContent = MEDIA_TYPE_LABELS[t];
    entryType.appendChild(opt);
  }
}

function ratingColor(rating: number): string {
  if (rating >= 8) return '#4caf50';
  if (rating >= 6) return '#ff9800';
  if (rating >= 4) return '#ff5722';
  return '#f44336';
}

function renderStars(rating: number): string {
  return `<span class="entry-rating" style="color:${ratingColor(rating)}">${rating}<span class="rating-of">/10</span></span>`;
}

function renderEntry(entry: MediaEntry): string {
  const icon = CATEGORY_ICONS[entry.category];
  const typeLabel = MEDIA_TYPE_LABELS[entry.type];
  const dateFormatted = formatDate(entry.date);

  return `
    <div class="entry-card" data-id="${entry.id}">
      <div class="entry-top">
        <div class="entry-meta">
          <span class="entry-icon">${icon}</span>
          <span class="entry-type-badge">${typeLabel}</span>
          <span class="entry-date">${dateFormatted}</span>
        </div>
        ${renderStars(entry.rating)}
      </div>
      <div class="entry-title">${escapeHtml(entry.title)}</div>
      ${entry.comments ? `<div class="entry-comments">${escapeHtml(entry.comments)}</div>` : ''}
      <div class="entry-actions">
        <button class="entry-action-btn edit-btn" data-id="${entry.id}">Edit</button>
        <button class="entry-action-btn delete-btn" data-id="${entry.id}">Delete</button>
      </div>
    </div>
  `;
}

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function renderEntries(): void {
  loading.classList.add('hidden');

  const filtered = currentCategory === 'all'
    ? entries
    : entries.filter((e) => e.category === currentCategory);

  if (filtered.length === 0) {
    entriesList.innerHTML = '';
    emptyState.classList.remove('hidden');
    return;
  }

  emptyState.classList.add('hidden');
  entriesList.innerHTML = filtered.map(renderEntry).join('');

  entriesList.querySelectorAll('.edit-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = (btn as HTMLElement).dataset['id'];
      if (id) void openEditModal(id);
    });
  });

  entriesList.querySelectorAll('.delete-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = (btn as HTMLElement).dataset['id'];
      if (id) void deleteEntry(id);
    });
  });
}

function updateStats(): void {
  const total = entries.length;
  if (total === 0) {
    headerStats.textContent = '';
    return;
  }
  const avgRating = entries.reduce((sum, e) => sum + e.rating, 0) / total;
  headerStats.textContent = `${total} entries · avg ${avgRating.toFixed(1)}/10`;
}

async function fetchEntries(): Promise<void> {
  try {
    const res = await fetch('/api/entries');
    const data = (await res.json()) as EntriesResponse;
    if (data.success) {
      entries = data.entries;
      renderEntries();
      updateStats();
    }
  } catch (err) {
    console.error('Failed to fetch entries:', err);
    loading.textContent = 'Failed to load entries. Please try again.';
  }
}

function openModal(): void {
  modalOverlay.classList.remove('hidden');
  entryTitle.focus();
}

function closeModal(): void {
  modalOverlay.classList.add('hidden');
  editingId = null;
  entryForm.reset();
  entryDate.value = todayStr();
  ratingSlider.value = '7';
  ratingValue.textContent = '7';
  modalTitle.textContent = 'New Entry';

  const catBtns = document.querySelectorAll('.cat-btn');
  catBtns.forEach((b) => b.classList.remove('active'));
  catBtns[0]?.classList.add('active');
  updateTypeOptions('watched');
}

function openEditModal(id: string): void {
  const entry = entries.find((e) => e.id === id);
  if (!entry) return;

  editingId = id;
  modalTitle.textContent = 'Edit Entry';

  const catBtns = document.querySelectorAll('.cat-btn');
  catBtns.forEach((b) => {
    b.classList.remove('active');
    if ((b as HTMLElement).dataset['cat'] === entry.category) {
      b.classList.add('active');
    }
  });

  updateTypeOptions(entry.category);
  entryType.value = entry.type;
  entryTitle.value = entry.title;
  entryDate.value = entry.date;
  ratingSlider.value = String(entry.rating);
  ratingValue.textContent = String(entry.rating);
  entryComments.value = entry.comments;

  openModal();
}

async function saveEntry(): Promise<void> {
  const activeCat = document.querySelector('.cat-btn.active') as HTMLElement | null;
  const category = (activeCat?.dataset['cat'] || 'watched') as MediaCategory;
  const type = entryType.value as MediaType;
  const title = entryTitle.value.trim();
  const date = entryDate.value;
  const rating = parseInt(ratingSlider.value, 10);
  const comments = entryComments.value.trim();

  if (!title) {
    entryTitle.focus();
    return;
  }

  const payload: CreateEntryRequest = { category, type, title, date, rating, comments };

  try {
    let res: Response;
    if (editingId) {
      res = await fetch(`/api/entries/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } else {
      res = await fetch('/api/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    }

    const data = (await res.json()) as EntryResponse;
    if (data.success) {
      closeModal();
      await fetchEntries();
    } else {
      console.error('Save failed:', data.error);
    }
  } catch (err) {
    console.error('Failed to save entry:', err);
  }
}

async function deleteEntry(id: string): Promise<void> {
  try {
    const res = await fetch(`/api/entries/${id}`, { method: 'DELETE' });
    const data = (await res.json()) as DeleteResponse;
    if (data.success) {
      await fetchEntries();
    }
  } catch (err) {
    console.error('Failed to delete entry:', err);
  }
}

function init(): void {
  entryDate.value = todayStr();

  $<HTMLButtonElement>('add-btn').addEventListener('click', () => {
    editingId = null;
    modalTitle.textContent = 'New Entry';
    openModal();
  });

  $<HTMLButtonElement>('modal-close').addEventListener('click', closeModal);
  $<HTMLButtonElement>('btn-cancel').addEventListener('click', closeModal);

  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeModal();
  });

  entryForm.addEventListener('submit', (e) => {
    e.preventDefault();
    void saveEntry();
  });

  ratingSlider.addEventListener('input', () => {
    ratingValue.textContent = ratingSlider.value;
  });

  document.querySelectorAll('.cat-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.cat-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const cat = (btn as HTMLElement).dataset['cat'] as MediaCategory;
      updateTypeOptions(cat);
    });
  });

  document.querySelectorAll('#tabs .tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('#tabs .tab').forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      currentCategory = ((tab as HTMLElement).dataset['category'] || 'all') as MediaCategory | 'all';
      renderEntries();
    });
  });

  void fetchEntries();
}

init();

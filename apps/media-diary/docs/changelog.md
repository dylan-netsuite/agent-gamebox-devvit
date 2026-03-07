# Media Diary — Changelog

## v0.1.0 — Initial Release
- Created Media Diary Devvit app in `apps/media-diary/`
- Vanilla TypeScript + CSS UI (no Phaser)
- Splash screen with animated icons and "Open Diary" button
- Full diary UI with category tabs (All, Watched, Read, Listened)
- Add/edit/delete media entries with:
  - Category selection (watched/read/listened)
  - Media type (TV, movie, book, magazine, comic, article, album, song, playlist, podcast)
  - Title field
  - Date picker (defaults to today)
  - Rating slider (1-10)
  - Comments textarea
- Express server with Redis storage
- CRUD API endpoints for entries
- Stats endpoint with entry counts and average rating
- Dark theme UI with responsive mobile-first design
- Bottom-sheet modal for entry form
- Entry cards with color-coded ratings

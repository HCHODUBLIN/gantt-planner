# Gantt Planner

Interactive project management dashboard with Gantt chart and weekly planner. Built with React + Vite, deployed on GitHub Pages with PIN-based encryption for private data.

## Live Site

https://hchodublin.github.io/gantt-planner/

- Default view shows demo data
- Enter PIN to unlock private data

## Features

### Gantt Chart
- 29-week timeline (Mar 23 - Sep 28) with current week highlighted
- Drag-and-drop bar resizing (start/end) and repositioning
- Click-to-cycle status (Pending / In Progress / Done) and priority (Low / Med / High / Urgent)
- Multi-select filtering by status, priority, and custom tags
- Category management (add / edit / delete / reorder)
- Action Items focus board with origin tracking and auto-return on done
- Pin/unpin tasks to Action Items
- Editable daily routine section

### Weekly Planner
- 7-day grid with configurable time blocks (morning / afternoon / evening)
- Drag-and-drop tasks from Action Items panel into time blocks
- Remove tasks with hover button
- Day notes and markdown export
- Weekly plans persist alongside task data

### Shared
- Dark / Light mode (Notion-inspired color scheme)
- EN / KO language toggle
- Auto-save to localStorage
- GitHub API auto-save (encrypted data commits directly from browser)
- PIN-based AES-GCM encryption for private data on public hosting

## Tech Stack

- **Frontend:** React 19, React Router, Vite
- **Styling:** CSS variables with Notion color palette
- **Encryption:** Web Crypto API (PBKDF2 + AES-GCM)
- **Deployment:** GitHub Actions + GitHub Pages

## Development

```bash
cd react-app
npm install
npm run dev
```

## Setup Private Data

1. Deploy to GitHub Pages
2. Visit the site and click **Unlock** with your PIN
3. Click **GitHub** to set a Personal Access Token (repo scope, Contents read/write)
4. Click **Save** to auto-commit encrypted data to the repo

## Deploy

Push to `main` branch — GitHub Actions auto-deploys to Pages.

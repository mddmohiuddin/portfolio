# Portfolio Website — Md. Mohi Uddin Chowdhury

A personal portfolio site with a **Photo Gallery** that stays in sync with a
Google Photos album automatically.

## Deploy on GitHub Pages (one-time setup)

1. **Create a repository** on GitHub (e.g. `portfolio`).
2. **Upload everything in this folder** to the repository root
   (so `index.html` sits at the top level of the repo — not inside a subfolder).
   - Easiest: click **"uploading an existing file"** on GitHub and drag all files in.
   - Or use git: `git add . && git commit -m "portfolio" && git push`.

### If GitHub won't accept folders (upload files one by one)

GitHub's file picker only selects files — folders can't be chosen. Two options:

- **Option A — drag & drop:** in Chrome/Edge, drag the **folders themselves**
  (`.github`, `scripts`) from Explorer onto the upload box. That uploads
  their contents without the picker.
- **Option B — create 2 files by typing their paths (always works):**
  1. Upload the 4 loose files normally: `index.html`, `profile.png`,
     `gallery.json`, `README.md` (`.nojekyll` is optional — you can skip it).
  2. Click **Add file → Create new file** and type the name
     `scripts/sync-gallery.mjs` — GitHub creates the folder automatically.
     Open the same file from this zip in Notepad, copy everything, paste it,
     then **Commit**.
  3. Repeat with the name `.github/workflows/sync-gallery.yml`
     (copy from the zip, paste, **Commit**).

3. **Turn on the website:** repo → **Settings → Pages** →
   - Source: **Deploy from a branch**
   - Branch: **main** / **root** → **Save**
   - Your site will be live at `https://YOUR-USERNAME.github.io/REPO-NAME/`
4. **Allow the photo sync to write:** repo → **Settings → Actions → General →
   Workflow permissions** → select **"Read and write permissions"** → **Save**.
5. Open the **Actions** tab → **Sync Photo Gallery** → **Run workflow** (once,
   to test it). After it finishes green, your gallery is live and syncing.

## How the photo gallery auto-updates

- The gallery shows photos from this Google Photos album:
  **https://photos.app.goo.gl/yH8CZFdgC3h5Sxw69**
- A GitHub Action (`.github/workflows/sync-gallery.yml`) re-reads the album
  **every 6 hours** and updates `gallery.json` automatically.
- **Add a photo** to the album → it appears on the website after the next sync.
- **Delete a photo** from the album → it disappears after the next sync.
- You never edit the website or any link — just manage the album in Google Photos.
  (To sync sooner: Actions tab → Sync Photo Gallery → **Run workflow**.)

## Extras on the site

- **Ask me about Mohi** — an offline chatbot widget (bottom-right) that answers
  visitor questions using the website's own information (research, education,
  skills, projects, contact...). No API or server needed.
- **Send a Message form** — visitors enter their name plus their WhatsApp number
  and/or email, write a message, and send it via WhatsApp or email (opens the
  visitor's own app with everything prefilled). Works on any static host.
- **Section jump bar** — the top bar shows section links on every screen size
  (horizontally scrollable on phones) for quick navigation.
- **Favicon & share preview** — `favicon.svg` + Open Graph tags so shared links
  look proper on Facebook/WhatsApp/Twitter.

## Notes

- Keep **link sharing ON** for the album (Album → Share → Create link). That
  public link is what the sync reads. The album link never changes when you
  add/remove photos.
- `gallery.json` is the live photo list — let the Action manage it; no need to
  edit it by hand.
- The list inside `index.html` (`GALLERY_FALLBACK`) is only a saved snapshot
  used if `gallery.json` is missing (e.g. previewing locally).
- To use a different album later, change `PHOTOS_ALBUM_URL` in
  `scripts/sync-gallery.mjs` and the album link in `index.html`.

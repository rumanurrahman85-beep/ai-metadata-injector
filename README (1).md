# AI Metadata Injector

A client-side web app that automatically generates SEO-optimized metadata for any file using Google Gemini AI.

## Features

- **100% Browser-based** — No server needed, no file uploads to any server
- **Batch Processing** — Upload multiple files, process them all at once
- **Auto Metadata Generation** — Uses Gemini AI to create SEO-optimized titles, descriptions, and keywords
- **IP-Safe Content** — AI avoids copyrighted names, brands, and specific people
- **Multiple File Support**:
  - **Images** (PNG, JPG, JPEG, WebP, GIF, BMP, TIFF) — Re-encoded with metadata
  - **SVG** — Metadata injected as XML comments
  - **Text/JSON/XML** — Metadata injected as structured comments
  - **Complex formats** (PSD, AI, EPS, PDF) — Original file + sidecar metadata JSON
- **Batch ZIP Download** — Download all processed files in one ZIP
- **Modern UI** — Clean white + reddish design

## How to Use

1. **Get a Gemini API Key** from [Google AI Studio](https://aistudio.google.com/app/apikey)
2. **Paste your API Key** in the app
3. **Drop or select files** you want to process
4. **Click "Process All Files"** — AI generates metadata for each file
5. **Download individually** or **Download All as ZIP**

## Deploy to GitHub Pages

1. Create a new repository on GitHub
2. Upload these 3 files: `index.html`, `styles.css`, `app.js`
3. Go to **Settings → Pages**
4. Set source to **Deploy from a branch → main**
5. Your app is live at `https://yourusername.github.io/your-repo-name/`

## File Structure

```
├── index.html    # Main HTML page
├── styles.css    # White + reddish styling
└── app.js        # All logic (API calls, metadata injection, batch processing)
```

## Security

- Your API key is stored only in your browser's memory (session only)
- Files are processed entirely in your browser
- Nothing is uploaded to any external server except Gemini API calls

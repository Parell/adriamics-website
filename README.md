# GitHub Pages CV Starter

This is a static, no-build CV site inspired by the structure and tone of `thavlik.dev`.

## Files

- `index.html` — entire site in one file
- `resume.pdf` — optional; add your resume here if you want the Resume button to work
- `CNAME` — optional; add only if you use a custom domain

## Quick edit points

Open `index.html` and change the `siteData` object near the top:

- `person`
- `featured`
- `projects`
- `experience`
- `education`
- `contact`

That is enough to make the page yours.

## Local preview

You can double-click `index.html`, but a local server is better.

### Python
```bash
python -m http.server 8080
```

Then open `http://localhost:8080`.

## Deploy to GitHub Pages

### Option A: user site
Use this if you want the site at:

`https://YOUR-USERNAME.github.io/`

1. Create a new repo named exactly `YOUR-USERNAME.github.io`
2. Upload `index.html`
3. Commit to the default branch
4. In GitHub: **Settings -> Pages**
5. Under **Build and deployment**, choose:
   - **Source**: Deploy from a branch
   - **Branch**: `main` and `/ (root)`
6. Save
7. Wait for GitHub Pages to publish

### Option B: project site
Use this if you want the site at:

`https://YOUR-USERNAME.github.io/cv/`

1. Create a repo like `cv` or `portfolio`
2. Upload `index.html`
3. Commit to `main`
4. In **Settings -> Pages**, deploy from `main` and `/ (root)`

## Optional custom domain

1. Create a file named `CNAME`
2. Put your domain on one line, for example:
```txt
cv.yourdomain.com
```
3. In **Settings -> Pages**, set the custom domain there too
4. Configure DNS at your registrar
5. Enable HTTPS after GitHub validates the domain

## Recommended next edits

- Replace the placeholder projects with 3–6 strong entries
- Keep descriptions outcome-focused
- Add `resume.pdf` if you want the resume button live
- Replace LinkedIn/GitHub/email
- Remove sections you do not need

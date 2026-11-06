# wordsGenerator
Frontend-only name generator: real words + numbers, and custom letter patterns. React + Vite + TypeScript.

    npm install && npm run dev

## Deploy
- **Vercel**: import repo. Auto-detects Vite (`vercel.json` included). Base path `/`.
- **GitHub Pages**: repo name must be `wordsGenerator`. Settings → Pages → Source: *GitHub Actions*. Push to `main`. Workflow sets `BASE_PATH=/wordsGenerator/`.
  Different repo name? Change `BASE_PATH` in `.github/workflows/deploy.yml`.
- Custom domain on Pages: change `BASE_PATH` to `/`.

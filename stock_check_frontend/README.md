# Lightweight React Template for KAVIA

This project provides a minimal React template with a clean, modern UI and minimal dependencies.

## Features

- **Lightweight**: No heavy UI frameworks - uses only vanilla CSS and React
- **Modern UI**: Clean, responsive design with KAVIA brand styling
- **Fast**: Minimal dependencies for quick loading times
- **Simple**: Easy to understand and modify

## Getting Started

In the project directory, you can run:

### `npm start`

Runs the app in development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

### `npm test`

Launches the test runner in interactive watch mode.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

## Customization

### Colors

The main brand colors are defined as CSS variables in `src/App.css`:

```css
:root {
  --kavia-orange: #E87A41;
  --kavia-dark: #1A1A1A;
  --text-color: #ffffff;
  --text-secondary: rgba(255, 255, 255, 0.7);
  --border-color: rgba(255, 255, 255, 0.1);
}
```

### Components

This template uses pure HTML/CSS components instead of a UI framework. You can find component styles in `src/App.css`. 

Common components include:
- Buttons (`.btn`, `.btn-large`)
- Container (`.container`)
- Navigation (`.navbar`)
- Typography (`.title`, `.subtitle`, `.description`)

## Learn More

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment (Netlify + Alpha Vantage proxy)

This project is configured to deploy to **Netlify** with **Netlify Functions** acting as a backend proxy for Alpha Vantage (so the API key stays secret).

#### What was added

- `netlify.toml` with:
  - build config (`publish=build`, functions at `netlify/functions`)
  - redirect: `/api/*` → `/.netlify/functions/:splat`
  - SPA fallback redirect for React Router
- Netlify Function:
  - `/.netlify/functions/av-time-series-daily-adjusted`
  - caching (in-memory per warm function instance) to reduce Alpha Vantage rate-limit pressure
- Frontend LIVE mode now calls `/api/...` (same-origin) instead of calling Alpha Vantage directly.

#### Required Netlify environment variables

Configure these in **Netlify Site settings → Build & deploy → Environment**:

- `ALPHA_VANTAGE_API_KEY` (required): your Alpha Vantage API key
- `ALPHA_VANTAGE_CACHE_TTL_SECONDS` (optional): default cache TTL in seconds (function enforces minimums)

#### Local development with Netlify Functions

For LIVE mode to work locally, run with the Netlify CLI so `/api/*` routes resolve to functions:

1. Install Netlify CLI (once):
   - `npm i -g netlify-cli`
2. From the repository root:
   - `netlify dev`

`netlify dev` will run the React dev server and mount functions locally.

Note: If you run only `npm start`, LIVE mode will fail fast (per BRD: no hallucinated fallback).

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)

# Deployment

If I make updates, I can re-run everything by

### Backend

`yarn run build` to build the dist folder
`NODE_ENV=production node dist/main.js` to serve it

### Frontend

`npx expo export --platform web` to rebuild for web
`npx serve dist -l 7776` to serve from the right port

#### App

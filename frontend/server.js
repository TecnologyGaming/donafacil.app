const express = require('express');
const path = require('path');
const app = express();

// Use process.env.PORT assigned by Hostinger, or fallback locally to 3000
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

// Serve static assets from the React production build folder
app.use(express.static(path.join(__dirname, 'build')));

// Handle Single Page Application (SPA) routing fallback
// All GET requests not matching static files will serve index.html
app.get('/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// Start listening on 0.0.0.0
app.listen(PORT, HOST, () => {
  console.log(`donafacil.app Node.js Web App is running successfully!`);
  console.log(`Listening on host: ${HOST}, port: ${PORT}`);
});

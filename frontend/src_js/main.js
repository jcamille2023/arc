const express = require('express');
const app = express();
const path = require('path');

// Serve the 'public' folder as static files
app.use(express.static(path.join(__dirname, 'public')));

app.listen(3001, () => {
  console.log('Server listening on port 3001');
});
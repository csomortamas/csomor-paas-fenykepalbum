const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Helló! Az alkalmazásom él és virul a Herokun!');
});

app.listen(PORT, () => {
  console.log(`A szerver fut a ${PORT} porton...`);
});

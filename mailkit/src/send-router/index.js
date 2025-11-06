const express = require('express');
const app = express();
const port = 3000;

app.use(express.json());

app.post('/api/send', (req, res) => {
  console.log(req.body);
  res.send('Message received');
});

app.listen(port, () => {
  console.log(`Send-router listening at http://localhost:${port}`);
});

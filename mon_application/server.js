const express = require('express');
const app = express();
const port = 8080;

app.listen(port, () => {
  console.log('Server web est prêt sur le port ' + port);
});
// server.js
const http = require('http');
const config = require('./config');
const handleRoutes = require('./router');
require('./activity'); // ដាស់ activity listener ឱ្យដំណើរការ

const PORT = config.PORT || process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  handleRoutes(req, res);
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
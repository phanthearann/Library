// server.js
require('dotenv').config();
const http = require('http');
const config = require('./config');
const handleRoutes = require('./router');
require('./activity');
// ពិនិត្យមើល check.config.json ដើម្បីយករียง Port 3999 ពេលរត់ npm run check
let checkConfig = {};
try {
  checkConfig = require('./check.config.json');
} catch (e) {
  // Ignored if check.config.json doesn't exist
}

const PORT = process.env.PORT || checkConfig.port || config.PORT || 3000;
const server = http.createServer((req, res) => {
  handleRoutes(req, res);
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
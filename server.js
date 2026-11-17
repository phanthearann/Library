// server.js
const http = require('http');
const config = require('./config'); // នាំយក config ដែលលោកគ្រូឲ្យមកប្រើ
const handleRoutes = require('./router');
require('./activity');

// យក PORT មកប្រើប្រាស់ដោយផ្ទាល់ពី config.js យ៉ាងងាយស្រួល
const PORT = config.PORT; 

const server = http.createServer((req, res) => {
  handleRoutes(req, res);
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
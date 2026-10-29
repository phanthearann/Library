const http = require('http');
const handleRoutes = require('./router');
require('./activity'); // បើក listener របស់ activity log

const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  handleRoutes(req, res);
});

server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
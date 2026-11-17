require('dotenv').config();
const path = require('path');
module.exports = {
  PORT: Number(process.env.PORT) || 3000,
  DATA_DIR: process.env.DATA_DIR || path.join(__dirname, 'data'),
  LOG_FILE: process.env.LOG_FILE || path.join(__dirname, 'activity.log'),
};
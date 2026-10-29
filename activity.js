// activity.js
const fs = require('fs');
const path = require('path');
const bus = require('./lib/events');
const config = require('./config');

const dataDir = config.DATA_DIR || path.join(__dirname, 'data');
const logFile = path.join(dataDir, 'activity.log');

function recordLog(action, data) {
  const timestamp = new Date().toISOString();
  const logLine = `${timestamp} ${action} ${data.resource} #${data.id}\n`;
  
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  fs.appendFile(logFile, logLine, (err) => {
    if (err) console.error('Failed to write activity log:', err);
  });
}

bus.on('created', (data) => recordLog('created', data));
bus.on('updated', (data) => recordLog('updated', data));
bus.on('deleted', (data) => recordLog('deleted', data));

module.exports = bus;
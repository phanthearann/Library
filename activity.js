const fs = require('fs');
const path = require('path');
const appEvents = require('./lib/events');

const logPath = path.join(__dirname, 'Data', 'activity.log');

// ចាប់ event 'log' រួចកត់ត្រាចូល Data/activity.log
appEvents.on('log', (message) => {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] ${message}\n`;
  fs.appendFile(logPath, logEntry, (err) => {
    if (err) {
      console.error('Failed to write activity log:', err);
    }
  });
});

module.exports = appEvents;
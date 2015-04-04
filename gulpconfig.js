module.exports = [
  {pattern: 'CONFIG_DB_PROTOCOL', replacement: process.env.DB_PROTOCOL || 'http'},
  {pattern: 'CONFIG_DB_PORT', replacement: process.env.PORT || process.env.DB_PORT || '5984'},
  {pattern: 'CONFIG_DB_HOST', replacement: process.env.DB_HOST || 'localhost'},
  {pattern: 'CONFIG_WEB_PORT', replacement: process.env.PORT || process.env.WEB_PORT || '8080'},
  {pattern: 'CONFIG_DB_ADMIN_PASS', replacement: process.env.DB_ADMIN_PASS || 'admin'}
];
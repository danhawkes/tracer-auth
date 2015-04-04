module.exports = [
  {pattern: 'CONFIG_DB_PROTOCOL', replacement: process.env.DB_PROTOCOL || 'http'},
  {pattern: 'CONFIG_DB_PORT', replacement: process.env.DB_PORT || '80'},
  {pattern: 'CONFIG_DB_HOST', replacement: process.env.DB_HOST || 'tracer-db.arcs.co'},
  {pattern: 'CONFIG_WEB_PORT', replacement: process.env.WEB_PORT || '80'},
  {pattern: 'CONFIG_DB_ADMIN_PASS', replacement: process.env.DB_ADMIN_PASS || 'admin'}
];

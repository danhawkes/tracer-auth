module.exports = [
  {pattern: 'CONFIG_DB_URL', replacement: process.env.DB_URL || 'http://tracer-db.arcs.co'},
  {pattern: 'CONFIG_DB_ADMIN_PASS', replacement: process.env.DB_ADMIN_PASS || 'admin'}
];

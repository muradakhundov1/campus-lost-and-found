/** Dedicated route so Vercel always invokes POST /api/auth/login (not only via catch-all). */
module.exports = require('../_authLogin');

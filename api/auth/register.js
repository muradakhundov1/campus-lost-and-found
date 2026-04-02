/** Dedicated route so Vercel always invokes POST /api/auth/register (not only via catch-all). */
module.exports = require('../_authRegister');

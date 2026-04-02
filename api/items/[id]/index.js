/**
 * GET/PATCH/DELETE /api/items/:id
 * Explicit route so item updates and deletes hit Postgres (not only via catch-all).
 */
module.exports = require('../../_itemById');

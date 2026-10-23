'use strict';
const SQLiteService = require('@cap-js/sqlite');
// The local federation intentionally stores demo tenants in one database with
// explicit tenantId predicates. CAP's default SQLite provider suffixes database
// filenames by tenant, which would create unseeded databases for mock identities.
module.exports = class TenantSQLiteService extends SQLiteService {
  url4() {
    return super.url4();
  }
};

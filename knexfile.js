require("dotenv").config();

module.exports = {
  client: "pg",
  connection: {
    host: process.env.PGHOST,
    port: process.env.DBPORT || 5432,
    database: process.env.PGDATABASE,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
  },
  migrations: {
    tableName: "knex_migrations",
  },
};

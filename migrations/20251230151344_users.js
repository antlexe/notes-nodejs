exports.up = async function (knex) {
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');

  return knex.schema.createTable("users", (table) => {
    table.increments("id");
    table.string("email").notNullable().unique();
    table.string("passwordHash").notNullable();
    table.timestamp("createdAt").defaultTo(knex.fn.now());

    table.index("email");
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable("users");
};

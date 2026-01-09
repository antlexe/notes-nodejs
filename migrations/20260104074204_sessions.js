exports.up = function (knex) {
  return knex.schema.createTable("sessions", (table) => {
    table.string("sessionId").primary();
    table.integer("userId").notNullable();
    table.foreign("userId").references("id").inTable("users");
    table.timestamp("createdAt").defaultTo(knex.fn.now());

    table.index("userId");
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable("sessions");
};

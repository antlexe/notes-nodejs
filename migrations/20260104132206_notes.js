exports.up = function (knex) {
  return knex.schema.createTable("notes", (table) => {
    table.string("noteId").primary();
    table.integer("userId").notNullable();
    table.foreign("userId").references("id").inTable("users");
    table.string("title").notNullable();
    table.text("content").notNullable();
    table.timestamp("createdAt").defaultTo(knex.fn.now());
    table.timestamp("updatedAt").defaultTo(knex.fn.now());
    table.boolean("isArchived").defaultTo(false);

    table.index("userId");
    table.index(["userId", "createdAt"]);
    table.index(["userId", "isArchived"]);
    table.index("title");
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable("notes");
};

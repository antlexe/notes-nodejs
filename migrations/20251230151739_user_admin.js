exports.up = async function (knex) {
  await knex.raw(`
    INSERT INTO users (email, "passwordHash")
    VALUES ('asdf', crypt('asdf', gen_salt('bf')))
  `);
};

exports.down = async function (knex) {
  await knex("users").where("email", "asdf").del();
};

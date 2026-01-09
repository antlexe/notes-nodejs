const express = require("express");
const { nanoid } = require("nanoid");
const bodyParser = require("body-parser");
const ms = require("ms");

const router = express.Router();

const knex = require("knex")({
  client: "pg",
  connection: {
    host: process.env.PGHOST,
    port: process.env.DBPORT || 5432,
    database: process.env.PGDATABASE,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
  },
});

const findUserByEmail = async (email) => {
  return knex("users").where({ email }).first();
};

const findUserBySessionId = async (sessionId) => {
  const session = await knex("sessions").select("userId").where({ sessionId }).first();

  if (!session) {
    return;
  }

  return knex("users").select().where({ id: session.userId }).first();
};

const createSession = async (userId) => {
  const sessionId = nanoid();

  await knex("sessions").insert({
    userId,
    sessionId,
  });

  return sessionId;
};

const deleteSession = async (sessionId) => {
  await knex("sessions").where({ sessionId }).delete();
};

const auth = () => async (req, res, next) => {
  if (!req.cookies["sessionId"]) {
    return next();
  }
  const user = await findUserBySessionId(req.cookies["sessionId"]);
  req.user = user;
  req.sessionId = req.cookies["sessionId"];
  next();
};

const checkPasswordWithPgcrypto = async (email, password) => {
  const result = await knex.raw(
    `
    SELECT email
    FROM users
    WHERE email = ?
    AND "passwordHash" = crypt(?, "passwordHash")
  `,
    [email, password],
  );

  return result.rows[0];
};

router.get("/", auth(), (req, res) => {
  if (req.user) {
    return res.redirect("/dashboard");
  }

  res.render("index", {
    user: req.user,
    authError: req.query.authError === "true" ? "Wrong email or password" : req.query.authError,
  });
});

router.post("/login", bodyParser.urlencoded({ extended: false }), async (req, res) => {
  const { email, password } = req.body;

  const user = await findUserByEmail(email);
  if (!user) {
    return res.redirect("/?authError=true");
  }

  const passwordMatch = await checkPasswordWithPgcrypto(email, password);
  if (!passwordMatch) {
    return res.redirect("/?authError=true");
  }

  const sessionId = await createSession(user.id);
  res.cookie("sessionId", sessionId, { httpOnly: true, maxAge: ms("1d") }).redirect("/dashboard");
});

router.post("/signup", bodyParser.urlencoded({ extended: false }), async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.redirect("/?authError=Email and password are required");
  }

  const userExist = await findUserByEmail(email);
  if (userExist) {
    return res.redirect("/?authError=Email already exists");
  }

  await knex.raw(
    `
    INSERT INTO users (email, "passwordHash")
    VALUES (?, crypt(?, gen_salt('bf')));
  `,
    [email, password],
  );

  const user = await findUserByEmail(email);
  const sessionId = await createSession(user.id);
  res.cookie("sessionId", sessionId, { httpOnly: true, maxAge: ms("1d") }).redirect("/dashboard");
});

router.get("/logout", auth(), async (req, res) => {
  if (!req.user) {
    return res.redirect("/");
  }
  await deleteSession(req.sessionId);
  res.clearCookie("sessionId").redirect("/");
});

module.exports = { router, auth };

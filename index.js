require("dotenv").config();

const express = require("express");
const nunjucks = require("nunjucks");
const cookieParser = require("cookie-parser");
const { auth } = require("./routes/auth.js");

const app = express();

nunjucks.configure("views", {
  autoescape: true,
  express: app,
});

app.set("view engine", "njk");

app.use(express.json());
app.use(cookieParser());
app.use(express.static("public"));

const { router: authRouter } = require("./routes/auth.js");
const dashboardRouter = require("./routes/dashboard.js");
const notesRouter = require("./routes/notes.js");

app.use("/", authRouter);
app.use("/dashboard", dashboardRouter);
app.use("/dashboard/notes", notesRouter);
app.use(auth(), (req, res) => {
  if (req.user) {
    return res.sendStatus(404);
  }
  res.redirect("/");
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`  Listening on http://localhost:${port}`);
});

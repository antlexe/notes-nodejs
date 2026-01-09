const express = require("express");
const { auth } = require("./auth.js");
const gravatar = require("../utils/gravatar.js");

const router = express.Router();

router.get("/", auth(), (req, res) => {
  if (!req.user) {
    return res.redirect("/");
  }

  res.render("dashboard", {
    emailHash: gravatar(req.user.email),
    email: req.user.email,
  });
});

module.exports = router;

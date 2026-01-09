const crypto = require("crypto");

const getGravatarHash = (email) => {
  const trimmedEmail = email.trim().toLowerCase();
  const hash = crypto.createHash("sha256").update(trimmedEmail).digest("hex");
  return hash;
};

module.exports = getGravatarHash;

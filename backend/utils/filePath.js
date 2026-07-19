const path = require("path");

function toPublicUploadPath(filePath) {
  const relativePath = path.relative(path.join(__dirname, ".."), filePath);
  return relativePath.split(path.sep).join("/");
}

module.exports = { toPublicUploadPath };

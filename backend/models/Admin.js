const bcrypt = require("bcryptjs");
const { createLocalModel } = require("../services/localStorageService");

module.exports = createLocalModel("admins.json", {}, {
  async beforeSave(admin) {
    if (admin.password && !admin.password.startsWith("$2")) {
      admin.password = await bcrypt.hash(admin.password, 12);
    }
  },
  async matchPassword(candidate) {
    return bcrypt.compare(candidate, this.password);
  },
});

const { createLocalModel } = require("../services/localStorageService");

module.exports = createLocalModel("students.json", {
  status: "Pending",
  offerLetterStatus: "",
  certificateGenerated: false,
  gyapanGenerated: false,
  aadhaarCard: null,
});

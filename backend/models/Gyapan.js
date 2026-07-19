const { createLocalModel } = require("../services/localStorageService");

module.exports = createLocalModel("gyapan.json", {
  generated: false,
  generatedBy: "",
  pdfUrl: "",
  gyapanUrl: "",
  publicId: "",
  uploadType: "Generated",
  letterNumber: "",
  studentRows: [],
  selectedStudents: [],
  html: "",
});

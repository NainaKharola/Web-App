const { generatePdfFromHtml } = require("./services/pdfService");

(async () => {
  try {
    const html = `
      <html>
      <body>
        <h1>Hello DRDO</h1>
        <p>This is a PDF test.</p>
      </body>
      </html>
    `;

    const pdf = await generatePdfFromHtml(html);

    const fs = require("fs");
    fs.writeFileSync("test.pdf", pdf);

    console.log("✅ PDF generated successfully.");
  } catch (err) {
    console.error(err);
  }
})();
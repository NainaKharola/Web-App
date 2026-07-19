import { getUploadUrl } from "../utils/uploadUrl";

function OfferLetterViewer({ html, pdfUrl, uploadType }) {
  if (uploadType === "Uploaded" && pdfUrl) {
    return (
      <div className="offer-letter-viewer">
        <iframe title="Uploaded Offer Letter" src={getUploadUrl(pdfUrl)} />
      </div>
    );
  }

  if (!html) {
    return (
      <div className="admin-empty-state">
        Generate or upload an Offer Letter to preview it here.
      </div>
    );
  }

  return (
    <div className="offer-letter-viewer">
      <iframe title="Generated Offer Letter" srcDoc={html} />
    </div>
  );
}

export default OfferLetterViewer;

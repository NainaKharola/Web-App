import { getUploadUrl } from "../utils/uploadUrl";

function GyapanViewer({ html, pdfUrl }) {
  if (pdfUrl) {
    return (
      <iframe
        id="gyapan-frame"
        className="offer-letter-viewer"
        title="Gyapan PDF"
        src={getUploadUrl(pdfUrl)}
      />
    );
  }

  return (
    <iframe
      id="gyapan-frame"
      className="offer-letter-viewer"
      title="Gyapan preview"
      srcDoc={html || "<p>Preview unavailable.</p>"}
    />
  );
}

export default GyapanViewer;

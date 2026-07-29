import { getUploadUrl } from "../utils/uploadUrl";

function GyapanViewer({ html, pdfUrl }) {
  if (pdfUrl) {
    return (
      <iframe
        id="gyapan-frame"
        className="offer-letter-viewer"
        title="Joining ISM PDF"
        src={getUploadUrl(pdfUrl)}
      />
    );
  }

  return (
    <iframe
      id="gyapan-frame"
      className="offer-letter-viewer"
      title="Joining ISM preview"
      srcDoc={html || "<p>Preview unavailable.</p>"}
    />
  );
}

export default GyapanViewer;

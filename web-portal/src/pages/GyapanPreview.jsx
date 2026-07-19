import { useEffect, useState } from "react";
import GyapanViewer from "../components/GyapanViewer";
import { generateGyapanPdf, getGyapan } from "../services/gyapanService";
import { getUploadUrl } from "../utils/uploadUrl";
import "../styles/admin.css";
function GyapanPreview({ gyapanId }) {
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    getGyapan(gyapanId)
      .then(setData)
      .catch((err) => setError(err.message));
  }, [gyapanId]);
  const back = () => {
    window.history.pushState({}, "", "/admin/gyapan");
    window.dispatchEvent(new PopStateEvent("popstate"));
  };
  const edit = () => {
    window.history.pushState({}, "", `/admin/gyapan/${gyapanId}/edit`);
    window.dispatchEvent(new PopStateEvent("popstate"));
  };
  const generate = async () => {
    setBusy(true);
    setError("");
    try {
      const next = await generateGyapanPdf(gyapanId);
      setData((current) => ({
        ...current,
        gyapan: next.gyapan,
        html: next.gyapan.html,
      }));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };
  const printPreview = () => {
    const frame = document.getElementById("gyapan-frame");
    if (!frame) return;

    const printDocument = () => frame.contentWindow?.print();
    if (frame.contentDocument?.readyState === "complete") {
      printDocument();
    } else {
      frame.addEventListener("load", printDocument, { once: true });
    }
  };
  if (!data && !error)
    return (
      <main className="admin-console admin-shell">
        <div className="admin-loading">Loading Gyapan preview...</div>
      </main>
    );
  return (
    <main className="admin-console admin-shell">
      <header className="admin-topbar">
        <div>
          <p className="portal-eyebrow">Gyapan Preview</p>
          <h1>{data?.gyapan?.letterNumber || "GYAPAN"}</h1>
        </div>
        <button className="admin-secondary-btn" type="button" onClick={back}>
          Back
        </button>
      </header>
      <section className="details-section">
        <div className="offer-letter-actions">
          <button className="admin-secondary-btn" type="button" onClick={edit}>
            Edit
          </button>
          {data?.gyapan?.pdfUrl ? (
            <a
              className="admin-secondary-btn admin-link-button"
              href={getUploadUrl(data.gyapan.pdfUrl)}
              target="_blank"
              rel="noreferrer"
            >
              Download Preview
            </a>
          ) : (
            <button
              className="admin-secondary-btn"
              type="button"
              onClick={printPreview}
            >
              Download Preview
            </button>
          )}
          <button
            className="admin-primary-btn"
            type="button"
            disabled={busy || data?.gyapan?.generated}
            onClick={generate}
          >
            {data?.gyapan?.generated
              ? "Final PDF Generated"
              : busy
                ? "Generating PDF..."
                : "Generate Final PDF"}
          </button>
        </div>
        {error && <p className="admin-error">{error}</p>}
        <GyapanViewer html={data?.html} pdfUrl={data?.gyapan?.pdfUrl} />
      </section>
    </main>
  );
}
export default GyapanPreview;

import { useState } from "react";
import { uploadOfferLetter } from "../../services/adminService";

function OfferLetterUpload({ student, onUploaded }) {
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  if (student.status !== "Approved") return null;

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!file) {
      setError("Select the official Offer Letter PDF.");
      return;
    }

    setSaving(true);
    setMessage("");
    setError("");

    try {
      const response = await uploadOfferLetter(student._id, file);
      onUploaded(response.student);
      setMessage(response.message);
      setFile(null);
      event.target.reset();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="offer-letter-box" onSubmit={handleSubmit}>
      <div>
        <h2>Send Letter</h2>
        <p>Upload the official Offer Letter PDF. The system will email this uploaded file to the student.</p>
      </div>

      <label className="admin-field">
        <span>Offer Letter PDF</span>
        <input
          accept="application/pdf"
          type="file"
          onChange={(event) => setFile(event.target.files?.[0] || null)}
        />
      </label>

      {error && <p className="admin-error">{error}</p>}
      {message && <p className="admin-success">{message}</p>}

      <button className="admin-primary-btn" disabled={saving} type="submit">
        {saving ? "Sending..." : "Send Letter"}
      </button>
    </form>
  );
}

export default OfferLetterUpload;

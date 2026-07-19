import { useEffect, useState } from "react";
import OfferLetterForm from "../components/OfferLetterForm";
import { getOfferLetter, updateOfferLetter } from "../services/offerLetterService";
import "../styles/admin.css";

function OfferLetterEditor({ studentId }) {
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;

    async function loadLetter() {
      setLoading(true);
      setError("");

      try {
        const response = await getOfferLetter(studentId);
        if (!ignore) setForm(response.editable);
      } catch (err) {
        if (!ignore) setError(err.message);
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    loadLetter();

    return () => {
      ignore = true;
    };
  }, [studentId]);

  const goPreview = () => {
    window.history.pushState({}, "", `/admin/students/${studentId}/offer-letter`);
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      await updateOfferLetter(studentId, form);
      goPreview();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="admin-console admin-shell">
        <div className="admin-loading">Loading editor...</div>
      </main>
    );
  }

  return (
    <main className="admin-console admin-shell">
      <header className="admin-topbar">
        <div>
          <p className="portal-eyebrow">Offer Letter Editor</p>
          <h1>Edit Allowed Fields</h1>
        </div>
        <button className="admin-secondary-btn" type="button" onClick={goPreview}>
          Back to Preview
        </button>
      </header>

      {error && <p className="admin-error">{error}</p>}
      {form && (
        <OfferLetterForm
          form={form}
          saving={saving}
          onChange={setForm}
          onSubmit={handleSubmit}
        />
      )}
    </main>
  );
}

export default OfferLetterEditor;

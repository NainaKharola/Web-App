import { useState } from "react";
import { updateStudentReview } from "../../services/adminService";

const recommendedByOptions = [
  "Servo System",
  "ABS",
  "SS & ST",
  "NS (Naval System)",
  "OD (Optical Design)",
  "CS & S",
  "ALTDS",
  "LI",
  "LS",
  "LPF",
  "Photonics",
  "EAD",
  "LIDAR",
  "FTIR",
  "HR",
  "MS",
  "ISO",
  "AI",
  "VI",
  "IRST",
  "OME",
  "LIC",
  "ENV",
  "Reprography",
  "MT",
  "P & C",
  "AV",
  "CMD",
  "DIR",
  "HRD",
  "WORKS",
  "MI",
  "SECURITY",
];

function AdminReviewForm({ student, onUpdated }) {
  const [form, setForm] = useState({
    status: student.status || "Pending",
    remark: student.remark || "",
    referenceBy: student.referenceBy || "",
    recommendedBy: student.recommendedBy || "",
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const updateField = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");

    try {
      const response = await updateStudentReview(student._id, form);
      onUpdated(response.student);
      setMessage(response.message);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="admin-review-form" onSubmit={handleSubmit}>
      <h2>Admin Review</h2>

      <div className="admin-control-grid">
        <label className="admin-field">
          <span>Status</span>
          <select
            value={form.status}
            onChange={(event) => updateField("status", event.target.value)}
          >
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>
        </label>

        <label className="admin-field">
          <span>Reference By</span>
          <input
            value={form.referenceBy}
            onChange={(event) => updateField("referenceBy", event.target.value)}
            placeholder="Reference name"
          />
        </label>

        <label className="admin-field">
          <span>Recommended By</span>
          <select
            value={form.recommendedBy}
            onChange={(event) => updateField("recommendedBy", event.target.value)}
          >
            <option value="">Select Recommendation</option>
            {recommendedByOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="admin-field admin-field--wide">
        <span>Remark</span>
        <textarea
          value={form.remark}
          onChange={(event) => updateField("remark", event.target.value)}
          placeholder="Documents Verified, Eligible for Internship, Missing Documents"
          rows="5"
        />
      </label>

      {error && <p className="admin-error">{error}</p>}
      {message && <p className="admin-success">{message}</p>}

      <button className="admin-primary-btn" disabled={saving} type="submit">
        {saving ? "Saving..." : "Save Changes"}
      </button>
    </form>
  );
}

export default AdminReviewForm;

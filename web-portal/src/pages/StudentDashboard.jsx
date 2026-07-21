import { useEffect, useState } from "react";
import {
  fetchStudentDashboard,
  studentDocumentUrl,
  uploadCompletedDocuments,
} from "../services/studentService";
import {
  clearStudentSession,
  getStudentSession,
} from "../services/studentSession";
import { getUploadUrl } from "../utils/uploadUrl";
import "../styles/admin.css";

function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("en-IN");
}

function DetailGrid({ title, rows }) {
  return (
    <section className="details-section">
      <h2>{title}</h2>
      <div className="details-grid">
        {rows.map(([label, value]) => (
          <div className="detail-item" key={label}>
            <span>{label}</span>
            <strong>{value || "-"}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}

function FileLink({ label, href }) {
  if (!href) return null;
  return (
    <a
      className="student-document-link"
      href={getUploadUrl(href)}
      target="_blank"
      rel="noreferrer"
    >
      {label}
    </a>
  );
}

function StudentDashboard() {
  const [student, setStudent] = useState(null);
  const [credentials] = useState(getStudentSession());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [completedFile, setCompletedFile] = useState(null);
  const [uploadMessage, setUploadMessage] = useState("");

  useEffect(() => {
    if (!credentials) {
      window.history.replaceState({}, "", "/student/login");
      window.dispatchEvent(new PopStateEvent("popstate"));
      return;
    }

    let ignore = false;

    async function loadDashboard() {
      try {
        const response = await fetchStudentDashboard(credentials);
        if (!ignore) setStudent(response.student);
      } catch (err) {
        if (!ignore) setError(err.message);
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    loadDashboard();

    return () => {
      ignore = true;
    };
  }, [credentials]);

  const logout = () => {
    clearStudentSession();
    window.history.pushState({}, "", "/student/login");
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  const handleCompletedUpload = async (event) => {
    event.preventDefault();
    setUploadMessage("");

    if (!completedFile) {
      setUploadMessage("Select Upload Form 1 and Form 2 (Single PDF).");
      return;
    }
    if (completedFile.size > 10 * 1024 * 1024) {
      setUploadMessage("Maximum file size allowed is 10 MB.");
      return;
    }

    try {
      const response = await uploadCompletedDocuments(
        credentials,
        completedFile,
      );
      setStudent(response.student);
      setUploadMessage(response.message);
    } catch (err) {
      setUploadMessage(err.message);
    }
  };

  if (loading) {
    return (
      <main className="admin-shell">
        <div className="admin-loading">Loading student dashboard...</div>
      </main>
    );
  }

  if (error || !student) {
    return (
      <main className="admin-shell">
        <button className="secondary-button" type="button" onClick={logout}>
          Back to Login
        </button>
        <p className="admin-error">{error || "Student record not found."}</p>
      </main>
    );
  }
  console.log("Student =", student);
  console.log("Offer Letter =", student.offerLetter);
  console.log("Offer Letter URL =", student.offerLetterUrl);
  const approved = student.status === "Approved";

  return (
    <main className="admin-shell">
      <header className="admin-topbar">
        <div>
          <p className="portal-eyebrow">Student Dashboard</p>
          <h1>{student.name}</h1>
          <div className="student-info-box">
            <div className="student-info-item">
              <span className="student-info-label">Email: </span>
              <strong>{student.email}</strong>
            </div>

            <div className="student-info-item">
              <span className="student-info-label">Reference ID: </span>
              <strong>{student.referenceId}</strong>
            </div>
          </div>
        </div>
        <button className="secondary-button" type="button" onClick={logout}>
          Logout
        </button>
      </header>

      <DetailGrid
        title="Personal Details"
        rows={[
          ["Name", student.name],
          ["Email", student.email],
          ["Phone Number", student.phone],
          ["Date of Birth", student.dob],
          ["Registration Status", student.status],
        ]}
      />

      <DetailGrid
        title="Academic Details"
        rows={[
          ["Course", student.course],
          ["Branch", student.branch],
          ["Year", student.year],
          ["CGPA", student.cgpa],
          ["College Name", student.collegeName],
          ["College Location", student.location],
        ]}
      />

      <DetailGrid
        title="Parent Details"
        rows={[
          ["Father / Guardian Name", student.fatherName],
          ["Father / Guardian Phone", student.fatherPhone],
          ["Father / Guardian Occupation", student.fatherOccupation],
        ]}
      />

      <DetailGrid
        title="Internship Details"
        rows={[
          ["Training Duration", student.internshipDuration],
          ["Joining Month", student.internshipJoiningMonth],
          ["Submitted On", formatDate(student.submittedAt)],
          ["Remark", student.remark],
        ]}
      />

      <section className="details-section">
        <h2>Student Documents</h2>
        <div className="document-actions">
          <FileLink label="View Photo" href={student.photo?.url} />
          <FileLink label="View Resume" href={student.resume?.url} />
          <FileLink label="View Result" href={student.result?.url} />
          <FileLink
            label="View College Recommendation Letter"
            href={student.permissionLetter?.url}
          />
          <FileLink label="View Aadhaar Card" href={student.aadhaarCard?.url} />
        </div>
      </section>

      <section className="details-section">
        <h2>Documents to be Filled by Students</h2>
        {approved ? (
          <div className="document-actions">
            <FileLink
              label="View Offer Letter"
              href={student.offerLetter?.url || student.offerLetterUrl}
            />
            <FileLink
              label="Download Declaration Form (Form 1)"
              href={studentDocumentUrl("declaration", credentials)}
            />
            <FileLink
              label="Download Character Certificate (Form 2)"
              href={studentDocumentUrl("character", credentials)}
            />
          </div>
        ) : (
          <p className="admin-muted">
            Documents to be filled become available after your application is
            approved.
          </p>
        )}
      </section>

      {approved && (
        <section className="details-section">
          <h2>Upload Documents</h2>
          <p className="admin-muted">
            Upload the filled Declaration Form and Character Certificate as a single PDF file (Upload Form 1 and Form 2 together).<br />
            Maximum allowed file size: 10 MB.
          </p>
          <form
            className="offer-letter-upload-inline"
            onSubmit={handleCompletedUpload}
          >
            <label className="admin-field">
              <span>Upload Form 1 and Form 2 (Single PDF)</span>
              <input
                accept="application/pdf"
                type="file"
                onChange={(event) =>
                  setCompletedFile(event.target.files?.[0] || null)
                }
              />
            </label>
            <button className="primary-button" type="submit">
              Upload PDF
            </button>
          </form>
          {student.completedDocuments?.url && (
            <FileLink
              label="View Uploaded Combined PDF"
              href={student.completedDocuments.url}
            />
          )}
          {uploadMessage && <p className="admin-muted">{uploadMessage}</p>}
        </section>
      )}
    </main>
  );
}

export default StudentDashboard;

import { useEffect, useState } from "react";
import AdminReviewForm from "../components/Admin/AdminReviewForm";
import StatusBadge from "../components/Admin/StatusBadge";
import {
  fetchAdminStudent,
  saveTrainingManagement,
} from "../services/adminService";
import {
  generateOfferLetter,
  uploadOfferLetterPdf,
} from "../services/offerLetterService";
import { getUploadUrl } from "../utils/uploadUrl";
import "../styles/admin.css";

const courseOptions = [
  "B.Tech",
  "M.Tech",
  "M.Sc",
  "Ph.D",
];

const yearOptions = [
  "1st Year",
  "2nd Year",
  "3rd Year",
  "4th Year",
];

const branchOptions = [
  "Computer Science Engineering",
  "Information Technology",
  "Electronics and Communication Engineering",
  "Electrical Engineering",
  "Mechanical Engineering",
  "Civil Engineering",
  "Chemical Engineering",
  "Biotechnology",
  "Artificial Intelligence and Data Science",
];

const trainingDurationOptions = [
  "2 Weeks",
  "4 Weeks",
  "6 Weeks",
  "8 Weeks",
  "10 Weeks",
  "12 Weeks",
];

function normalizeCourse(course) {
  const value = String(course || "").trim();
  const comparableValue = value.replace(/\.$/, "").toLowerCase();

  return (
    courseOptions.find(
      (option) => option.replace(/\.$/, "").toLowerCase() === comparableValue,
    ) || value
  );
}

function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleString("en-IN");
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

function DocumentButton({ label, file }) {
  if (!file?.url) return null;

  return (
    <a className="admin-secondary-btn admin-link-button" href={getUploadUrl(file.url)} target="_blank" rel="noreferrer">
      View {label}
    </a>
  );
}

function addDurationToDate(fromDate, duration) {
  if (!fromDate) return "";
  const date = new Date(fromDate);
  if (Number.isNaN(date.getTime())) return "";

  const monthMatch = String(duration || "").match(/(\d+)\s*month/i);
  const weekMatch = String(duration || "").match(/(\d+)\s*week/i);

  if (monthMatch) date.setMonth(date.getMonth() + Number(monthMatch[1]));
  else if (weekMatch) date.setDate(date.getDate() + Number(weekMatch[1]) * 7);
  else return "";

  return date.toISOString().slice(0, 10);
}

function TrainingManagementForm({ student, onUpdated }) {
  const existing = student.trainingManagement || {};
  const [form, setForm] = useState({
    studentName: existing.studentName || student.name || "",
    courseName: normalizeCourse(existing.courseName || student.course),
    courseYear: existing.courseYear || student.year || "",
    branch: existing.branch || student.branch || "",
    collegeName: existing.collegeName || student.collegeName || "",
    collegeLocation: existing.collegeLocation || student.location || "",
    trainingDuration: existing.trainingDuration || student.internshipDuration || "",
    fromDate: existing.fromDate || "",
    toDate: existing.toDate || "",
    joined: existing.joined || student.joinedStatus || "",
    projectTitle: existing.projectTitle || "",
    projectGuide: existing.projectGuide || "",
    designation: existing.designation || "",
    leaveAvailed: existing.leaveAvailed || "",
    completed: existing.completed || student.completedStatus || "",
  });
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => {
      const next = { ...current, [name]: value };
      if (name === "fromDate" || name === "trainingDuration") {
        next.toDate = addDurationToDate(
          name === "fromDate" ? value : current.fromDate,
          name === "trainingDuration" ? value : current.trainingDuration
        );
      }
      return next;
    });
    setMessage("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      const response = await saveTrainingManagement(student._id, form);
      onUpdated(response.student);
      setMessage(response.message);
    } catch (err) {
      setMessage(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="details-section">
      <div className="details-section__header">
        <h2>Training Management System</h2>
        <button className="admin-primary-btn" type="button" onClick={() => setOpen((value) => !value)}>
          Training Management System
        </button>
      </div>

      {open && (
        <form className="training-form" onSubmit={handleSubmit}>
          <label className="admin-field">
  <span>Student Name</span>
      <input
        name="studentName"
        value={form.studentName}
        onChange={handleChange}
      />
    </label>

    <label className="admin-field">
      <span>Course</span>
      <select
        name="courseName"
        value={form.courseName}
        onChange={handleChange}
      >
        <option value="">Select Course</option>
        {courseOptions.map((course) => (
          <option key={course} value={course}>
            {course}
          </option>
        ))}
      </select>
    </label>

    <label className="admin-field">
      <span>Course Year</span>
      <select
        name="courseYear"
        value={form.courseYear}
        onChange={handleChange}
      >
        <option value="">Select Year</option>
        {yearOptions.map((year) => (
          <option key={year} value={year}>
            {year}
          </option>
        ))}
      </select>
    </label>

    <label className="admin-field">
      <span>Branch</span>
      <select
        name="branch"
        value={form.branch}
        onChange={handleChange}
      >
        <option value="">Select Branch</option>
        {branchOptions.map((branch) => (
          <option key={branch} value={branch}>
            {branch}
          </option>
        ))}
      </select>
    </label>

    <label className="admin-field">
      <span>College Name</span>
      <input
        name="collegeName"
        value={form.collegeName}
        onChange={handleChange}
      />
    </label>

    <label className="admin-field">
      <span>College Location</span>
      <input
        name="collegeLocation"
        value={form.collegeLocation}
        onChange={handleChange}
      />
    </label>

    <label className="admin-field">
      <span>From Date</span>
      <input
        type="date"
        name="fromDate"
        value={form.fromDate}
        onChange={handleChange}
      />
    </label>

    <label className="admin-field">
      <span>To Date</span>
      <input
        type="date"
        name="toDate"
        value={form.toDate}
        readOnly
      />
    </label>

    <label className="admin-field training-form__project-title">
      <span>Project Title</span>
      <input
        name="projectTitle"
        value={form.projectTitle}
        onChange={handleChange}
      />
    </label>

    <label className="admin-field">
      <span>Project Guide</span>
      <input
        name="projectGuide"
        value={form.projectGuide}
        onChange={handleChange}
      />
    </label>

    <label className="admin-field">
      <span>Designation</span>
      <input
        name="designation"
        value={form.designation}
        onChange={handleChange}
      />
    </label>

    <label className="admin-field">
      <span>Leave Availed</span>
      <input
        name="leaveAvailed"
        value={form.leaveAvailed}
        onChange={handleChange}
      />
    </label>

          <label className="admin-field">
            <span>Training Duration</span>
            <select name="trainingDuration" value={form.trainingDuration} onChange={handleChange}>
              <option value="">Select duration</option>
              {trainingDurationOptions.map((duration) => <option key={duration} value={duration}>{duration}</option>)}
            </select>
          </label>

          {[
            ["joined", "Joined"],
            ["completed", "Completed"],
          ].map(([name, label]) => (
            <label className="admin-field" key={name}>
              <span>{label}</span>
              <select name={name} value={form[name]} onChange={handleChange}>
                <option value="">Select</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </label>
          ))}

          <button className="admin-primary-btn" type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </button>
          {message && <p className="admin-muted">{message}</p>}
        </form>
      )}
    </section>
  );
}

function StudentDetails({ id }) {
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [letterFile, setLetterFile] = useState(null);
  const [letterBusy, setLetterBusy] = useState("");
  const [error, setError] = useState("");
  const [letterError, setLetterError] = useState("");

  useEffect(() => {
    let ignore = false;

    async function loadStudent() {
      setLoading(true);
      setError("");

      try {
        const response = await fetchAdminStudent(id);
        if (!ignore) setStudent(response.student);
      } catch (err) {
        if (!ignore) setError(err.message);
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    loadStudent();

    return () => {
      ignore = true;
    };
  }, [id]);

  const goBack = () => {
    window.history.pushState({}, "", "/admin/dashboard");
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  const openOfferLetterPreview = () => {
    window.history.pushState({}, "", `/admin/students/${id}/offer-letter`);
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  const handleGenerateOfferLetter = async () => {
    setLetterBusy("generate");
    setLetterError("");

    try {
      const response = await generateOfferLetter(id);
      setStudent(response.student);
      openOfferLetterPreview();
    } catch (err) {
      setLetterError(err.message);
    } finally {
      setLetterBusy("");
    }
  };

  const handleUploadOfferLetter = async (event) => {
    event.preventDefault();

    if (!letterFile) {
      setLetterError("Select the official Offer Letter PDF.");
      return;
    }

    setLetterBusy("upload");
    setLetterError("");

    try {
      const response = await uploadOfferLetterPdf(id, letterFile);
      setStudent(response.student);
      openOfferLetterPreview();
    } catch (err) {
      setLetterError(err.message);
    } finally {
      setLetterBusy("");
    }
  };

  if (loading) {
    return (
      <main className="admin-console admin-shell">
        <div className="admin-loading">Loading student details...</div>
      </main>
    );
  }

  if (error || !student) {
    return (
      <main className="admin-console admin-shell">
        <button className="admin-secondary-btn" type="button" onClick={goBack}>
          Back
        </button>
        <p className="admin-error">{error || "Student not found."}</p>
      </main>
    );
  }

  return (
    <main className="admin-console admin-shell">
      <header className="admin-topbar">
        <div>
          <p className="portal-eyebrow">Student Details</p>
          <h1>{student.name}</h1>
          <div className="student-status-line">
            <StatusBadge value={student.status} />
            <span>{student.email}</span>
          </div>
        </div>
        <button className="admin-secondary-btn" type="button" onClick={goBack}>
          Back to Dashboard
        </button>
      </header>

      <DetailGrid
        title="Personal Details"
        rows={[
          ["Name", student.name],
          ["Date of Birth", student.dob],
          ["Gender", student.gender],
          ["Phone Number", student.phone],
          ["Email", student.email],
        ]}
      />

      <DetailGrid
        title="Academic Details"
        rows={[
          ["College / University", student.collegeName],
          ["College State", student.collegeState],
          ["College City", student.location],
          ["Branch", student.branch],
          ["Year", student.year],
          ["CGPA", student.cgpa],
          ["Course", student.course],
          ["College ID", student.collegeId],
        ]}
      />

      <DetailGrid
        title="Address Details"
        rows={[
          ["Current Address", student.currentAddress],
          ["Permanent Address", student.permanentAddress],
        ]}
      />

      <DetailGrid
        title="Parent / Guardian Details"
        rows={[
          ["Father / Guardian Name", student.fatherName],
          ["Father / Guardian Phone", student.fatherPhone],
          ["Father / Guardian Occupation", student.fatherOccupation],
        ]}
      />

      <DetailGrid
        title="Internship Details"
        rows={[
          ["Internship Duration", student.internshipDuration],
          ["Joining Month", student.internshipJoiningMonth || student.internshipJoiningDate],
          ["Permission Letter Number", student.permissionLetterNumber],
          ["Permission Letter Date", student.permissionLetterDate],
        ]}
      />

      <section className="details-section">
        <h2>Uploaded Documents</h2>
        <div className="document-actions">
        <DocumentButton label="Student Photo" file={student.photo} />
        <DocumentButton label="Resume" file={student.resume} />
        <DocumentButton label="Result" file={student.result} />
        <DocumentButton
          label="Permission Letter"
          file={student.permissionLetter}
  />

  <DocumentButton
    label="Completed Documents PDF"
    file={student.completedDocuments}
  />
</div>
      </section>

      {student.status === "Approved" && (
        <DetailGrid
          title="Approval and Offer Letter Details"
          rows={[
            ["Status", student.status],
            ["Approved Date", formatDate(student.approvedDate)],
            ["Reviewed By", student.reviewedBy],
            ["Reviewed At", formatDate(student.reviewedAt)],
            ["Offer Letter Uploaded Date", formatDate(student.offerLetterUploadedDate)],
            ["Offer Letter Sent Date", formatDate(student.offerLetterSentDate)],
            ["Offer Letter Status", student.offerLetterStatus],
            ["Student Email Address", student.email],
          ]}
        />
      )}

      {student.status === "Approved" && (
        <TrainingManagementForm student={student} onUpdated={setStudent} />
      )}

      {student.status === "Approved" && (
        <section className="offer-letter-box offer-letter-box--actions">
          <div>
            <h2>Offer Letter</h2>
            <p>Generate from the DRDO template or upload an official PDF, then review it before sending.</p>
          </div>

          <div className="offer-letter-actions">
            <button
              className="admin-primary-btn"
              disabled={letterBusy === "generate"}
              type="button"
              onClick={handleGenerateOfferLetter}
            >
              {letterBusy === "generate" ? "Generating..." : "Generate Offer Letter"}
            </button>

            {(student.offerLetter?.html || student.offerLetter?.url || student.offerLetterUrl) && (
              <button className="admin-secondary-btn" type="button" onClick={openOfferLetterPreview}>
                Preview Offer Letter
              </button>
            )}
          </div>

          <form className="offer-letter-upload-inline" onSubmit={handleUploadOfferLetter}>
            <label className="admin-field">
              <span>Upload Offer Letter PDF</span>
              <input
                accept="application/pdf"
                type="file"
                onChange={(event) => setLetterFile(event.target.files?.[0] || null)}
              />
            </label>
            <button className="admin-secondary-btn" disabled={letterBusy === "upload"} type="submit">
              {letterBusy === "upload" ? "Uploading..." : "Upload Offer Letter"}
            </button>
          </form>

          {letterError && <p className="admin-error">{letterError}</p>}
        </section>
      )}

      <AdminReviewForm student={student} onUpdated={setStudent} />
    </main>
  );
}

export default StudentDetails;

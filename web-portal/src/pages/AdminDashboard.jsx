import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import DashboardCards from "../components/Admin/DashboardCards";
import FilterBar from "../components/Admin/FilterBar";
import SearchBar from "../components/Admin/SearchBar";
import SortControls from "../components/Admin/SortControls";
import StudentTable from "../components/Admin/StudentTable";
import {
  clearAdminToken,
  deleteAdminStudents,
  downloadCertificates,
  fetchAdminStudents,
  updateStudentReview,
} from "../services/adminService";
import { createGyapanPreview, generateGyapanPdf } from "../services/gyapanService";
import { getUploadUrl } from "../utils/uploadUrl";
import { useAdminAuth } from "../auth/useAdminAuth";
import StudentForm from "../components/Form/StudentForm";
import StudentDetails from "./StudentDetails";
import "../styles/admin.css";

const initialFilters = {
  collegeName: "",
  branch: "",
  year: "",
  status: "",
  registrationDate: "",
};
const CERTIFICATE_DOWNLOADS_KEY = "drdoCertificateDownloadedStudentIds";

function savedCertificateDownloadIds() {
  try {
    const value = JSON.parse(localStorage.getItem(CERTIFICATE_DOWNLOADS_KEY) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function getInitialView() {
  const path = window.location.pathname;
  if (path.startsWith("/admin/student-management/new")) {
    return "student-management-new";
  }
  if (path.startsWith("/admin/student-management/")) {
    return "student-management-details";
  }
  if (path.startsWith("/admin/student-management")) {
    return "student-management";
  }
  if (path.startsWith("/admin/approved-students")) {
    return "approved-students";
  }
  if (path.startsWith("/admin/administration")) {
    return "administration";
  }
  return "home";
}

function AdminDashboard() {
  const { admin } = useAdminAuth();
  const isMainAdmin = admin?.role === "MAIN_ADMIN";
  
  // Navigation & Workflow States
  const [currentView, setCurrentView] = useState(getInitialView);
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [showLeftPanel, setShowLeftPanel] = useState(false);
  const [isDetailsDirty, setIsDetailsDirty] = useState(false);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [saveTrigger, setSaveTrigger] = useState(0);

  // Original Table & Data States
  const [students, setStudents] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [summary, setSummary] = useState({});
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState(() => {
    const path = window.location.pathname;
    if (path.startsWith("/admin/approved-students")) {
      return { ...initialFilters, status: "Approved" };
    }
    return initialFilters;
  });
  const [sort, setSort] = useState({ sortBy: "submittedAt", sortOrder: "desc" });
  const [loading, setLoading] = useState(true);
  const [deleteMode, setDeleteMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [error, setError] = useState("");
  const [documentModal, setDocumentModal] = useState(null);
  const [documentSelectedIds, setDocumentSelectedIds] = useState([]);
  const [documentBusy, setDocumentBusy] = useState(false);
  const [documentError, setDocumentError] = useState("");
  const [documentSearch, setDocumentSearch] = useState("");
  const [documentQueue, setDocumentQueue] = useState([]);
  const [documentIndex, setDocumentIndex] = useState(0);
  const [certificatePreview, setCertificatePreview] = useState(null);
  const [certificateDownloadedIds, setCertificateDownloadedIds] = useState(savedCertificateDownloadIds);

  // Inline status dropdown confirmation state (Student Management only)
  const [statusConfirm, setStatusConfirm] = useState(null); // { studentId, oldStatus, newStatus }
  const [statusUpdating, setStatusUpdating] = useState(null); // studentId being updated

  const query = useMemo(
    () => ({
      search,
      ...filters,
      ...sort,
    }),
    [filters, search, sort]
  );

  // Original load effects
  useEffect(() => {
    let ignore = false;

    async function loadStudents() {
      setLoading(true);
      setError("");

      try {
        const response = await fetchAdminStudents(query);
        if (ignore) return;
        setStudents(response.students);
        setSummary(response.summary);
        setSelectedIds([]);
      } catch (err) {
        if (err.message.toLowerCase().includes("token")) {
          clearAdminToken();
          window.history.pushState({}, "", "/admin/login");
          window.dispatchEvent(new PopStateEvent("popstate"));
          return;
        }

        setError(err.message);
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    loadStudents();

    return () => {
      ignore = true;
    };
  }, [query]);

  // Load all students for local search/filters/options in Student Management
  const loadAll = async () => {
    try {
      const response = await fetchAdminStudents({
        sortBy: "submittedAt",
        sortOrder: "desc",
      });
      setAllStudents(response.students);
    } catch {
      setAllStudents([]);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    const handlePop = () => {
      setCurrentView(getInitialView());
    };
    window.addEventListener("popstate", handlePop);
    return () => window.removeEventListener("popstate", handlePop);
  }, []);

  // Intercept beforeunload events if details form is dirty
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isDetailsDirty) {
        e.preventDefault();
        e.returnValue = "You have unsaved changes. Do you want to leave?";
        return e.returnValue;
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDetailsDirty]);

  // View transition checks
  const handleSwitchViewWithCheck = (nextView) => {
    if (isDetailsDirty) {
      setPendingAction({ type: "switch-view", payload: nextView });
      setShowUnsavedModal(true);
    } else {
      let dest = "/admin/dashboard";
      if (nextView === "student-management") {
        dest = "/admin/student-management";
      } else if (nextView === "approved-students") {
        dest = "/admin/approved-students";
        setFilters({ ...initialFilters, status: "Approved" });
      } else if (nextView === "administration") {
        dest = "/admin/administration";
      } else {
        setFilters(initialFilters);
      }
      window.history.pushState({}, "", dest);
      window.dispatchEvent(new PopStateEvent("popstate"));
      setCurrentView(nextView);
    }
  };

  const handleGoHomeWithCheck = () => {
    if (isDetailsDirty) {
      setPendingAction({ type: "go-home" });
      setShowUnsavedModal(true);
    } else {
      window.history.pushState({}, "", "/admin/dashboard");
      window.dispatchEvent(new PopStateEvent("popstate"));
      setCurrentView("home");
    }
  };

  const handleSelectStudentWithCheck = (studentId) => {
    if (isDetailsDirty) {
      setPendingAction({ type: "select-student", payload: studentId });
      setShowUnsavedModal(true);
    } else {
      window.history.pushState({}, "", `/admin/student-management/${studentId}`);
      window.dispatchEvent(new PopStateEvent("popstate"));
    }
  };

  const handleGoToRegistrationWithCheck = () => {
    if (isDetailsDirty) {
      setPendingAction({ type: "go-registration" });
      setShowUnsavedModal(true);
    } else {
      window.history.pushState({}, "", "/admin/student-management/new");
      window.dispatchEvent(new PopStateEvent("popstate"));
    }
  };

  const handleCloseRegistrationForm = useCallback((registrationSuccess) => {
    window.history.pushState({}, "", "/admin/student-management");
    window.dispatchEvent(new PopStateEvent("popstate"));
    if (registrationSuccess) {
      loadAll();
      fetchAdminStudents(query).then((response) => {
        setStudents(response.students);
        setSummary(response.summary);
      }).catch(() => {});
    }
  }, [query]);

  const executePendingAction = (action = pendingAction) => {
    if (!action) return;

    if (action.type === "select-student") {
      window.history.pushState({}, "", `/admin/student-management/${action.payload}`);
      window.dispatchEvent(new PopStateEvent("popstate"));
    } else if (action.type === "go-registration") {
      window.history.pushState({}, "", "/admin/student-management/new");
      window.dispatchEvent(new PopStateEvent("popstate"));
    } else if (action.type === "go-home") {
      window.history.pushState({}, "", "/admin/dashboard");
      window.dispatchEvent(new PopStateEvent("popstate"));
      setCurrentView("home");
    } else if (action.type === "switch-view") {
      let dest = "/admin/dashboard";
      if (action.payload === "student-management") {
        dest = "/admin/student-management";
      } else if (action.payload === "approved-students") {
        dest = "/admin/approved-students";
        setFilters({ ...initialFilters, status: "Approved" });
      } else if (action.payload === "administration") {
        dest = "/admin/administration";
      } else {
        setFilters(initialFilters);
      }
      window.history.pushState({}, "", dest);
      window.dispatchEvent(new PopStateEvent("popstate"));
      setCurrentView(action.payload);
    }

    setPendingAction(null);
    setShowUnsavedModal(false);
  };

  // Callback successes from StudentDetails
  const handleSaveSuccess = (updatedStudent) => {
    setAllStudents(current => current.map(s => s._id === updatedStudent._id ? updatedStudent : s));
    setStudents(current => current.map(s => s._id === updatedStudent._id ? updatedStudent : s));
    setIsDetailsDirty(false);
    if (pendingAction) {
      executePendingAction();
    }
  };

  const handleSaveFailure = (errMsg) => {
    setPendingAction(null);
    setShowUnsavedModal(false);
  };

  const handleDeleteSuccess = (deletedId) => {
    setAllStudents(current => current.filter(s => s._id !== deletedId));
    setStudents(current => current.filter(s => s._id !== deletedId));
    setSelectedStudentId(null);
    setIsDetailsDirty(false);
    if (pendingAction) {
      executePendingAction();
    }
  };

  const handleLogout = useCallback(() => {
    clearAdminToken();
    window.history.pushState({}, "", "/admin/login");
    window.dispatchEvent(new PopStateEvent("popstate"));
  }, []);

  const openStudent = useCallback((id) => {
    window.history.pushState({}, "", `/admin/students/${id}`);
    window.dispatchEvent(new PopStateEvent("popstate"));
  }, []);

  const toggleApprovedStudents = useCallback(() => {
    setFilters((current) => ({
      ...current,
      status: current.status === "Approved" ? "" : "Approved",
    }));
  }, []);

  const openDocumentModal = useCallback((type) => {
    setDocumentModal(type);
    setDocumentSelectedIds([]);
    setDocumentSearch("");
    setDocumentError("");
    setDocumentQueue([]);
    setDocumentIndex(0);
    if (certificatePreview?.url) URL.revokeObjectURL(certificatePreview.url);
    setCertificatePreview(null);
  }, [certificatePreview]);

  const closeDocumentModal = useCallback(() => {
    if (certificatePreview?.url) URL.revokeObjectURL(certificatePreview.url);
    setDocumentModal(null);
    setDocumentQueue([]);
    setCertificatePreview(null);
    setDocumentError("");
  }, [certificatePreview]);

  const documentStudents = useMemo(() => allStudents.filter((student) => student.status === "Approved").filter((student) => {
    const term = documentSearch.trim().toLowerCase();
    return !term || [student.name, student.referenceId, student.collegeName, student.branch, student.course].some((value) => String(value || "").toLowerCase().includes(term));
  }), [allStudents, documentSearch]);

  const toggleDocumentStudent = useCallback((id, checked) => setDocumentSelectedIds((current) => checked ? [...new Set([...current, id])] : current.filter((value) => value !== id)), []);
  const selectAllDocumentStudents = useCallback(() => setDocumentSelectedIds(documentStudents.map((student) => student._id)), [documentStudents]);

  const startDocumentGeneration = useCallback(async () => {
    if (!documentSelectedIds.length) return setDocumentError("Select at least one student.");
    setDocumentBusy(true); setDocumentError("");
    try {
      if (documentModal === "ism") {
        const groups = documentSelectedIds.reduce((result, id) => {
          const student = allStudents.find((item) => item._id === id);
          const division = student?.trainingManagement?.division?.trim();
          if (!division) throw new Error("Every selected student needs an allocated division before an ISM can be generated.");
          (result[division] ||= []).push(id);
          return result;
        }, {});
        const generated = [];
        for (const ids of Object.values(groups)) generated.push(await createGyapanPreview({ ids }));
        setDocumentQueue(generated);
      } else {
        setDocumentQueue(documentSelectedIds.map((id) => ({ student: allStudents.find((item) => item._id === id) })));
      }
      setDocumentIndex(0);
    } catch (err) { setDocumentError(err.message); }
    finally { setDocumentBusy(false); }
  }, [allStudents, documentModal, documentSelectedIds]);

  const prepareCertificate = useCallback(async () => {
    const student = documentQueue[documentIndex]?.student;
    if (!student) return;
    setDocumentBusy(true); setDocumentError("");
    try {
      const { blob, filename } = await downloadCertificates([student._id]);
      setCertificatePreview({ url: URL.createObjectURL(blob), filename });
    } catch (err) { setDocumentError(`Unable to generate certificate for ${student.name}.`); }
    finally { setDocumentBusy(false); }
  }, [documentIndex, documentQueue]);

  const downloadCertificate = useCallback(() => {
    if (!certificatePreview) return;
    const link = document.createElement("a");
    link.href = certificatePreview.url;
    link.download = certificatePreview.filename;
    link.click();
    const studentId = documentQueue[documentIndex]?.student?._id;
    if (studentId) {
      setCertificateDownloadedIds((current) => {
        const next = [...new Set([...current, studentId])];
        localStorage.setItem(CERTIFICATE_DOWNLOADS_KEY, JSON.stringify(next));
        return next;
      });
    }
  }, [certificatePreview, documentIndex, documentQueue]);

  const downloadIsm = useCallback(async () => {
    const item = documentQueue[documentIndex];
    if (!item?.gyapan?._id) return;
    setDocumentBusy(true); setDocumentError("");
    try {
      const result = await generateGyapanPdf(item.gyapan._id);
      const response = await fetch(getUploadUrl(result.pdfUrl));
      const blob = await response.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `Gyapan-${item.gyapan.letterNumber || item.gyapan._id}.pdf`;
      link.click();
      URL.revokeObjectURL(link.href);
    } catch (err) { setDocumentError(err.message || "Unable to download ISM."); }
    finally { setDocumentBusy(false); }
  }, [documentIndex, documentQueue]);
  const openAdministration = useCallback(() => {
    window.history.pushState({}, "", "/admin/system-configuration");
    window.dispatchEvent(new PopStateEvent("popstate"));
  }, []);
  const openCollegeManagement = useCallback(() => {
    window.history.pushState({}, "", "/admin/management");
    window.dispatchEvent(new PopStateEvent("popstate"));
  }, []);
  const openProfile = useCallback(() => {
    window.history.pushState({}, "", "/admin/profile");
    window.dispatchEvent(new PopStateEvent("popstate"));
  }, []);

  const toggleSelected = useCallback((id, checked) => {
    setSelectedIds((current) =>
      checked ? [...current, id] : current.filter((value) => value !== id)
    );
  }, []);

  const toggleDeleteMode = useCallback(() => {
    setDeleteMode((current) => {
      if (current) setSelectedIds([]);
      return !current;
    });
  }, []);

  const deleteSelected = useCallback(async () => {
    if (!selectedIds.length) {
      setError("Select one or more registrations to delete.");
      return;
    }
    if (!window.confirm("Are you sure you want to delete selected student(s)?\nThis action cannot be undone.")) return;

    try {
      await deleteAdminStudents(selectedIds);
      const response = await fetchAdminStudents(query);
      setStudents(response.students);
      setSummary(response.summary);
      setAllStudents(response.students);
      setSelectedIds([]);
      setDeleteMode(false);
    } catch (err) {
      setError(err.message);
    }
  }, [selectedIds, query]);

  const handleStatusChange = useCallback((id, updatedStudent) => {
    setAllStudents((current) =>
      current.map((s) => (s._id === id ? { ...s, ...updatedStudent } : s))
    );
    setStudents((current) =>
      current.map((s) => (s._id === id ? { ...s, ...updatedStudent } : s))
    );
  }, []);

  // Student Management Client-side Filter Options
  const collegesList = useMemo(() => {
    return [...new Set(allStudents.map(s => s.collegeName).filter(Boolean))].sort();
  }, [allStudents]);

  const courseList = useMemo(() => {
    return [...new Set(allStudents.map(s => s.course).filter(Boolean))].sort();
  }, [allStudents]);

  const branchList = useMemo(() => {
    return [...new Set(allStudents.map(s => s.branch).filter(Boolean))].sort();
  }, [allStudents]);

  const yearList = useMemo(() => {
    return [...new Set(allStudents.map(s => s.year).filter(Boolean))].sort();
  }, [allStudents]);

  const filteredStudents = useMemo(() => {
    return allStudents.filter((student) => {
      if (search.trim()) {
        const term = search.toLowerCase();
        const matchesSearch =
          student.name?.toLowerCase().includes(term) ||
          student.referenceId?.toLowerCase().includes(term) ||
          student.email?.toLowerCase().includes(term) ||
          student.phone?.toLowerCase().includes(term) ||
          student.collegeName?.toLowerCase().includes(term);
        if (!matchesSearch) return false;
      }
      return true;
    });
  }, [allStudents, search]);

  const sortedStudents = useMemo(() => {
    const list = [...filteredStudents];
    if (sort.sortBy) {
      list.sort((a, b) => {
        let left = a[sort.sortBy] || "";
        let right = b[sort.sortBy] || "";
        if (sort.sortBy === "college") {
          left = a.collegeName || "";
          right = b.collegeName || "";
        }
        if (sort.sortBy === "name") {
          left = a.name || "";
          right = b.name || "";
        }
        if (typeof left === "string") left = left.toLowerCase();
        if (typeof right === "string") right = right.toLowerCase();
        if (left < right) return sort.sortOrder === "asc" ? -1 : 1;
        if (left > right) return sort.sortOrder === "asc" ? 1 : -1;
        return 0;
      });
    }
    return list;
  }, [filteredStudents, sort]);

  // --- Inline Status Dropdown (Student Management only) ---
  const STATUS_COLORS = {
    Pending:  { background: "#fef9c3", color: "#854d0e", border: "#fde68a" },
    Approved: { background: "#dcfce7", color: "#14532d", border: "#86efac" },
    Rejected: { background: "#fee2e2", color: "#7f1d1d", border: "#fca5a5" },
  };

  const handleStatusDropdownChange = (e, student) => {
    e.stopPropagation();
    const newStatus = e.target.value;
    if (newStatus === student.status) return;
    setStatusConfirm({ studentId: student._id, oldStatus: student.status, newStatus });
  };

  const confirmStatusChange = async () => {
    if (!statusConfirm) return;
    const { studentId, newStatus } = statusConfirm;
    setStatusUpdating(studentId);
    setStatusConfirm(null);
    try {
      await updateStudentReview(studentId, { status: newStatus });
      // Update allStudents in-place so the row refreshes immediately
      setAllStudents(prev =>
        prev.map(s => s._id === studentId ? { ...s, status: newStatus } : s)
      );
    } catch (err) {
      alert("Failed to update status: " + (err.message || "Unknown error"));
    } finally {
      setStatusUpdating(null);
    }
  };

  const handleSortClick = (field) => {
    setSort((prev) => {
      const order = prev.sortBy === field && prev.sortOrder === "asc" ? "desc" : "asc";
      return { sortBy: field, sortOrder: order };
    });
  };

  return (
    <main className="admin-console admin-shell">
      {/* Dynamic Header */}
      <header className="admin-topbar">
        <div>
          <p className="portal-eyebrow">Admin Panel</p>
          <h1>
            {currentView === "home" && "Dashboard Home"}
            {currentView === "student-management" && "Student Management"}
            {currentView === "approved-students" && "Approved Students"}
            {currentView === "administration" && "Administration Options"}
          </h1>
        </div>
        <div className="admin-topbar__actions">
          {currentView === "approved-students" && (
            <button className="admin-secondary-btn" type="button" onClick={openAdministration}>
              System Configurations
            </button>
          )}
          {currentView !== "home" && (
            <button className="admin-secondary-btn" type="button" onClick={handleGoHomeWithCheck}>
              🏠 Home
            </button>
          )}
          <button className="admin-secondary-btn" type="button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      {/* VIEW 1: Home View */}
      {currentView === "home" && (
        <div className="admin-dashboard-home-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "24px", marginTop: "40px" }}>
          <div className="admin-summary-card admin-summary-card--interactive" onClick={() => handleSwitchViewWithCheck("student-management")} style={{ cursor: "pointer", padding: "32px", display: "flex", flexDirection: "column", gap: "12px", borderRadius: "12px", border: "1px solid var(--border-color, #e2e8f0)", transition: "transform 0.2s, box-shadow 0.2s" }}>
            <h2 style={{ margin: 0, fontSize: "1.5rem", color: "var(--primary)" }}>📋 Student Management</h2>
            <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.95rem" }}>Register new students and manage student files, statuses, and profiles.</p>
          </div>
          <div className="admin-summary-card admin-summary-card--interactive" onClick={() => handleSwitchViewWithCheck("approved-students")} style={{ cursor: "pointer", padding: "32px", display: "flex", flexDirection: "column", gap: "12px", borderRadius: "12px", border: "1px solid var(--border-color, #e2e8f0)", transition: "transform 0.2s, box-shadow 0.2s" }}>
            <h2 style={{ margin: 0, fontSize: "1.5rem", color: "var(--primary)" }}>✅ Approved Students</h2>
            <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.95rem" }}>Generate offer letters, print completion certificates, and verify joining details.</p>
          </div>
          <div className="admin-summary-card admin-summary-card--interactive" onClick={() => handleSwitchViewWithCheck("administration")} style={{ cursor: "pointer", padding: "32px", display: "flex", flexDirection: "column", gap: "12px", borderRadius: "12px", border: "1px solid var(--border-color, #e2e8f0)", transition: "transform 0.2s, box-shadow 0.2s" }}>
            <h2 style={{ margin: 0, fontSize: "1.5rem", color: "var(--primary)" }}>⚙️ Administration</h2>
            <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.95rem" }}>Manage divisions, system configurations, list colleges, and edit admin profile.</p>
          </div>
        </div>
      )}

      {/* VIEW 2: Student Management (Split view) */}
      {/* VIEW 2: Student Management (Default List page) */}
      {currentView === "student-management" && (
        <div className="admin-split-layout" style={{ width: "100%", display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h2 style={{ margin: 0 }}>Registered Students</h2>
            <button
              className="admin-primary-btn"
              type="button"
              onClick={() => {
                window.history.pushState({}, "", "/admin/student-management/new");
                window.dispatchEvent(new PopStateEvent("popstate"));
              }}
              style={{ display: "inline-flex", alignItems: "center", gap: "6px", height: "36px", padding: "0 16px" }}
            >
              + New Student
            </button>
          </div>
          
          {/* Local Search and Filters */}
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "16px" }}>
            <input
              type="text"
              placeholder="Search by Name, Reference ID, Email, Phone, College Name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ flex: "1 1 100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid var(--border-color, #cbd5e1)" }}
            />
          </div>

          {/* Counts */}
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px", fontSize: "0.9rem", color: "var(--text-muted)" }}>
            <span>Total Students : <strong>{allStudents.length}</strong></span>
            <span>Showing : <strong>{sortedStudents.length}</strong></span>
          </div>

          {/* Sorting List Table */}
          <div className="admin-table-wrap" style={{ overflowX: "hidden" }}>
            <table className="admin-table" style={{ tableLayout: "fixed", width: "100%" }}>
              <thead>
                <tr>
                  <th style={{ cursor: "pointer", width: "25%", whiteSpace: "normal", wordBreak: "break-word" }} onClick={() => handleSortClick("name")}>
                    Name {sort.sortBy === "name" && (sort.sortOrder === "asc" ? "▲" : "▼")}
                  </th>
                  <th style={{ cursor: "pointer", width: "22%", whiteSpace: "normal", wordBreak: "break-word" }} onClick={() => handleSortClick("course")}>
                    Course {sort.sortBy === "course" && (sort.sortOrder === "asc" ? "▲" : "▼")}
                  </th>
                  <th style={{ cursor: "pointer", width: "25%", whiteSpace: "normal", wordBreak: "break-word" }} onClick={() => handleSortClick("branch")}>
                    Branch {sort.sortBy === "branch" && (sort.sortOrder === "asc" ? "▲" : "▼")}
                  </th>
                  <th style={{ cursor: "pointer", width: "10%", whiteSpace: "normal", wordBreak: "break-word" }} onClick={() => handleSortClick("year")}>
                    Year {sort.sortBy === "year" && (sort.sortOrder === "asc" ? "▲" : "▼")}
                  </th>
                  <th style={{ cursor: "pointer", width: "20%", whiteSpace: "normal", wordBreak: "break-word" }} onClick={() => handleSortClick("collegeName")}>
                    College Name {sort.sortBy === "collegeName" && (sort.sortOrder === "asc" ? "▲" : "▼")}
                  </th>
                  <th style={{ cursor: "pointer", width: "10%", whiteSpace: "normal", wordBreak: "break-word" }} onClick={() => handleSortClick("status")}>
                    Status {sort.sortBy === "status" && (sort.sortOrder === "asc" ? "▲" : "▼")}
                  </th>
                  <th style={{ width: "8%" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {sortedStudents.map((student) => (
                  <tr
                    key={student._id}
                    className={certificateDownloadedIds.includes(student._id) ? "certificate-downloaded-row" : ""}
                    style={{ cursor: "pointer" }}
                    onClick={() => handleSelectStudentWithCheck(student._id)}
                  >
                    <td style={{ whiteSpace: "normal", wordBreak: "break-word" }}>{student.name}</td>
                    <td style={{ whiteSpace: "normal", wordBreak: "break-word" }}>{student.course}</td>
                    <td style={{ whiteSpace: "normal", wordBreak: "break-word" }}>{student.branch}</td>
                    <td style={{ whiteSpace: "normal", wordBreak: "break-word" }}>{student.year}</td>
                    <td style={{ whiteSpace: "normal", wordBreak: "break-word" }}>{student.collegeName || "-"}</td>
                    <td style={{ whiteSpace: "normal", wordBreak: "break-word", verticalAlign: "middle" }}
                        onClick={e => e.stopPropagation()}>
                      <select
                        value={student.status}
                        disabled={statusUpdating === student._id}
                        onChange={(e) => handleStatusDropdownChange(e, student)}
                        style={{
                          ...STATUS_COLORS[student.status],
                          border: `1px solid ${STATUS_COLORS[student.status]?.border || "#cbd5e1"}`,
                          borderRadius: "6px",
                          padding: "3px 6px",
                          fontSize: "0.8rem",
                          fontWeight: "600",
                          cursor: statusUpdating === student._id ? "wait" : "pointer",
                          width: "100%",
                          appearance: "auto",
                        }}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Approved">Approved</option>
                        <option value="Rejected">Rejected</option>
                      </select>
                    </td>
                    <td>
                      <button
                        className="admin-secondary-btn admin-table-action"
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectStudentWithCheck(student._id);
                        }}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
                {sortedStudents.length === 0 && (
                  <tr>
                    <td colSpan="7" style={{ textAlign: "center", padding: "24px", color: "var(--text-muted)" }}>
                      No registrations found matching the filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 2b: Student Registration (100% width) */}
      {currentView === "student-management-new" && (
        <div style={{ width: "100%", padding: "16px 0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
            <h2 style={{ margin: 0 }}>New Student Registration</h2>
            <button
              className="admin-secondary-btn"
              type="button"
              onClick={() => {
                window.history.pushState({}, "", "/admin/student-management");
                window.dispatchEvent(new PopStateEvent("popstate"));
              }}
              style={{ height: "36px", padding: "0 16px", minWidth: "220px" }}
            >
              Back to Student Management
            </button>
          </div>
          <StudentForm
            embedded={true}
            onClose={handleCloseRegistrationForm}
          />
        </div>
      )}

      {/* VIEW 2c: Student Details (100% width) */}
      {currentView === "student-management-details" && (
        <div style={{ width: "100%" }}>
          <StudentDetails
            id={window.location.pathname.split("/").pop()}
            onClose={() => {
              window.history.pushState({}, "", "/admin/student-management");
              window.dispatchEvent(new PopStateEvent("popstate"));
            }}
            inSplitView={false}
            source="management"
            onDirtyChange={setIsDetailsDirty}
            saveTrigger={saveTrigger}
            onSaveSuccess={handleSaveSuccess}
            onSaveFailure={handleSaveFailure}
            onDeleteSuccess={handleDeleteSuccess}
          />
        </div>
      )}

      {/* VIEW 3: Approved Students View (Original application table) */}
      {currentView === "approved-students" && (
        <>
          <DashboardCards summary={summary} />

          <section className="admin-panel" style={{ marginTop: "24px" }}>
            <div className="admin-panel__header">
              <SearchBar value={search} onChange={setSearch} />
              <SortControls sort={sort} onChange={setSort} />
            </div>

            <div className="admin-actions-row">
              <button className="admin-secondary-btn" type="button" onClick={toggleApprovedStudents}>
                {filters.status === "Approved" ? "All Students" : "Approved Students"}
              </button>
              <button className="admin-secondary-btn" type="button" onClick={() => openDocumentModal("certificate")}>
                Generate Certificate
              </button>
              <button className="admin-secondary-btn" type="button" onClick={() => openDocumentModal("ism")}>
                Generate ISM
              </button>
              <button
                className="admin-danger-btn"
                type="button"
                onClick={toggleDeleteMode}
              >
                {deleteMode ? "Cancel Delete" : "Delete Entry"}
              </button>
              {deleteMode && (
                <button className="admin-danger-btn" type="button" onClick={deleteSelected}>
                  Delete Selected
                </button>
              )}
            </div>

            <FilterBar
              filters={filters}
              onChange={setFilters}
              students={allStudents}
            />

            {error && <p className="admin-error">{error}</p>}
            {loading ? (
              <div className="admin-loading">Loading applications...</div>
            ) : (
              <StudentTable
                deleteMode={deleteMode}
                onSelect={toggleSelected}
                onView={openStudent}
                selectedIds={selectedIds}
                students={students}
                onStatusChange={handleStatusChange}
              />
            )}
          </section>
          
          {documentModal && (() => {
            const currentDocument = documentQueue[documentIndex];
            const selectionOpen = documentQueue.length === 0;
            const allDocumentStudentsSelected = documentStudents.length > 0 && documentStudents.every((student) => documentSelectedIds.includes(student._id));
            const moveNext = () => {
              if (certificatePreview?.url) URL.revokeObjectURL(certificatePreview.url);
              setCertificatePreview(null);
              if (documentIndex + 1 >= documentQueue.length) closeDocumentModal();
              else setDocumentIndex((index) => index + 1);
            };
            const printDocument = () => documentModal === "certificate"
              ? document.getElementById("dashboard-certificate-preview")?.contentWindow?.print()
              : document.getElementById("dashboard-ism-preview")?.contentWindow?.print();
            return <div className="certificate-modal-backdrop" role="dialog" aria-modal="true" aria-label={`Generate ${documentModal === "ism" ? "ISM" : "Certificate"}`}>
              <section className="certificate-modal certificate-modal--wide">
                {selectionOpen ? <>
                  <h2>Generate {documentModal === "ism" ? "ISM" : "Certificate"}</h2>
                  <p className="admin-muted">Select approved students, then generate {documentModal === "ism" ? "ISM documents grouped by division" : "one certificate for each student"}.</p>
                  <div className="admin-actions-row"><label className="admin-field"><span>Search Students</span><input type="search" placeholder="Student name or college name" value={documentSearch} onChange={(event) => setDocumentSearch(event.target.value)} /></label><button className="admin-secondary-btn" type="button" onClick={selectAllDocumentStudents}>Select All</button><button className="admin-secondary-btn" type="button" onClick={() => setDocumentSelectedIds([])}>Deselect All</button></div>
                  <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th><input type="checkbox" checked={allDocumentStudentsSelected} onChange={(event) => event.target.checked ? selectAllDocumentStudents() : setDocumentSelectedIds([])} /></th><th>Student Name</th><th>Reference ID</th><th>Division</th><th>College Name</th><th>Branch</th><th>Course</th></tr></thead><tbody>{documentStudents.map((student) => <tr key={student._id}><td><input type="checkbox" checked={documentSelectedIds.includes(student._id)} onChange={(event) => toggleDocumentStudent(student._id, event.target.checked)} aria-label={`Select ${student.name}`} /></td><td>{student.name}</td><td>{student.referenceId || "-"}</td><td>{student.trainingManagement?.division || "-"}</td><td>{student.trainingManagement?.collegeName || student.collegeName || "-"}</td><td>{student.trainingManagement?.branch || student.branch || "-"}</td><td>{student.trainingManagement?.courseName || student.course || "-"}</td></tr>)}</tbody></table>{!documentStudents.length && <div className="admin-empty-state">No approved students found.</div>}</div>
                  {documentError && <p className="admin-error">{documentError}</p>}
                  <div className="admin-actions-row"><button className="admin-primary-btn" type="button" disabled={documentBusy || !documentSelectedIds.length} onClick={startDocumentGeneration}>{documentBusy ? "Generating..." : "Generate"}</button><button className="admin-secondary-btn" type="button" disabled={documentBusy} onClick={closeDocumentModal}>Cancel</button></div>
                </> : <>
                  <h2>{documentModal === "ism" ? `ISM ${documentIndex + 1} of ${documentQueue.length}` : `Certificate ${documentIndex + 1} of ${documentQueue.length}`}</h2>
                  <p>{documentModal === "ism" ? `Division: ${currentDocument.gyapan.studentRows?.[0]?.division || "-"}` : <>Student: <strong>{currentDocument.student?.name}</strong></>}</p>
                  {documentModal === "ism" ? <iframe id="dashboard-ism-preview" title="ISM preview" className="certificate-preview-frame" srcDoc={currentDocument.html || "<p>Preview unavailable.</p>"} /> : certificatePreview ? <iframe id="dashboard-certificate-preview" title="Certificate preview" className="certificate-preview-frame" src={certificatePreview.url} /> : <p className="admin-muted">Prepare this certificate to preview, print, or download it.</p>}
                  {documentError && <p className="admin-error">{documentError}</p>}
                  <div className="admin-actions-row">{documentModal === "certificate" && !certificatePreview ? <button className="admin-primary-btn" type="button" disabled={documentBusy} onClick={prepareCertificate}>{documentBusy ? "Generating..." : "Preview Certificate"}</button> : <><button className="admin-secondary-btn" type="button" onClick={printDocument}>Print</button>{documentModal === "ism" ? <button className="admin-primary-btn" type="button" disabled={documentBusy} onClick={downloadIsm}>{documentBusy ? "Preparing..." : "Download"}</button> : <button className="admin-primary-btn" type="button" onClick={downloadCertificate}>Download</button>}<button className="admin-secondary-btn" type="button" onClick={moveNext}>{documentIndex + 1 === documentQueue.length ? "Finish" : "Next"}</button></>}<button className="admin-secondary-btn" type="button" disabled={documentBusy} onClick={closeDocumentModal}>Close</button></div>
                </>}
              </section>
            </div>;
          })()}
        </>
      )}

      {/* VIEW 4: Administration Module Groups */}
      {currentView === "administration" && (
        <div style={{ marginTop: "24px" }}>
          <h2 style={{ marginBottom: "20px" }}>System Administration Modules</h2>
          <div className="admin-dashboard-home-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "24px" }}>
            <div className="admin-summary-card admin-summary-card--interactive" onClick={openCollegeManagement} style={{ cursor: "pointer", padding: "28px", borderRadius: "12px", border: "1px solid var(--border-color, #e2e8f0)" }}>
              <h3 style={{ marginTop: 0, color: "var(--primary)" }}>🏫 College Management</h3>
              <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.9rem" }}>Register, edit, import, or remove registered college listings.</p>
            </div>
            {isMainAdmin && (
              <div className="admin-summary-card admin-summary-card--interactive" onClick={openProfile} style={{ cursor: "pointer", padding: "28px", borderRadius: "12px", border: "1px solid var(--border-color, #e2e8f0)" }}>
                <h3>👤 Admin Profile</h3>
                <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.9rem" }}>Manage sub-user passwords, configure login profiles, and access audit logs.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Unsaved Changes Premium Modal */}
      {showUnsavedModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          backgroundColor: "rgba(0, 0, 0, 0.4)",
          backdropFilter: "blur(4px)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 9999,
        }}>
          <div style={{
            backgroundColor: "#fff",
            padding: "32px",
            borderRadius: "12px",
            width: "420px",
            boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)",
            textAlign: "center",
          }}>
            <h3 style={{ marginTop: 0, fontSize: "1.4rem", color: "#e11d48", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
              ⚠️ Unsaved Changes
            </h3>
            <p style={{ margin: "16px 0", color: "#475569", lineHeight: "1.5" }}>
              You have unsaved changes. Do you want to Save, Discard, or Cancel?
            </p>
            <div style={{ display: "flex", justifyContent: "center", gap: "12px", marginTop: "24px" }}>
              <button
                className="admin-primary-btn"
                style={{ backgroundColor: "var(--primary)" }}
                onClick={() => {
                  setSaveTrigger(prev => prev + 1);
                }}
              >
                Save
              </button>
              <button
                className="admin-danger-btn"
                style={{ backgroundColor: "#e11d48", color: "#fff" }}
                onClick={() => {
                  setIsDetailsDirty(false);
                  executePendingAction();
                }}
              >
                Discard
              </button>
              <button
                className="admin-secondary-btn"
                onClick={() => {
                  setPendingAction(null);
                  setShowUnsavedModal(false);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Change Confirmation Modal (Student Management only) */}
      {statusConfirm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1100 }}>
          <div style={{ background: "#fff", borderRadius: "12px", padding: "32px", maxWidth: "420px", width: "90%", boxShadow: "0 20px 60px rgba(0,0,0,0.25)" }}>
            <h3 style={{ marginTop: 0, fontSize: "1.2rem", color: "#1e293b", display: "flex", alignItems: "center", gap: "8px" }}>✏️ Confirm Status Change</h3>
            <p style={{ margin: "16px 0", color: "#475569", lineHeight: "1.6" }}>
              Are you sure you want to change the status from{" "}
              <strong style={{ color: STATUS_COLORS[statusConfirm.oldStatus]?.color }}>{statusConfirm.oldStatus}</strong>
              {" "}to{" "}
              <strong style={{ color: STATUS_COLORS[statusConfirm.newStatus]?.color }}>{statusConfirm.newStatus}</strong>?
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "24px" }}>
              <button
                className="admin-secondary-btn"
                onClick={() => setStatusConfirm(null)}
              >
                No
              </button>
              <button
                className="admin-primary-btn"
                onClick={confirmStatusChange}
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default AdminDashboard;

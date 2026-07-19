import { useCallback, useEffect, useMemo, useState } from "react";
import DashboardCards from "../components/Admin/DashboardCards";
import FilterBar from "../components/Admin/FilterBar";
import SearchBar from "../components/Admin/SearchBar";
import SortControls from "../components/Admin/SortControls";
import StudentTable from "../components/Admin/StudentTable";
import {
  clearAdminToken,
  deleteAdminStudents,
  fetchAdminStudents,
} from "../services/adminService";
import "../styles/admin.css";

const initialFilters = {
  collegeName: "",
  branch: "",
  year: "",
  status: "",
  registrationDate: "",
};

function AdminDashboard() {
  const [students, setStudents] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [summary, setSummary] = useState({});
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState(initialFilters);
  const [sort, setSort] = useState({ sortBy: "submittedAt", sortOrder: "desc" });
  const [loading, setLoading] = useState(true);
  const [deleteMode, setDeleteMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [error, setError] = useState("");

  const query = useMemo(
    () => ({
      search,
      ...filters,
      ...sort,
    }),
    [filters, search, sort]
  );

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

  useEffect(() => {
    async function loadFilterOptions() {
      try {
        const response = await fetchAdminStudents({
          sortBy: "submittedAt",
          sortOrder: "desc",
        });
        setAllStudents(response.students);
      } catch {
        setAllStudents([]);
      }
    }

    loadFilterOptions();
  }, []);

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

  const openCertificates = useCallback(() => {
    window.history.pushState({}, "", "/admin/certificates");
    window.dispatchEvent(new PopStateEvent("popstate"));
  }, []);

  const openGyapan = useCallback(() => {
    window.history.pushState({}, "", "/admin/gyapan");
    window.dispatchEvent(new PopStateEvent("popstate"));
  }, []);

  const toggleSelected = useCallback((id, checked) => {
    setSelectedIds((current) =>
      checked ? [...current, id] : current.filter((value) => value !== id)
    );
  }, []);

  const deleteSelected = useCallback(async () => {
    if (!selectedIds.length) {
      setError("Select one or more registrations to delete.");
      return;
    }

    try {
      await deleteAdminStudents(selectedIds);
      const response = await fetchAdminStudents(query);
      setStudents(response.students);
      setSummary(response.summary);
      setSelectedIds([]);
      setDeleteMode(false);
    } catch (err) {
      setError(err.message);
    }
  }, [selectedIds, query]);

  return (
    <main className="admin-console admin-shell">
      <header className="admin-topbar">
        <div>
          <p className="portal-eyebrow">Admin Panel</p>
          <h1>Student Applications</h1>
        </div>
        <button className="admin-secondary-btn" type="button" onClick={handleLogout}>
          Logout
        </button>
      </header>

      <DashboardCards summary={summary} />

      <section className="admin-panel">
        <div className="admin-panel__header">
          <SearchBar value={search} onChange={setSearch} />
          <SortControls sort={sort} onChange={setSort} />
        </div>

        <div className="admin-actions-row">
          <button className="admin-secondary-btn" type="button" onClick={toggleApprovedStudents}>
            {filters.status === "Approved" ? "All Students" : "Approved Students"}
          </button>
          <button className="admin-secondary-btn" type="button" onClick={openCertificates}>
            Certificates
          </button>
          <button className="admin-secondary-btn" type="button" onClick={openGyapan}>
            Gyapan
          </button>
          <button
            className="admin-danger-btn"
            type="button"
            onClick={() => setDeleteMode((current) => !current)}
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
          />
        )}
      </section>
    </main>
  );
}

export default AdminDashboard;

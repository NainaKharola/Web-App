import { useState } from "react";
import { loginAdmin, setAdminToken } from "../services/adminService";
import "../styles/admin.css";

function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await loginAdmin({ email, password });
      setAdminToken(response.token);
      window.history.pushState({}, "", "/admin/dashboard");
      window.dispatchEvent(new PopStateEvent("popstate"));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="admin-login-shell">
      <form className="admin-login-card" onSubmit={handleSubmit}>
        <img src="/drdo-logo.png" alt="DRDO" />
        <div>
          <p className="portal-eyebrow">Internship Management Portal</p>
          <h1>Admin Login</h1>
        </div>

        <label className="admin-field admin-field--wide">
          <span>Email</span>
          <input
            autoComplete="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>

        <label className="admin-field admin-field--wide">
          <span>Password</span>
          <input
            autoComplete="current-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>

        {error && <p className="admin-error">{error}</p>}

        <button className="primary-button" disabled={loading} type="submit">
          {loading ? "Signing in..." : "Login"}
        </button>
      </form>
    </main>
  );
}

export default AdminLogin;

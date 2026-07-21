import { useState } from "react";
import { loginAdmin, setAdminToken } from "../services/adminService";
import "../styles/admin.css";

function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
          <div className="password-input-wrap">
            <input
              autoComplete="current-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
            <button className="password-toggle" type="button" onClick={() => setShowPassword((current) => !current)} aria-label={showPassword ? "Hide password" : "Show password"}>
              {showPassword ? (
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 3 18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M9.9 4.2A10.8 10.8 0 0 1 12 4c5.5 0 9.3 4.7 10 8-.3 1.3-1.1 2.8-2.3 4.1M6.7 6.7C4.5 8.2 2.6 10.8 2 12c.7 3.3 4.5 8 10 8 1.4 0 2.7-.3 3.9-.8" /></svg>
              ) : (
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.5-8 10-8 10 8 10 8-3.5 8-10 8S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></svg>
              )}
            </button>
          </div>
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

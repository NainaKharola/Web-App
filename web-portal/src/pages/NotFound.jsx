import { Link, useLocation } from "react-router-dom";

function NotFound() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith("/admin");
  return (
    <main className="portal-shell">
      <section className="portal-card">
        <h1>404 Page Not Found</h1>
        <p>The page you requested does not exist.</p>
        <Link className="primary-button" to={isAdmin ? "/admin/dashboard" : "/"}>Return Home</Link>
      </section>
    </main>
  );
}

export default NotFound;

import { Link } from "react-router-dom";

function NotFound() {
  return (
    <main className="portal-shell">
      <section className="portal-card">
        <h1>404 Page Not Found</h1>
        <p>The page you requested does not exist.</p>
        <Link className="primary-button" to="/">Return Home</Link>
      </section>
    </main>
  );
}

export default NotFound;

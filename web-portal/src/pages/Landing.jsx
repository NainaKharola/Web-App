import "../styles/landing.css";

const portalCards = [
  {
    title: "Student Registration",
    description: [
      "Register for Internship",
      "Fill the Application Form",
      "Upload Required Documents",
    ],
    buttonText: "Student Registration",
    path: "/student",
  },
  {
    title: "Student Login",
    description: [
      "Use Registered Email",
      "Enter Reference ID",
      "View Status and Documents",
    ],
    buttonText: "Student Login",
    path: "/student/login",
  },
  {
    title: "Admin Login",
    description: [
      "View Registered Students",
      "Review Applications",
      "Approve or Reject Students",
      "Upload and Send Offer Letters",
    ],
    buttonText: "Admin Login",
    path: "/admin/login",
  },
];

function navigateTo(path) {
  window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

function Landing() {
  return (
    <main className="landing-shell">
      <section className="landing-hero">
        <div className="landing-hero__identity">
          <img src="/drdo-logo.png" alt="DRDO" className="landing-logo" />
          <div>
            <p className="landing-eyebrow">Government of India</p>
            <h1>
              Defence Research and Development Organisation (DRDO) Internship
              Management Portal
            </h1>
          </div>
        </div>

        <p className="landing-welcome">
          Welcome to the official internship management portal. Select the
          relevant portal below to continue with student registration or
          administrative review.
        </p>
      </section>

      <section className="landing-card-grid" aria-label="Portal options">
        {portalCards.map((card) => (
          <article className="landing-card" key={card.title}>
            <div>
              <h2>{card.title}</h2>
              <ul>
                {card.description.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>

            <button
              className="landing-card__button"
              type="button"
              onClick={() => navigateTo(card.path)}
            >
              {card.buttonText}
            </button>
          </article>
        ))}
      </section>
    </main>
  );
}

export default Landing;

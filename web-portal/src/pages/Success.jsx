import { useState } from "react";

function Success({ registration }) {
  const [copyMessage, setCopyMessage] = useState("");
  const referenceId = registration?.referenceId;

  const copyReferenceId = async () => {
    if (!referenceId) return;

    try {
      await navigator.clipboard.writeText(referenceId);
      setCopyMessage("Reference ID copied successfully.");
    } catch {
      setCopyMessage("Unable to copy Reference ID. Please copy it manually.");
    }
  };

  return (
    <main className="portal-shell">
      <section className="success-card" aria-live="polite">
        <span className="success-icon">✓</span>
        <h1>Registration Submitted</h1>
        <p>Your student registration details have been submitted successfully.</p>
        {registration?.warning && <p>{registration.warning}</p>}
        {referenceId && (
          <div className="reference-box">
            <span>Your Reference ID</span>
            <strong>{referenceId}</strong>
            <button className="secondary-button" type="button" onClick={copyReferenceId}>
              Copy Reference ID
            </button>
            {copyMessage && <p className="copy-message">{copyMessage}</p>}
          </div>
        )}
      </section>
    </main>
  );
}

export default Success;

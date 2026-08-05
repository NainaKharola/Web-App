import TextInput from "../Inputs/TextInput";

function PersonalForm({ form, errors, onChange }) {
  return (
    <section className="form-section">
      <h2>Personal Details</h2>
      <div className="form-grid">
        <TextInput label="Name" name="name" value={form.name} onChange={onChange} error={errors.name} required />
        <TextInput
          label="Phone Number"
          name="phone"
          value={form.phone}
          onChange={onChange}
          error={errors.phone}
          required
        />
        <TextInput label="Email" name="email" value={form.email} onChange={onChange} error={errors.email} required />
        <TextInput
          label="Date of Birth"
          name="dob"
          type="date"
          value={form.dob}
          onChange={onChange}
          error={errors.dob}
          required
        />
        <TextInput
          label="Aadhaar Card Number"
          name="aadhaarNumber"
          value={form.aadhaarNumber}
          onChange={onChange}
          error={errors.aadhaarNumber}
          required
        />
        {window.location.pathname.startsWith("/admin") && (
          <div className="text-input" style={{ display: "flex", flexDirection: "column" }}>
            <label style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <span style={{ fontSize: "0.85rem", fontWeight: "600", color: "#334155" }}>Internship Type <span style={{ color: "red" }}>*</span></span>
              <select
                name="internshipType"
                value={form.internshipType || "Unpaid"}
                onChange={onChange}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: "6px",
                  border: "1px solid #cbd5e1",
                  backgroundColor: "#fff",
                  fontWeight: "600",
                  height: "38px"
                }}
              >
                <option value="Unpaid">Unpaid Internship</option>
                <option value="Paid">Paid Internship</option>
              </select>
            </label>
          </div>
        )}
      </div>
    </section>
  );
}

export default PersonalForm;

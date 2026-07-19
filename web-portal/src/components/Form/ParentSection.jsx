import TextInput from "../Inputs/TextInput";

function ParentSection({ form, errors, onChange }) {
  return (
    <section className="form-section">
      <h2>Parent Details</h2>
      <div className="form-grid">
        <TextInput
          label="Father's Name"
          name="fatherName"
          value={form.fatherName}
          onChange={onChange}
          error={errors.fatherName}
          required
        />
        <TextInput
          label="Father's Contact Number"
          name="fatherPhone"
          value={form.fatherPhone}
          onChange={onChange}
          error={errors.fatherPhone}
          required
        />
        <TextInput
          label="Father's Occupation"
          name="fatherOccupation"
          value={form.fatherOccupation}
          onChange={onChange}
          error={errors.fatherOccupation}
          required
        />
      </div>
    </section>
  );
}

export default ParentSection;

import Checkbox from "../Inputs/Checkbox";
import TextInput from "../Inputs/TextInput";

function AddressSection({ form, errors, onChange }) {
  return (
    <section className="form-section">
      <h2>Address Details</h2>
      <div className="form-grid">
        <TextInput
          label="Current Address"
          name="currentAddress"
          value={form.currentAddress}
          onChange={onChange}
          error={errors.currentAddress}
          required
          as="textarea"
        />
        <TextInput
          label="Permanent Address"
          name="permanentAddress"
          value={form.permanentAddress}
          onChange={onChange}
          error={errors.permanentAddress}
          required
          as="textarea"
          disabled={form.sameAddress}
        />
      </div>
      <Checkbox
        label="Permanent Address is same as Current Address"
        name="sameAddress"
        checked={form.sameAddress}
        onChange={onChange}
      />
    </section>
  );
}

export default AddressSection;

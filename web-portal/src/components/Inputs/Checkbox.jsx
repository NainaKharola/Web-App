function Checkbox({ label, name, checked, onChange }) {
  return (
    <label className="checkbox-field">
      <input type="checkbox" name={name} checked={checked} onChange={onChange} />
      <span>{label}</span>
    </label>
  );
}

export default Checkbox;

function FileInput({ label, name, onChange, error, required = false, accept }) {
  return (
    <label className={`file-field ${error ? "field--error" : ""}`}>
      <span className="file-field__label">{label}</span>
      <input
        className="file-field__control"
        type="file"
        name={name}
        onChange={onChange}
        required={required}
        accept={accept}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${name}-error` : undefined}
      />
      {error && (
        <span className="field__error" id={`${name}-error`}>
          {error}
        </span>
      )}
    </label>
  );
}

export default FileInput;

import { useEffect, useState } from "react";

function FileInput({ label, name, onChange, error, required = false, accept }) {
  const [preview, setPreview] = useState("");
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);
  const handleChange = (event) => {
    const file = event.target.files?.[0];
    if (preview) URL.revokeObjectURL(preview);
    setPreview(name === "photo" && file ? URL.createObjectURL(file) : "");
    onChange(event);
  };
  return (
    <label className={`file-field ${error ? "field--error" : ""}`}>
      <span className="file-field__label">{label}</span>
      <input
        className="file-field__control"
        type="file"
        name={name}
        onChange={handleChange}
        required={required}
        accept={accept}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${name}-error` : undefined}
      />
      {preview && <img className="file-field__preview" src={preview} alt="Passport photograph preview" />}
      {error && (
        <span className="field__error" id={`${name}-error`}>
          {error}
        </span>
      )}
    </label>
  );
}

export default FileInput;

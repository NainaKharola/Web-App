import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { indianStatesAndUnionTerritories } from "../../data/states";
import { submitStudentRegistration } from "../../services/studentService";
import AcademicSection from "./AcademicSection";
import AddressSection from "./AddressSection";
import DocumentForm from "./DocumentForm";
import ParentSection from "./ParentSection";
import PersonalForm from "./PersonalForm";
import "../../styles/form.css";

const initialForm = {
  name: "",
  course: "",
  branch: "",
  currentYear: "",
  phone: "",
  email: "",
  dob: "",
  aadhaarNumber: "",
  collegeName: "",
  collegeState: "",
  collegeLocation: "",
  currentAddress: "",
  sameAddress: false,
  permanentAddress: "",
  fatherName: "",
  fatherPhone: "",
  fatherOccupation: "",
  cgpa: "",
  resume: null,
  result: null,
  photo: null,
  collegeId: "",
  internshipDuration: "",
  internshipJoiningMonth: "",
  permissionLetterNumber: "",
  permissionLetterDate: "",
  permissionLetter: null,
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const fileLimits = {
  photo: 1 * 1024 * 1024,
  resume: 10 * 1024 * 1024,
  result: 10 * 1024 * 1024,
  permissionLetter: 10 * 1024 * 1024,
};

function isValidDateValue(value) {
  if (!datePattern.test(value)) return false;

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function validateStepOne(form) {
  const errors = {};
  const requiredFields = [
    "name",
    "course",
    "branch",
    "currentYear",
    "phone",
    "email",
    "dob",
    "aadhaarNumber",
    "collegeName",
    "collegeState",
    "collegeLocation",
    "currentAddress",
    "permanentAddress",
    "fatherName",
    "fatherPhone",
    "fatherOccupation",
    "cgpa",
  ];

  requiredFields.forEach((field) => {
    if (!String(form[field]).trim()) errors[field] = "This field is required.";
  });

  if (form.phone && !/^\d{10}$/.test(form.phone)) errors.phone = "Phone number must be exactly 10 digits.";
  if (form.fatherPhone && !/^\d{10}$/.test(form.fatherPhone)) {
    errors.fatherPhone = "Father contact number must be exactly 10 digits.";
  }
  if (form.email && !emailPattern.test(form.email)) errors.email = "Enter a valid email address.";
  if (form.dob && new Date(form.dob) > new Date()) errors.dob = "Date of birth cannot be in the future.";
  if (form.aadhaarNumber && !/^\d{12}$/.test(form.aadhaarNumber)) {
    errors.aadhaarNumber = "Aadhaar Number must contain exactly 12 digits.";
  }
  if (
    form.collegeState &&
    !indianStatesAndUnionTerritories.includes(form.collegeState)
  ) {
    errors.collegeState = "Select a valid college state or union territory.";
  }

  const cgpa = Number(form.cgpa);
  if (form.cgpa && (Number.isNaN(cgpa) || cgpa < 0 || cgpa > 10)) {
    errors.cgpa = "CGPA must be between 0 and 10.";
  }

  return errors;
}

function validateStepTwo(form) {
  const errors = {};
  const checks = [
    [
      "permissionLetter",
      ["application/pdf", "image/jpeg", "image/jpg", "image/png"],
      "College Permission Letter must be PDF, JPG, JPEG, or PNG.",
    ],
    ["resume", ["application/pdf"], "Resume must be a PDF."],
    ["result", ["application/pdf", "image/jpeg", "image/jpg"], "Result must be PDF, JPG, or JPEG."],
    ["photo", ["image/png", "image/jpeg", "image/jpg"], "Photo must be PNG, JPG, or JPEG."],
  ];

  const requiredFields = [
    "internshipDuration",
    "internshipJoiningMonth",
    "permissionLetterNumber",
    "permissionLetterDate",
  ];

  requiredFields.forEach((field) => {
    if (!String(form[field]).trim()) errors[field] = "This field is required.";
  });

  checks.forEach(([field, allowedTypes, message]) => {
    if (!form[field]) {
      errors[field] = "This field is required.";
    } else if (!allowedTypes.includes(form[field].type)) {
      errors[field] = message;
    } else if (form[field].size > fileLimits[field]) {
      errors[field] =
        field === "photo"
          ? "Photo size should not exceed 1 MB."
          : `${field === "permissionLetter" ? "Permission Letter" : field[0].toUpperCase() + field.slice(1)} size should not exceed 10 MB.`;
    }
  });

  if (!form.collegeId.trim()) errors.collegeId = "College identity card number is required.";
  if (form.internshipJoiningMonth && !/^\d{4}-\d{2}$/.test(form.internshipJoiningMonth)) {
    errors.internshipJoiningMonth = "Select a valid internship joining month.";
  }
  if (form.permissionLetterDate && !isValidDateValue(form.permissionLetterDate)) {
    errors.permissionLetterDate = "Select a valid permission letter date.";
  }

  return errors;
}

function StudentForm() {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleChange = (event) => {
    const { name, value, type, checked, files } = event.target;
    const nextValue = type === "checkbox" ? checked : type === "file" ? files[0] : value;

    setForm((current) => {
      const next = { ...current, [name]: nextValue };

      if (name === "sameAddress" && checked) next.permanentAddress = current.currentAddress;
      if (name === "currentAddress" && current.sameAddress) next.permanentAddress = value;

      return next;
    });
    setErrors((current) => ({ ...current, [name]: "" }));
  };

  const goToDocuments = () => {
    const nextErrors = validateStepOne(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length === 0) setStep(2);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = validateStepTwo(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const payload = new FormData();
    Object.entries(form).forEach(([key, value]) => payload.append(key, value));

    try {
      setIsSubmitting(true);
      const response = await submitStudentRegistration(payload);
      navigate("/student/success", {
        replace: true,
        state: { registration: response },
      });
    } catch (error) {
      setErrors((current) => ({ ...current, submit: error.message }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="portal-shell">
      <section className="portal-card">
        <header className="portal-header">
          <img src="/drdo-logo.png" alt="DRDO logo" className="portal-logo" />
          <div>
            <p className="portal-eyebrow">Defence Research and Development Organisation</p>
            <h1>Student Registration Portal</h1>
          </div>
        </header>

        <div className="step-meter" aria-label={`Step ${step} of 2`}>
          <div className="step-meter__labels">
            <span className={step === 1 ? "is-active" : ""}>Step 1 of 2</span>
            <span className={step === 2 ? "is-active" : ""}>Step 2 of 2</span>
          </div>
          <div className="step-meter__track">
            <span style={{ width: step === 1 ? "50%" : "100%" }} />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="student-form" noValidate>
          {step === 1 ? (
            <div className="form-page">
              <PersonalForm form={form} errors={errors} onChange={handleChange} />
              <AcademicSection form={form} errors={errors} onChange={handleChange} />
              <AddressSection form={form} errors={errors} onChange={handleChange} />
              <ParentSection form={form} errors={errors} onChange={handleChange} />
              <button className="primary-button" type="button" onClick={goToDocuments}>
                Next
              </button>
            </div>
          ) : (
            <div className="form-page">
              <DocumentForm form={form} errors={errors} onChange={handleChange} />
              {errors.submit && <p className="submit-error">{errors.submit}</p>}
              <div className="button-row">
                <button className="secondary-button" type="button" onClick={() => setStep(1)}>
                  Back
                </button>
                <button className="primary-button" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? <span className="button-loader" /> : "Submit"}
                </button>
              </div>
            </div>
          )}
        </form>
      </section>
    </main>
  );
}

export default StudentForm;

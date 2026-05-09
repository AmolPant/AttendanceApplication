import { useState, useEffect } from "react";

const COUNTRIES = [
  { code: "+65", name: "Singapore" }, { code: "+1", name: "USA" },
  { code: "+44", name: "UK" }, { code: "+91", name: "India" },
  { code: "+61", name: "Australia" }, { code: "+60", name: "Malaysia" },
  { code: "+63", name: "Philippines" }, { code: "+62", name: "Indonesia" },
  { code: "+66", name: "Thailand" }, { code: "+81", name: "Japan" },
  { code: "+86", name: "China" }, { code: "+49", name: "Germany" },
  { code: "+33", name: "France" }, { code: "+971", name: "UAE" },
];

const ROLES = ["Speaker", "Reader", "Mini-Reader"];
const SEX_OPTIONS = ["Man", "Women", "Kids", "Childrens"];
const LOCATION_TYPES = ["Physical", "Online"];

const HOBBIES = [
  "Music", "Reading", "Writing", "Public Speaking", "Drama",
  "Arts & Crafts", "Sports", "Technology", "Photography", "Volunteering",
  "Cooking", "Dance", "Languages", "Science", "Leadership",
];

const EMPTY = {
  name: "", sex: "", address: { city: "", town: "", country: "", pincode: "" },
  countryCode: "+65", phone: "", email: "",
  role: "", hobbies: [], locationType: "",
};

function validate(form) {
  const errs = {};
  if (!form.name.trim()) errs.name = "Name is required";
  if (!form.sex) errs.sex = "Please select";
  if (!form.address.city.trim()) errs.city = "City required";
  if (!form.address.country.trim()) errs.country = "Country required";
  if (!form.address.pincode.trim()) errs.pincode = "Pincode required";
  if (!form.phone.trim()) errs.phone = "Phone required";
  else if (!/^\d{6,15}$/.test(form.phone)) errs.phone = "Invalid phone number";
  if (!form.email.trim()) errs.email = "Email required";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = "Invalid email";
  if (!form.role) errs.role = "Role is required";
  if (!form.locationType) errs.locationType = "Select location type";
  return errs;
}

export default function StudentForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial ? { ...EMPTY, ...initial } : EMPTY);
  const [errs, setErrs] = useState({});

  useEffect(() => {
    setForm(initial ? { ...EMPTY, ...initial } : EMPTY);
    setErrs({});
  }, [initial]);

  const set = (field, value) => {
    setForm(f => ({ ...f, [field]: value }));
    if (errs[field]) setErrs(e => ({ ...e, [field]: undefined }));
  };

  const setAddr = (field, value) => {
    setForm(f => ({ ...f, address: { ...f.address, [field]: value } }));
    if (errs[field]) setErrs(e => ({ ...e, [field]: undefined }));
  };

  const toggleHobby = (h) => {
    setForm(f => ({
      ...f,
      hobbies: f.hobbies.includes(h) ? f.hobbies.filter(x => x !== h) : [...f.hobbies, h],
    }));
  };

  const handleSubmit = () => {
    const e = validate(form);
    if (Object.keys(e).length) { setErrs(e); return; }
    onSave(form);
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">{initial ? "Edit Student" : "Register Student"}</h1>
        <p className="page-subtitle">Fill in the student's details below</p>
      </div>

      <div className="form-card">
        {/* Personal Info */}
        <div className="form-section-title">Personal Information</div>

        <div className="form-row">
          <div className="form-group">
            <label>Full Name <span className="req">*</span></label>
            <input
              type="text"
              placeholder="Enter full name"
              value={form.name}
              className={errs.name ? "error" : ""}
              onChange={e => set("name", e.target.value)}
            />
            {errs.name && <span className="field-error">{errs.name}</span>}
          </div>

          <div className="form-group">
            <label>Email Address <span className="req">*</span></label>
            <input
              type="email"
              placeholder="you@example.com"
              value={form.email}
              className={errs.email ? "error" : ""}
              onChange={e => set("email", e.target.value)}
            />
            {errs.email && <span className="field-error">{errs.email}</span>}
          </div>
        </div>

        <div className="form-group">
          <label>Sex <span className="req">*</span></label>
          <div className="radio-group">
            {SEX_OPTIONS.map(opt => (
              <label
                key={opt}
                className={`radio-option${form.sex === opt ? " selected" : ""}`}
                onClick={() => set("sex", opt)}
              >
                <input type="radio" name="sex" value={opt} readOnly checked={form.sex === opt} />
                {opt}
              </label>
            ))}
          </div>
          {errs.sex && <span className="field-error">{errs.sex}</span>}
        </div>

        {/* Address */}
        <div className="form-section-title">Structured Address</div>

        <div className="form-row">
          <div className="form-group">
            <label>City <span className="req">*</span></label>
            <input
              type="text"
              placeholder="City"
              value={form.address.city}
              className={errs.city ? "error" : ""}
              onChange={e => setAddr("city", e.target.value)}
            />
            {errs.city && <span className="field-error">{errs.city}</span>}
          </div>

          <div className="form-group">
            <label>Town / District</label>
            <input
              type="text"
              placeholder="Town or district"
              value={form.address.town}
              onChange={e => setAddr("town", e.target.value)}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Country <span className="req">*</span></label>
            <input
              type="text"
              placeholder="Country"
              value={form.address.country}
              className={errs.country ? "error" : ""}
              onChange={e => setAddr("country", e.target.value)}
            />
            {errs.country && <span className="field-error">{errs.country}</span>}
          </div>

          <div className="form-group">
            <label>Pincode / Postal Code <span className="req">*</span></label>
            <input
              type="text"
              placeholder="e.g. 560001"
              value={form.address.pincode}
              className={errs.pincode ? "error" : ""}
              onChange={e => setAddr("pincode", e.target.value)}
            />
            {errs.pincode && <span className="field-error">{errs.pincode}</span>}
          </div>
        </div>

        {/* Contact */}
        <div className="form-section-title">Contact</div>

        <div className="form-group">
          <label>Phone Number <span className="req">*</span></label>
          <div className="phone-row">
            <select
              value={form.countryCode}
              onChange={e => set("countryCode", e.target.value)}
            >
              {COUNTRIES.map(c => (
                <option key={c.code} value={c.code}>{c.code} ({c.name})</option>
              ))}
            </select>
            <input
              type="tel"
              placeholder="Phone number"
              value={form.phone}
              className={errs.phone ? "error" : ""}
              onChange={e => set("phone", e.target.value)}
            />
          </div>
          {errs.phone && <span className="field-error">{errs.phone}</span>}
        </div>

        {/* Role & Location */}
        <div className="form-section-title">Role & Attendance</div>

        <div className="form-row">
          <div className="form-group">
            <label>Role <span className="req">*</span></label>
            <div className="radio-group">
              {ROLES.map(r => (
                <label
                  key={r}
                  className={`radio-option${form.role === r ? " selected" : ""}`}
                  onClick={() => set("role", r)}
                >
                  <input type="radio" name="role" value={r} readOnly checked={form.role === r} />
                  {r}
                </label>
              ))}
            </div>
            {errs.role && <span className="field-error">{errs.role}</span>}
          </div>

          <div className="form-group">
            <label>Location Type <span className="req">*</span></label>
            <div className="radio-group">
              {LOCATION_TYPES.map(lt => (
                <label
                  key={lt}
                  className={`radio-option${form.locationType === lt ? " selected" : ""}`}
                  onClick={() => set("locationType", lt)}
                >
                  <input type="radio" name="locationType" value={lt} readOnly checked={form.locationType === lt} />
                  {lt === "Physical" ? "🏢 Physical" : "💻 Online"}
                </label>
              ))}
            </div>
            {errs.locationType && <span className="field-error">{errs.locationType}</span>}
          </div>
        </div>

        {/* Hobbies */}
        <div className="form-section-title">Hobbies / Skills</div>

        <div className="form-group">
          <label>Select all that apply</label>
          <div className="checkbox-group">
            {HOBBIES.map(h => (
              <label
                key={h}
                className={`checkbox-option${form.hobbies.includes(h) ? " checked" : ""}`}
                onClick={() => toggleHobby(h)}
              >
                <input type="checkbox" readOnly checked={form.hobbies.includes(h)} />
                {h}
              </label>
            ))}
          </div>
          <span className="field-hint">Selected: {form.hobbies.length > 0 ? form.hobbies.join(", ") : "None"}</span>
        </div>

        {/* Actions */}
        <div className="form-actions">
          <button className="btn btn-outline" onClick={onCancel}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit}>
            {initial ? "Update Student" : "Register Student"}
          </button>
        </div>
      </div>
    </div>
  );
}

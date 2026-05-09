import { useState } from "react";

export default function StudentList({ students, onEdit, onDelete, onNew }) {
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("All");
  const [filterLoc, setFilterLoc] = useState("All");
  const [confirmDel, setConfirmDel] = useState(null);

  const filtered = students.filter(s => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      s.name?.toLowerCase().includes(q) ||
      s.email?.toLowerCase().includes(q) ||
      s.role?.toLowerCase().includes(q) ||
      s.address?.city?.toLowerCase().includes(q);
    const matchRole = filterRole === "All" || s.role === filterRole;
    const matchLoc = filterLoc === "All" || s.locationType === filterLoc;
    return matchSearch && matchRole && matchLoc;
  });

  const initials = (name = "") => name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() || "?";

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Students</h1>
        <p className="page-subtitle">{students.length} registered · {filtered.length} shown</p>
      </div>

      <div className="list-toolbar">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search by name, email, city, role…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <select value={filterRole} onChange={e => setFilterRole(e.target.value)} style={{ width: "140px" }}>
          <option value="All">All Roles</option>
          {["Speaker", "Reader", "Mini-Reader"].map(r => <option key={r}>{r}</option>)}
        </select>

        <select value={filterLoc} onChange={e => setFilterLoc(e.target.value)} style={{ width: "140px" }}>
          <option value="All">All Locations</option>
          {["Physical", "Online"].map(l => <option key={l}>{l}</option>)}
        </select>

        <button className="btn btn-primary" onClick={onNew}>+ Register</button>
      </div>

      {/* Delete confirmation */}
      {confirmDel !== null && (
        <div style={{
          background: "var(--danger-bg)",
          border: "1px solid #f4a8a8",
          borderRadius: "var(--radius)",
          padding: "1rem 1.25rem",
          marginBottom: "1.5rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1rem",
        }}>
          <span style={{ fontSize: "14px", color: "var(--danger)" }}>
            Delete <strong>{students[confirmDel]?.name}</strong>? This cannot be undone.
          </span>
          <div style={{ display: "flex", gap: "8px" }}>
            <button className="btn btn-outline btn-sm" onClick={() => setConfirmDel(null)}>Cancel</button>
            <button className="btn btn-danger btn-sm" onClick={() => { onDelete(confirmDel); setConfirmDel(null); }}>
              Delete
            </button>
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">👤</div>
          <h3>{students.length === 0 ? "No students yet" : "No results found"}</h3>
          <p style={{ marginBottom: "1.5rem" }}>
            {students.length === 0
              ? "Register the first student to get started."
              : "Try adjusting your search or filters."}
          </p>
          {students.length === 0 && (
            <button className="btn btn-primary" onClick={onNew}>Register First Student</button>
          )}
        </div>
      ) : (
        <div className="student-grid">
          {filtered.map((s, i) => {
            const realIdx = students.indexOf(s);
            return (
              <div key={s.id || i} className="student-card">
                <div className="student-avatar">{initials(s.name)}</div>
                <div className="student-name">{s.name}</div>
                <div className="student-email">{s.email}</div>

                <div className="student-meta">
                  {s.role && <span className="badge badge-role">{s.role}</span>}
                  {s.locationType && (
                    <span className="badge badge-location">
                      {s.locationType === "Physical" ? "🏢" : "💻"} {s.locationType}
                    </span>
                  )}
                  {s.sex && <span className="badge badge-sex">{s.sex}</span>}
                </div>

                <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "12px" }}>
                  {[s.address?.city, s.address?.country].filter(Boolean).join(", ")}
                  {s.countryCode && s.phone && ` · ${s.countryCode} ${s.phone}`}
                </div>

                {s.hobbies?.length > 0 && (
                  <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "10px" }}>
                    <em>{s.hobbies.slice(0, 3).join(", ")}{s.hobbies.length > 3 ? ` +${s.hobbies.length - 3}` : ""}</em>
                  </div>
                )}

                <div className="card-actions">
                  <button className="btn btn-outline btn-sm" onClick={() => onEdit(realIdx)}>Edit</button>
                  <button className="btn btn-danger btn-sm" onClick={() => setConfirmDel(realIdx)}>Delete</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

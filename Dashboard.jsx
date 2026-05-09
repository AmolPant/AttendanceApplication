export default function Dashboard({ students, onNew, onList }) {
  const total = students.length;
  const physical = students.filter(s => s.locationType === "Physical").length;
  const online = students.filter(s => s.locationType === "Online").length;

  const byRole = ["Speaker", "Reader", "Mini-Reader"].map(r => ({
    label: r, count: students.filter(s => s.role === r).length,
  }));

  const bySex = ["Man", "Women", "Kids", "Childrens"].map(s => ({
    label: s, count: students.filter(st => st.sex === s).length,
  }));

  const maxRole = Math.max(...byRole.map(r => r.count), 1);
  const maxSex = Math.max(...bySex.map(s => s.count), 1);

  const recent = [...students].reverse().slice(0, 5);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Attendance overview at a glance</p>
      </div>

      <div style={{ display: "flex", gap: "10px", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        <button className="btn btn-primary" onClick={onNew}>+ Register Student</button>
        <button className="btn btn-outline" onClick={onList}>View All Students</button>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Registered</div>
          <div className="stat-value">{total}</div>
          <div className="stat-sub">students</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Physical</div>
          <div className="stat-value">{physical}</div>
          <div className="stat-sub">{total ? Math.round(physical / total * 100) : 0}% of total</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Online</div>
          <div className="stat-value">{online}</div>
          <div className="stat-sub">{total ? Math.round(online / total * 100) : 0}% of total</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Speakers</div>
          <div className="stat-value">{students.filter(s => s.role === "Speaker").length}</div>
          <div className="stat-sub">this session</div>
        </div>
      </div>

      <div className="chart-row">
        <div className="chart-card">
          <div className="chart-title">By Role</div>
          <div className="bar-chart">
            {byRole.map(r => (
              <div key={r.label} className="bar-row">
                <span className="bar-label">{r.label}</span>
                <div className="bar-track">
                  <div className="bar-fill" style={{ width: `${Math.round(r.count / maxRole * 100)}%` }} />
                </div>
                <span className="bar-count">{r.count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="chart-card">
          <div className="chart-title">By Category</div>
          <div className="bar-chart">
            {bySex.map(s => (
              <div key={s.label} className="bar-row">
                <span className="bar-label">{s.label}</span>
                <div className="bar-track">
                  <div className="bar-fill" style={{ width: `${Math.round(s.count / maxSex * 100)}%`, background: "#8b5cf6" }} />
                </div>
                <span className="bar-count">{s.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {recent.length > 0 && (
        <div className="chart-card" style={{ marginTop: "16px" }}>
          <div className="chart-title">Recent Registrations</div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead>
              <tr>
                {["Name", "Role", "Location", "City"].map(h => (
                  <th key={h} style={{
                    textAlign: "left", padding: "8px 10px", borderBottom: "1px solid var(--border)",
                    color: "var(--text-muted)", fontWeight: 500, fontSize: "12px"
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recent.map((s, i) => (
                <tr key={i} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ padding: "10px 10px" }}><strong>{s.name}</strong></td>
                  <td style={{ padding: "10px 10px", color: "var(--text-muted)" }}>{s.role}</td>
                  <td style={{ padding: "10px 10px", color: "var(--text-muted)" }}>
                    {s.locationType === "Physical" ? "🏢" : "💻"} {s.locationType}
                  </td>
                  <td style={{ padding: "10px 10px", color: "var(--text-muted)" }}>
                    {[s.address?.city, s.address?.country].filter(Boolean).join(", ")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {total === 0 && (
        <div className="chart-card" style={{ marginTop: "16px", textAlign: "center", padding: "3rem" }}>
          <div style={{ fontSize: "40px", marginBottom: "1rem", opacity: 0.3 }}>📋</div>
          <h3 style={{ marginBottom: "8px" }}>No data yet</h3>
          <p style={{ color: "var(--text-muted)", marginBottom: "1.5rem", fontSize: "14px" }}>
            Register students to see analytics here.
          </p>
          <button className="btn btn-primary" onClick={onNew}>Register First Student</button>
        </div>
      )}
    </div>
  );
}

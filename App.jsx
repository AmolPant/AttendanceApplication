import { useState, useEffect } from "react";
import StudentForm from "./components/StudentForm";
import StudentList from "./components/StudentList";
import Dashboard from "./components/Dashboard";
import "./App.css";

export default function App() {
  const [view, setView] = useState("dashboard");
  const [students, setStudents] = useState(() => {
    try { return JSON.parse(localStorage.getItem("students") || "[]"); } catch { return []; }
  });
  const [editTarget, setEditTarget] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    localStorage.setItem("students", JSON.stringify(students));
  }, [students]);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSave = (data) => {
    if (editTarget !== null) {
      setStudents(s => s.map((st, i) => i === editTarget ? data : st));
      showToast("Record updated successfully.");
      setEditTarget(null);
    } else {
      setStudents(s => [...s, { ...data, id: Date.now() }]);
      showToast("Student registered successfully.");
    }
    setView("list");
  };

  const handleEdit = (idx) => { setEditTarget(idx); setView("form"); };
  const handleDelete = (idx) => {
    setStudents(s => s.filter((_, i) => i !== idx));
    showToast("Record deleted.", "danger");
  };
  const handleNew = () => { setEditTarget(null); setView("form"); };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-icon">▣</span>
          <span className="brand-name">AttendEase</span>
        </div>
        <nav className="nav">
          {[
            { id: "dashboard", label: "Dashboard", icon: "⬡" },
            { id: "form", label: "Register", icon: "+" },
            { id: "list", label: "Students", icon: "≡" },
          ].map(n => (
            <button
              key={n.id}
              className={`nav-item${view === n.id ? " active" : ""}`}
              onClick={() => { if (n.id !== "form") setEditTarget(null); setView(n.id); }}
            >
              <span className="nav-icon">{n.icon}</span>
              <span>{n.label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <span>v1.0 · Azure Hosted</span>
        </div>
      </aside>

      <main className="main-content">
        {toast && (
          <div className={`toast toast-${toast.type}`}>{toast.msg}</div>
        )}
        {view === "dashboard" && (
          <Dashboard students={students} onNew={handleNew} onList={() => setView("list")} />
        )}
        {view === "form" && (
          <StudentForm
            initial={editTarget !== null ? students[editTarget] : null}
            onSave={handleSave}
            onCancel={() => setView("list")}
          />
        )}
        {view === "list" && (
          <StudentList
            students={students}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onNew={handleNew}
          />
        )}
      </main>
    </div>
  );
}

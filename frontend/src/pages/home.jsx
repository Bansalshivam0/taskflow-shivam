
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Home({ projects = [] }) {
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const filtered = projects.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ padding: "24px", background: "#f5f6fa", minHeight: "100vh" }}>
      <h1 style={{ fontSize: "24px", fontWeight: "600", marginBottom: "16px" }}>
        Dashboard
      </h1>

      {/* Search Bar */}
      <input
        placeholder="Search projects..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{
          padding: "10px 14px",
          width: "300px",
          borderRadius: "8px",
          border: "1px solid #ddd",
          marginBottom: "20px"
        }}
      />

      {/* Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
          gap: "16px"
        }}
      >
        {filtered.map((p) => (
          <div
            key={p.id}
            onClick={() => navigate(`/?projectId=${p.id}`)}
            style={{
              padding: "16px",
              borderRadius: "12px",
              background: "#fff",
              boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
              cursor: "pointer",
              transition: "0.2s"
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.transform = "scale(1.02)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.transform = "scale(1)")
            }
          >
            <h3>{p.name}</h3>
            <p style={{ color: "#666", fontSize: "14px" }}>
              {p.description || "No description"}
            </p>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filtered.length === 0 && (
        <div style={{ marginTop: "40px", textAlign: "center", color: "#888" }}>
          No projects found 🚀
        </div>
      )}
    </div>
  );
}

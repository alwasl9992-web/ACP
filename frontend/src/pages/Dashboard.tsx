import ACP from "../core/ACP";

export default function Dashboard() {
  const projects = ACP.getProjects();

  const stats = ACP.getStatistics();

  return (
    <div
      style={{
        direction: "rtl",
        padding: "30px",
        fontFamily: "Cairo, sans-serif",
        background: "#f5f7fa",
        minHeight: "100vh",
      }}
    >
      <h1 style={{ color: "#0B3D91", marginBottom: 5 }}>
        ACP Enterprise
      </h1>

      <p style={{ color: "#666" }}>
        منصة وطنية ذكية لإدارة التشغيل والمشاريع والأصول
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
          gap: "15px",
          marginTop: "25px",
        }}
      >
        {[
          ["المشاريع", stats.totalProjects],
          ["المباني", stats.totalBuildings],
          ["البوابات", stats.totalGates],
          ["الموظفون", stats.totalEmployees],
          ["نسبة الإنجاز", stats.completion + "%"],
        ].map(([title, value]) => (
          <div
            key={String(title)}
            style={{
              background: "#fff",
              borderRadius: "14px",
              padding: "20px",
              boxShadow: "0 4px 12px rgba(0,0,0,.08)",
            }}
          >
            <div
              style={{
                color: "#666",
                marginBottom: "10px",
              }}
            >
              {title}
            </div>

            <div
              style={{
                color: "#0B3D91",
                fontSize: "34px",
                fontWeight: 700,
              }}
            >
              {value}
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          marginTop: "30px",
          background: "#fff",
          borderRadius: "14px",
          padding: "20px",
          boxShadow: "0 4px 12px rgba(0,0,0,.08)",
        }}
      >
        <h2>جاهزية منصة ACP</h2>

        <table style={{ width: "100%", lineHeight: "2.3" }}>
          <tbody>
            <tr>
              <td>الأمن السيبراني</td>
              <td>✅ مفعل</td>
            </tr>

            <tr>
              <td>الخصوصية</td>
              <td>✅ Privacy First</td>
            </tr>

            <tr>
              <td>رؤية السعودية 2030</td>
              <td>✅ متوافق</td>
            </tr>

            <tr>
              <td>الذكاء الاصطناعي</td>
              <td>✅ AI Ready</td>
            </tr>

            <tr>
              <td>العمل بدون اتصال</td>
              <td>✅ Offline Ready</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div
        style={{
          marginTop: "30px",
          background: "#fff",
          borderRadius: "14px",
          padding: "20px",
          boxShadow: "0 4px 12px rgba(0,0,0,.08)",
        }}
      >
        <h2>المشاريع الحالية</h2>

        <ul>
          {projects.map((project) => (
            <li key={project.id}>
              <strong>{project.name}</strong>
              {" - "}
              {project.location}
              {" - "}
              {project.completion}%
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
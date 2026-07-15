
import { auth, db } from "./firebase.js";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInAnonymously,
  signOut
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

import {
  collection,
  getCountFromServer,
  getDocs,
  getDoc,
  query,
  orderBy,
  limit,
  doc,
  setDoc,
  serverTimestamp,
  writeBatch,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

const app = document.getElementById("app");

const state = {
  user: null,
  currentView: "dashboard",
  counts: {
    students: 0,
    results: 0,
    courses: 0,
    sessions: 0
  }
};

function showPublicHome() {
  app.innerHTML = `
    <main class="public-home">
      <button id="openAdminLogin" class="admin-login-top">Administrator Login</button>

      <section class="public-hero-card">
        <img src="assets/images/logo.png" class="public-logo" alt="School logo">

        <h1>SAHLAN COLLEGE OF HEALTH SCIENCE AND TECHNOLOGY, JOS</h1>
        <h2 class="animated-result-title">STUDENT RESULT BANK</h2>
        <p class="public-subtitle">Secure Academic Records Management System</p>

        <div id="publicDateTime" class="public-date-time"></div>

        <button id="enterResultBank" class="enter-bank-btn">ENTER RESULT BANK</button>

        <footer>
          © 2026 SAHLAN COLLEGE OF HEALTH SCIENCE AND TECHNOLOGY, JOS
        </footer>
      </section>

      <div id="adminLoginModalHost"></div>
    </main>
  `;

  updatePublicClock();

  document.getElementById("openAdminLogin").addEventListener("click", openAdminLoginModal);
  document.getElementById("enterResultBank").addEventListener("click", async () => {
    const button = document.getElementById("enterResultBank");
    button.disabled = true;
    button.textContent = "OPENING RESULT BANK...";

    try {
      await signInAnonymously(auth);
    } catch (error) {
      button.disabled = false;
      button.textContent = "ENTER RESULT BANK";
      alert(friendlyAuthError(error.code));
    }
  });
}

function updatePublicClock() {
  const area = document.getElementById("publicDateTime");
  if (!area) return;

  const render = () => {
    area.textContent = new Date().toLocaleString("en-NG", {
      dateStyle: "full",
      timeStyle: "medium"
    });
  };

  render();
  setInterval(render, 1000);
}

function openAdminLoginModal() {
  const host = document.getElementById("adminLoginModalHost");

  host.innerHTML = `
    <div class="modal-backdrop" id="adminLoginBackdrop">
      <section class="student-modal" style="max-width:460px">
        <div class="modal-head">
          <h3>Administrator Login</h3>
          <button id="closeAdminLogin" class="icon-btn">✕</button>
        </div>

        <form id="loginForm">
          <div class="form-group">
            <label for="email">Administrator Email</label>
            <input id="email" type="email" required placeholder="admin@example.com">
          </div>

          <div class="form-group" style="margin-top:14px">
            <label for="password">Password</label>
            <input id="password" type="password" required minlength="6" placeholder="Enter password">
          </div>

          <button class="primary-btn" type="submit" style="width:100%;margin-top:18px">LOGIN</button>
          <div id="loginMessage"></div>
        </form>
      </section>
    </div>
  `;

  const close = () => host.innerHTML = "";
  document.getElementById("closeAdminLogin").addEventListener("click", close);
  document.getElementById("adminLoginBackdrop").addEventListener("click", event => {
    if (event.target.id === "adminLoginBackdrop") close();
  });

  document.getElementById("loginForm").addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const message = document.getElementById("loginMessage");

    message.innerHTML = `<div class="message">Signing in...</div>`;

    try {
      await signOut(auth);
      await signInWithEmailAndPassword(auth, email, password);
      close();
    } catch (error) {
      console.error("Firebase login error:", error);
      message.innerHTML = `
        <div class="message error">
          <strong>${friendlyAuthError(error.code)}</strong><br>
          <small>Error code: ${error.code || "unknown"}</small>
        </div>
      `;
    }
  });
}

function friendlyAuthError(code) {
  const messages = {
    "auth/invalid-credential": "Incorrect email or password.",
    "auth/user-not-found": "No administrator account was found.",
    "auth/wrong-password": "Incorrect password.",
    "auth/too-many-requests": "Too many attempts. Please wait and try again.",
    "auth/network-request-failed": "Network error. Check your internet connection."
  };

  return messages[code] || "Login failed. Please check your details.";
}

async function loadCounts() {
  const collections = ["students", "results", "courses", "sessions"];

  await Promise.all(collections.map(async (name) => {
    try {
      const snapshot = await getCountFromServer(collection(db, name));
      state.counts[name] = snapshot.data().count;
    } catch (error) {
      console.warn(`Could not load ${name} count`, error);
      state.counts[name] = 0;
    }
  }));
}


function publicShell(content) {
  app.innerHTML = `
    <div class="public-page-shell">
      <header class="public-topbar">
        <div class="brand">
          <img src="assets/images/logo.png" alt="School logo">
          <div>
            <h1>SAHLAN COLLEGE OF HEALTH SCIENCE AND TECHNOLOGY, JOS</h1>
            <small>Student Result Bank</small>
          </div>
        </div>
        <div class="top-actions">
          <button id="publicHomeBtn" class="secondary-btn">Home</button>
          <button id="publicAdminBtn" class="primary-btn">Administrator Login</button>
        </div>
      </header>
      <main class="public-main">${content}</main>
      <div id="adminLoginModalHost"></div>
    </div>
  `;

  document.getElementById("publicHomeBtn").addEventListener("click", async () => {
    await signOut(auth);
  });
  document.getElementById("publicAdminBtn").addEventListener("click", openAdminLoginModal);
}

async function renderPublicSessions() {
  publicShell(`
    <section class="public-content-card">
      <div class="section-head">
        <div>
          <h3>Select Admission Session</h3>
          <p>Choose the year or session in which the student was admitted.</p>
        </div>
      </div>
      <div class="form-group" style="max-width:420px">
        <label for="publicSessionSearch">Search Session</label>
        <input id="publicSessionSearch" placeholder="Example: 2024/2025">
      </div>
      <div id="publicSessionCards" class="session-grid" style="margin-top:18px"></div>
    </section>
  `);

  document.getElementById("publicSessionSearch").addEventListener("input", loadPublicSessions);
  await loadPublicSessions();
}

async function loadPublicSessions() {
  const area = document.getElementById("publicSessionCards");
  area.innerHTML = `<div class="placeholder">Loading sessions...</div>`;

  try {
    const snap = await getDocs(collection(db, "students"));
    const map = new Map();

    snap.docs.forEach(d => {
      const s = d.data();
      const session = String(s.admissionSession || "").trim();
      if (!session) return;
      if (!map.has(session)) map.set(session, { session, count: 0, departments: new Set() });
      const item = map.get(session);
      item.count += 1;
      if (s.department) item.departments.add(s.department);
    });

    const search = (document.getElementById("publicSessionSearch").value || "").toLowerCase();
    const rows = [...map.values()]
      .filter(item => item.session.toLowerCase().includes(search))
      .sort((a, b) => b.session.localeCompare(a.session));

    area.innerHTML = rows.length ? rows.map(item => `
      <button class="session-card public-session-card" data-session="${escapeHtml(item.session)}">
        <div class="session-icon">📁</div>
        <strong>${escapeHtml(item.session)}</strong>
        <span>${item.count} student${item.count === 1 ? "" : "s"}</span>
        <small>${escapeHtml([...item.departments].join(", "))}</small>
      </button>
    `).join("") : `<div class="placeholder">No admission sessions found.</div>`;

    document.querySelectorAll(".public-session-card").forEach(button => {
      button.addEventListener("click", () => renderPublicStudents(button.dataset.session));
    });
  } catch (error) {
    area.innerHTML = `<div class="message error">${escapeHtml(error.message)}</div>`;
  }
}

async function renderPublicStudents(session) {
  publicShell(`
    <section class="public-content-card">
      <div class="section-head">
        <div>
          <h3>${escapeHtml(session)} Students</h3>
          <p>Select a student to view the academic profile.</p>
        </div>
        <button id="publicBackSessions" class="secondary-btn">← Sessions</button>
      </div>

      <div class="form-grid">
        <div class="form-group">
          <label for="publicStudentSearch">Search Student</label>
          <input id="publicStudentSearch" placeholder="Name or matric number">
        </div>
        <div class="form-group">
          <label for="publicDepartmentFilter">Department</label>
          <select id="publicDepartmentFilter">
            <option value="">All Departments</option>
            <option value="CHEW">CHEW</option>
            <option value="MLT">MLT</option>
          </select>
        </div>
      </div>

      <div id="publicStudentCards" style="margin-top:18px"></div>
    </section>
  `);

  document.getElementById("publicBackSessions").addEventListener("click", renderPublicSessions);
  document.getElementById("publicStudentSearch").addEventListener("input", () => loadPublicStudents(session));
  document.getElementById("publicDepartmentFilter").addEventListener("change", () => loadPublicStudents(session));
  await loadPublicStudents(session);
}

async function loadPublicStudents(session) {
  const area = document.getElementById("publicStudentCards");
  area.innerHTML = `<div class="placeholder">Loading students...</div>`;

  try {
    const snap = await getDocs(collection(db, "students"));
    const search = (document.getElementById("publicStudentSearch").value || "").toLowerCase();
    const department = document.getElementById("publicDepartmentFilter").value;

    const rows = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      .filter(s => s.admissionSession === session)
      .filter(s => !department || s.department === department)
      .filter(s => !search ||
        String(s.name || "").toLowerCase().includes(search) ||
        String(s.matricNumber || "").toLowerCase().includes(search))
      .sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));

    area.innerHTML = rows.length ? `<div class="student-browser-grid">${
      rows.map(s => `
        <button class="student-browser-card public-student-card" data-id="${escapeHtml(s.id)}">
          <div class="student-avatar">${escapeHtml(initials(s.name))}</div>
          <div>
            <strong>${escapeHtml(s.name)}</strong>
            <span>${escapeHtml(s.matricNumber)}</span>
            <small>${escapeHtml(s.department)} • Year ${escapeHtml(s.currentLevel)}</small>
          </div>
        </button>
      `).join("")
    }</div>` : `<div class="placeholder">No matching students found.</div>`;

    document.querySelectorAll(".public-student-card").forEach(button => {
      button.addEventListener("click", () => renderPublicStudentProfile(button.dataset.id, session));
    });
  } catch (error) {
    area.innerHTML = `<div class="message error">${escapeHtml(error.message)}</div>`;
  }
}

async function renderPublicStudentProfile(studentId, session) {
  const ss = await getDocs(collection(db, "students"));
  const sd = ss.docs.find(d => d.id === studentId);
  if (!sd) return alert("Student not found.");

  const student = { id: sd.id, ...sd.data() };
  const rs = await getDocs(collection(db, "results"));
  const results = rs.docs.map(d => ({ id: d.id, ...d.data() }))
    .filter(r => r.studentId === studentId || r.matricNumber === student.matricNumber)
    .sort((a, b) => resultSortKey(a) - resultSortKey(b));

  const latest = results[results.length - 1] || {};
  const years = [...new Set(results.map(r => Number(r.level)).filter(Boolean))].sort();

  publicShell(`
    <section class="public-content-card">
      <div class="section-head">
        <div><h3>Student Academic Profile</h3><p>View yearly results or print the complete transcript.</p></div>
        <button id="publicBackStudents" class="secondary-btn">← Student List</button>
      </div>

      <section class="profile-card">
        <div class="profile-avatar">${escapeHtml(initials(student.name))}</div>
        <div class="profile-details">
          <h2>${escapeHtml(student.name)}</h2>
          <div class="profile-info-grid">
            <div><span>Matric Number</span><strong>${escapeHtml(student.matricNumber)}</strong></div>
            <div><span>Sex</span><strong>${escapeHtml(student.sex || "Not specified")}</strong></div>
            <div><span>Department</span><strong>${escapeHtml(student.department)}</strong></div>
            <div><span>Admission Session</span><strong>${escapeHtml(student.admissionSession)}</strong></div>
            <div><span>Current Level</span><strong>Year ${escapeHtml(student.currentLevel)}</strong></div>
            <div><span>Current CGPA</span><strong>${formatNumber(latest.cgpa)}</strong></div>
            <div><span>Outstanding Carry Overs</span><strong>${Number(latest.carryOvers || 0)}</strong></div>
            <div><span>Current Remark</span><strong>${escapeHtml(latest.remark || "Not available")}</strong></div>
          </div>
        </div>
      </section>

      <section class="section">
        <div class="year-buttons">
          ${years.map(y => `
            <button class="public-year-btn year-result-btn" data-year="${y}">
              <strong>Year ${y}</strong>
              <span>First and Second Semester</span>
            </button>
          `).join("")}
          <button id="publicTranscriptBtn" class="year-result-btn transcript-highlight">
            <strong>Complete Transcript</strong>
            <span>All available semesters</span>
          </button>
        </div>
      </section>

      <section id="publicResultArea" class="section"></section>
    </section>
  `);

  document.getElementById("publicBackStudents").addEventListener("click", () => renderPublicStudents(session));
  document.querySelectorAll(".public-year-btn").forEach(button => {
    button.addEventListener("click", () => renderPublicYearResult(student, results, Number(button.dataset.year)));
  });
  document.getElementById("publicTranscriptBtn").addEventListener("click", () => renderPublicTranscript(student, results));

  if (years.length) renderPublicYearResult(student, results, years[0]);
  else document.getElementById("publicResultArea").innerHTML = `<div class="placeholder">No results available.</div>`;
}

function renderPublicYearResult(student, results, year) {
  const area = document.getElementById("publicResultArea");
  const rows = results.filter(r => Number(r.level) === year).sort((a, b) => resultSortKey(a) - resultSortKey(b));

  area.innerHTML = rows.length ? `
    <div class="result-toolbar no-print"><h3>Year ${year} Result</h3><button id="publicPrintYear" class="primary-btn">Print Year ${year}</button></div>
    <article class="official-result">
      ${officialResultHeader(`YEAR ${year} RESULT`)}
      ${studentIdentitySection(student)}
      ${rows.map(semesterResultBlock).join("")}
      ${yearSummaryBlock(rows)}
      ${signatureSection()}
    </article>
  ` : `<div class="placeholder">No Year ${year} result is available.</div>`;

  document.getElementById("publicPrintYear")?.addEventListener("click", () => window.print());
}

function renderPublicTranscript(student, results) {
  const area = document.getElementById("publicResultArea");
  const levels = [...new Set(results.map(r => Number(r.level)).filter(Boolean))].sort();
  const latest = results[results.length - 1] || {};

  area.innerHTML = `
    <div class="result-toolbar no-print"><h3>Complete Transcript</h3><button id="publicPrintTranscript" class="primary-btn">Print Transcript</button></div>
    <article class="official-result">
      ${officialResultHeader("COMPLETE ACADEMIC TRANSCRIPT")}
      ${studentIdentitySection(student)}
      ${levels.map(level => `
        <section class="transcript-year">
          <h3>YEAR ${level}</h3>
          ${results.filter(r => Number(r.level) === level).sort((a, b) => resultSortKey(a) - resultSortKey(b)).map(semesterResultBlock).join("")}
        </section>
      `).join("")}
      <section class="final-summary">
        <div><span>Final / Current CGPA</span><strong>${formatNumber(latest.cgpa)}</strong></div>
        <div><span>Outstanding Carry Overs</span><strong>${Number(latest.carryOvers || 0)}</strong></div>
        <div><span>Academic Standing</span><strong>${escapeHtml(latest.remark || "")}</strong></div>
      </section>
      ${signatureSection()}
    </article>
  `;

  document.getElementById("publicPrintTranscript").addEventListener("click", () => window.print());
}

function dashboardLayout(content) {
  app.innerHTML = `
    <div class="page-shell">
      <header class="topbar">
        <div class="brand">
          <button id="menuBtn" class="icon-btn mobile-menu">☰</button>
          <img src="assets/images/logo.png" alt="School logo">
          <div>
            <h1>SAHLAN COLLEGE OF HEALTH SCIENCE AND TECHNOLOGY, JOS</h1>
            <small>Student Result Bank</small>
          </div>
        </div>

        <div class="top-actions">
          <button id="homeBtn" class="secondary-btn">Dashboard</button>
          <button id="logoutBtn" class="danger-btn">Logout</button>
        </div>
      </header>

      <div class="layout">
        <aside id="sidebar" class="sidebar">
          <div class="sidebar-title">ADMINISTRATION</div>
          <nav class="nav-list">
            ${navButton("dashboard", "Dashboard")}
            ${navButton("browse", "Browse Result Bank")}
            ${navButton("students", "Manage Students")}
            ${navButton("results", "Manage Results")}
            ${navButton("import", "Import Excel")}
            ${navButton("courses", "Courses")}
            ${navButton("sessions", "Admission Sessions")}
            ${navButton("backup", "Backup & Restore")}
            ${navButton("settings", "School Settings")}
          </nav>
        </aside>

        <main class="main">${content}</main>
      </div>
    </div>
  `;

  document.getElementById("logoutBtn").addEventListener("click", () => signOut(auth));
  document.getElementById("homeBtn").addEventListener("click", () => navigate("dashboard"));
  document.getElementById("menuBtn")?.addEventListener("click", () => {
    document.getElementById("sidebar").classList.toggle("open");
  });

  document.querySelectorAll("[data-view]").forEach((button) => {
    button.addEventListener("click", () => navigate(button.dataset.view));
  });
}

function navButton(view, label) {
  return `
    <button class="nav-btn ${state.currentView === view ? "active" : ""}" data-view="${view}">
      ${label}
    </button>
  `;
}

async function navigate(view) {
  state.currentView = view;

  if (view === "dashboard") {
    await renderDashboard();
  } else if (view === "students") {
    await renderStudents();
  } else if (view === "browse") {
    await renderAdmissionSessionBrowser();
  } else if (view === "settings") {
    await renderSettings();
  } else if (view === "import") {
    renderImportPage();
  } else if (view === "results") {
    await renderResults();
  } else if (view === "courses") {
    await renderCourses();
  } else if (view === "sessions") {
    await renderSessionManagement();
  }
}

async function renderDashboard() {
  await loadCounts();

  const content = `
    <section class="hero">
      <h2>Administrator Dashboard</h2>
      <p>Manage students, courses, results, admission sessions, Excel imports and official academic records.</p>
      <div id="dateTime" class="date-time"></div>
    </section>

    <section class="grid stats-grid">
      ${statCard(state.counts.students, "Total Students")}
      ${statCard(state.counts.results, "Result Records")}
      ${statCard(state.counts.courses, "Courses")}
      ${statCard(state.counts.sessions, "Admission Sessions")}
    </section>

    <section class="section">
      <div class="section-head">
        <h3>Quick Actions</h3>
      </div>
      <div class="grid quick-grid">
        ${quickAction("browse", "Browse Result Bank", "Open students by admission session and print transcripts.")}
        ${quickAction("import", "Import Excel Workbook", "Read students, courses, scores and semester data.")}
        ${quickAction("students", "Manage Students", "View, update and search student records.")}
        ${quickAction("results", "Manage Results", "Review and update student academic records.")}
        ${quickAction("sessions", "Admission Sessions", "Organize students according to admission year.")}
        ${quickAction("courses", "Course Database", "View courses and credit units.")}
        ${quickAction("settings", "School Settings", "Update institution details and grading information.")}
      </div>
    </section>
  `;

  dashboardLayout(content);

  document.querySelectorAll("[data-action]").forEach((button) => {
    button.addEventListener("click", () => navigate(button.dataset.action));
  });

  updateClock();
}

function statCard(value, label) {
  return `
    <article class="card stat-card">
      <h3>${value}</h3>
      <p>${label}</p>
    </article>
  `;
}

function quickAction(view, title, description) {
  return `
    <button class="quick-action" data-action="${view}">
      <strong>${title}</strong>
      <span>${description}</span>
    </button>
  `;
}

function updateClock() {
  const clock = document.getElementById("dateTime");
  if (!clock) return;

  const render = () => {
    const now = new Date();
    clock.textContent = now.toLocaleString("en-NG", {
      dateStyle: "full",
      timeStyle: "medium"
    });
  };

  render();
  setInterval(render, 1000);
}

async function renderStudents() {
  dashboardLayout(`
    <section class="section-head">
      <div>
        <h3>Manage Students</h3>
        <p>Add, search, edit and delete student information.</p>
      </div>
      <button id="addStudentBtn" class="primary-btn">Add Student</button>
    </section>

    <section class="card">
      <div class="form-grid">
        <div class="form-group">
          <label for="studentAdminSearch">Search</label>
          <input id="studentAdminSearch" placeholder="Name or matric number">
        </div>
        <div class="form-group">
          <label for="studentAdminDepartment">Department</label>
          <select id="studentAdminDepartment">
            <option value="">All Departments</option>
            <option value="CHEW">CHEW</option>
            <option value="MLT">MLT</option>
          </select>
        </div>
      </div>
      <div id="studentsArea" class="placeholder" style="margin-top:16px">Loading students...</div>
    </section>

    <div id="studentModalHost"></div>
  `);

  document.getElementById("addStudentBtn").addEventListener("click", () => openStudentModal());
  document.getElementById("studentAdminSearch").addEventListener("input", loadStudentsAdmin);
  document.getElementById("studentAdminDepartment").addEventListener("change", loadStudentsAdmin);
  await loadStudentsAdmin();
}

async function loadStudentsAdmin() {
  const area = document.getElementById("studentsArea");
  if (!area) return;

  area.className = "placeholder";
  area.textContent = "Loading students...";

  try {
    const snapshot = await getDocs(collection(db, "students"));
    let students = snapshot.docs.map(item => ({ id: item.id, ...item.data() }));

    const search = document.getElementById("studentAdminSearch")?.value.trim().toLowerCase() || "";
    const department = document.getElementById("studentAdminDepartment")?.value || "";

    students = students
      .filter(item => !department || item.department === department)
      .filter(item => {
        if (!search) return true;
        return String(item.name || "").toLowerCase().includes(search) ||
          String(item.matricNumber || "").toLowerCase().includes(search);
      })
      .sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));

    if (!students.length) {
      area.className = "placeholder";
      area.textContent = "No students found.";
      return;
    }

    area.className = "table-wrap";
    area.innerHTML = `
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Matric Number</th>
            <th>Sex</th>
            <th>Department</th>
            <th>Admission Session</th>
            <th>Current Level</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${students.map(student => `
            <tr>
              <td>${escapeHtml(student.name)}</td>
              <td>${escapeHtml(student.matricNumber)}</td>
              <td>${escapeHtml(student.sex || "")}</td>
              <td>${escapeHtml(student.department || "")}</td>
              <td>${escapeHtml(student.admissionSession || "")}</td>
              <td>Year ${escapeHtml(student.currentLevel || "")}</td>
              <td class="action-cell">
                <button class="secondary-btn edit-student-btn" data-id="${escapeHtml(student.id)}">Edit</button>
                <button class="danger-btn delete-student-btn" data-id="${escapeHtml(student.id)}" data-name="${escapeHtml(student.name)}">Delete</button>
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    `;

    document.querySelectorAll(".edit-student-btn").forEach(button => {
      button.addEventListener("click", () => openStudentModal(button.dataset.id));
    });

    document.querySelectorAll(".delete-student-btn").forEach(button => {
      button.addEventListener("click", () => deleteStudentRecord(button.dataset.id, button.dataset.name));
    });
  } catch (error) {
    area.className = "message error";
    area.textContent = error.message;
  }
}

async function openStudentModal(studentId = null) {
  const host = document.getElementById("studentModalHost");
  let student = {
    name: "",
    matricNumber: "",
    sex: "",
    department: "CHEW",
    admissionSession: "",
    currentLevel: 1
  };

  if (studentId) {
    const snapshot = await getDoc(doc(db, "students", studentId));
    if (!snapshot.exists()) return alert("Student record not found.");
    student = { id: snapshot.id, ...snapshot.data() };
  }

  host.innerHTML = `
    <div class="modal-backdrop" id="studentModalBackdrop">
      <section class="student-modal">
        <div class="modal-head">
          <h3>${studentId ? "Update Student" : "Add Student"}</h3>
          <button id="closeStudentModal" class="icon-btn">✕</button>
        </div>

        <form id="studentForm" class="form-grid">
          <div class="form-group full">
            <label for="studentName">Full Name</label>
            <input id="studentName" value="${escapeHtml(student.name)}" required>
          </div>

          <div class="form-group">
            <label for="studentMatric">Matric Number</label>
            <input id="studentMatric" value="${escapeHtml(student.matricNumber)}" required ${studentId ? "readonly" : ""}>
          </div>

          <div class="form-group">
            <label for="studentSex">Sex</label>
            <select id="studentSex">
              <option value="">Not specified</option>
              <option value="Male" ${student.sex === "Male" ? "selected" : ""}>Male</option>
              <option value="Female" ${student.sex === "Female" ? "selected" : ""}>Female</option>
            </select>
          </div>

          <div class="form-group">
            <label for="studentDepartment">Department</label>
            <select id="studentDepartment">
              <option value="CHEW" ${student.department === "CHEW" ? "selected" : ""}>CHEW</option>
              <option value="MLT" ${student.department === "MLT" ? "selected" : ""}>MLT</option>
            </select>
          </div>

          <div class="form-group">
            <label for="studentSession">Admission Session</label>
            <input id="studentSession" value="${escapeHtml(student.admissionSession)}" placeholder="2024/2025" required>
          </div>

          <div class="form-group">
            <label for="studentLevel">Current Level</label>
            <select id="studentLevel">
              <option value="1" ${Number(student.currentLevel) === 1 ? "selected" : ""}>Year One</option>
              <option value="2" ${Number(student.currentLevel) === 2 ? "selected" : ""}>Year Two</option>
              <option value="3" ${Number(student.currentLevel) === 3 ? "selected" : ""}>Year Three</option>
            </select>
          </div>

          <div class="full modal-actions">
            <button type="button" id="cancelStudentModal" class="secondary-btn">Cancel</button>
            <button type="submit" class="primary-btn">${studentId ? "Update Student" : "Save Student"}</button>
          </div>

          <div id="studentFormMessage" class="full"></div>
        </form>
      </section>
    </div>
  `;

  const close = () => host.innerHTML = "";
  document.getElementById("closeStudentModal").addEventListener("click", close);
  document.getElementById("cancelStudentModal").addEventListener("click", close);
  document.getElementById("studentModalBackdrop").addEventListener("click", event => {
    if (event.target.id === "studentModalBackdrop") close();
  });

  document.getElementById("studentForm").addEventListener("submit", async event => {
    event.preventDefault();
    const message = document.getElementById("studentFormMessage");
    try {
      const matricNumber = document.getElementById("studentMatric").value.trim();
      const targetId = studentId || safeDocumentId(matricNumber);

      await setDoc(doc(db, "students", targetId), {
        name: document.getElementById("studentName").value.trim(),
        matricNumber,
        sex: document.getElementById("studentSex").value,
        department: document.getElementById("studentDepartment").value,
        admissionSession: document.getElementById("studentSession").value.trim(),
        currentLevel: Number(document.getElementById("studentLevel").value),
        updatedAt: serverTimestamp()
      }, { merge: true });

      message.innerHTML = `<div class="message success">Student information saved.</div>`;
      setTimeout(async () => {
        close();
        await loadStudentsAdmin();
      }, 500);
    } catch (error) {
      message.innerHTML = `<div class="message error">${escapeHtml(error.message)}</div>`;
    }
  });
}

async function deleteStudentRecord(studentId, studentName) {
  const confirmed = confirm(
    `Delete ${studentName}? This removes the student profile only. Existing result records will remain until they are deleted separately.`
  );
  if (!confirmed) return;

  try {
    await deleteDoc(doc(db, "students", studentId));
    await loadStudentsAdmin();
  } catch (error) {
    alert(error.message);
  }
}

async function renderSettings() {
  await loadGradingSettings();

  dashboardLayout(`
    <section class="section-head">
      <div>
        <h3>School and Grading Settings</h3>
        <p>Update institution details, grading boundaries and academic standing rules.</p>
      </div>
    </section>

    <section class="card">
      <form id="settingsForm" class="form-grid">
        <div class="form-group full">
          <label for="schoolName">School Name</label>
          <input id="schoolName" value="SAHLAN COLLEGE OF HEALTH SCIENCE AND TECHNOLOGY, JOS" required>
        </div>

        <div class="form-group">
          <label for="cgpaScale">CGPA Scale</label>
          <input id="cgpaScale" type="number" step="0.1" value="${Number(gradingSettings.scale || 5)}" required>
        </div>

        <div class="form-group">
          <label for="programmeYears">Programme Duration</label>
          <input id="programmeYears" type="number" value="3" required>
        </div>

        <div class="form-group full">
          <label for="departments">Departments</label>
          <textarea id="departments">Medical Laboratory Technician
Community Health Extension Worker (CHEW)</textarea>
        </div>

        <div class="full grading-section">
          <h4>Grading Boundaries</h4>
          <p>Adjust score ranges and grade points. Make sure the ranges do not overlap.</p>

          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Grade</th>
                  <th>Minimum Score</th>
                  <th>Maximum Score</th>
                  <th>Grade Point</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody id="gradingRows">
                ${gradingSettings.bands.map((band, index) => `
                  <tr data-grade-index="${index}">
                    <td><input class="table-input grade-letter" value="${escapeHtml(band.grade)}"></td>
                    <td><input class="table-input grade-min" type="number" min="0" max="100" value="${Number(band.min)}"></td>
                    <td><input class="table-input grade-max" type="number" min="0" max="100" value="${Number(band.max)}"></td>
                    <td><input class="table-input grade-point" type="number" min="0" step="0.1" value="${Number(band.point)}"></td>
                    <td>
                      <select class="table-input grade-status">
                        <option value="Passed" ${band.status === "Passed" ? "selected" : ""}>Passed</option>
                        <option value="Carry Over" ${band.status === "Carry Over" ? "selected" : ""}>Carry Over</option>
                      </select>
                    </td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>
        </div>

        <div class="full grading-section">
          <h4>Academic Standing Rules</h4>
          <div class="form-grid">
            <div class="form-group">
              <label for="warningCgpa">Academic Warning: CGPA below</label>
              <input id="warningCgpa" type="number" min="0" step="0.01" value="${Number(gradingSettings.warningCgpa)}">
            </div>

            <div class="form-group">
              <label for="probationCgpa">Probation: CGPA below</label>
              <input id="probationCgpa" type="number" min="0" step="0.01" value="${Number(gradingSettings.probationCgpa)}">
            </div>

            <div class="form-group">
              <label for="warningCarryOvers">Academic Warning: Carry overs from</label>
              <input id="warningCarryOvers" type="number" min="0" step="1" value="${Number(gradingSettings.warningCarryOvers)}">
            </div>

            <div class="form-group">
              <label for="probationCarryOvers">Probation: Carry overs from</label>
              <input id="probationCarryOvers" type="number" min="0" step="1" value="${Number(gradingSettings.probationCarryOvers)}">
            </div>
          </div>
        </div>

        <div class="full settings-actions">
          <button class="secondary-btn" type="button" id="resetGradingBtn">Restore Default Grading</button>
          <button class="primary-btn" type="submit">Save Settings</button>
        </div>

        <div id="settingsMessage" class="full"></div>
      </form>
    </section>
  `);

  document.getElementById("resetGradingBtn").addEventListener("click", () => {
    gradingSettings = {
      scale: 5,
      bands: structuredClone(DEFAULT_GRADING),
      warningCgpa: 1.5,
      probationCgpa: 1.0,
      warningCarryOvers: 2,
      probationCarryOvers: 4
    };
    renderSettings();
  });

  document.getElementById("settingsForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const message = document.getElementById("settingsMessage");

    try {
      const bands = [...document.querySelectorAll("#gradingRows tr")].map(row => ({
        grade: row.querySelector(".grade-letter").value.trim().toUpperCase(),
        min: Number(row.querySelector(".grade-min").value),
        max: Number(row.querySelector(".grade-max").value),
        point: Number(row.querySelector(".grade-point").value),
        status: row.querySelector(".grade-status").value
      }));

      validateGradingBands(bands);

      const newSettings = {
        scale: Number(document.getElementById("cgpaScale").value),
        bands,
        warningCgpa: Number(document.getElementById("warningCgpa").value),
        probationCgpa: Number(document.getElementById("probationCgpa").value),
        warningCarryOvers: Number(document.getElementById("warningCarryOvers").value),
        probationCarryOvers: Number(document.getElementById("probationCarryOvers").value)
      };

      if (newSettings.probationCgpa > newSettings.warningCgpa) {
        throw new Error("Probation CGPA should not be higher than the academic warning CGPA.");
      }

      if (newSettings.probationCarryOvers < newSettings.warningCarryOvers) {
        throw new Error("Probation carry-over threshold should not be lower than the academic warning threshold.");
      }

      await setDoc(doc(db, "settings", "school"), {
        schoolName: document.getElementById("schoolName").value.trim(),
        cgpaScale: newSettings.scale,
        programmeYears: Number(document.getElementById("programmeYears").value),
        departments: document.getElementById("departments").value
          .split("\n")
          .map(item => item.trim())
          .filter(Boolean),
        gradingSettings: newSettings,
        updatedAt: serverTimestamp()
      }, { merge: true });

      gradingSettings = newSettings;
      message.innerHTML = `<div class="message success">Settings saved. Open Manage Results and recalculate all records to apply the new rules.</div>`;
    } catch (error) {
      message.innerHTML = `<div class="message error">${escapeHtml(error.message)}</div>`;
    }
  });
}

async function loadGradingSettings() {
  try {
    const snapshot = await getDoc(doc(db, "settings", "school"));
    if (!snapshot.exists()) return;

    const data = snapshot.data();
    if (data.gradingSettings) {
      gradingSettings = {
        scale: Number(data.gradingSettings.scale || data.cgpaScale || 5),
        bands: Array.isArray(data.gradingSettings.bands) && data.gradingSettings.bands.length
          ? data.gradingSettings.bands
          : structuredClone(DEFAULT_GRADING),
        warningCgpa: Number(data.gradingSettings.warningCgpa ?? 1.5),
        probationCgpa: Number(data.gradingSettings.probationCgpa ?? 1.0),
        warningCarryOvers: Number(data.gradingSettings.warningCarryOvers ?? 2),
        probationCarryOvers: Number(data.gradingSettings.probationCarryOvers ?? 4)
      };
    }
  } catch (error) {
    console.warn("Could not load grading settings:", error);
  }
}

function validateGradingBands(bands) {
  if (!bands.length) throw new Error("At least one grading band is required.");

  bands.forEach(band => {
    if (!band.grade) throw new Error("Every grading row must have a grade.");
    if (band.min < 0 || band.max > 100 || band.min > band.max) {
      throw new Error(`Invalid score range for grade ${band.grade}.`);
    }
    if (band.point < 0) throw new Error(`Grade point for ${band.grade} cannot be negative.`);
  });

  const sorted = [...bands].sort((a, b) => a.min - b.min);
  for (let index = 1; index < sorted.length; index += 1) {
    if (sorted[index].min <= sorted[index - 1].max) {
      throw new Error(`The score ranges for ${sorted[index - 1].grade} and ${sorted[index].grade} overlap.`);
    }
  }

  const coversZero = sorted[0].min === 0;
  const coversHundred = sorted[sorted.length - 1].max === 100;
  if (!coversZero || !coversHundred) {
    throw new Error("The grading system must cover scores from 0 to 100.");
  }
}

async function renderSessionManagement() {
  dashboardLayout(`
    <section class="section-head">
      <div>
        <h3>Admission Session Management</h3>
        <p>Add, update and organize admission sessions.</p>
      </div>
      <button id="addSessionBtn" class="primary-btn">Add Session</button>
    </section>

    <section class="card">
      <div class="form-group" style="max-width:420px">
        <label for="sessionAdminSearch">Search Session</label>
        <input id="sessionAdminSearch" placeholder="Example: 2024/2025">
      </div>
      <div id="sessionAdminArea" class="placeholder" style="margin-top:18px">Loading sessions...</div>
    </section>

    <div id="sessionModalHost"></div>
  `);

  document.getElementById("addSessionBtn").addEventListener("click", () => openSessionModal());
  document.getElementById("sessionAdminSearch").addEventListener("input", loadSessionManagement);
  await loadSessionManagement();
}

async function loadSessionManagement() {
  const area = document.getElementById("sessionAdminArea");
  if (!area) return;

  area.className = "placeholder";
  area.textContent = "Loading sessions...";

  try {
    const sessionSnapshot = await getDocs(collection(db, "sessions"));
    const studentSnapshot = await getDocs(collection(db, "students"));

    const studentCounts = new Map();
    studentSnapshot.docs.forEach(item => {
      const session = String(item.data().admissionSession || "").trim();
      if (!session) return;
      studentCounts.set(session, (studentCounts.get(session) || 0) + 1);
    });

    let sessions = sessionSnapshot.docs.map(item => ({ id: item.id, ...item.data() }));

    const existingIds = new Set(sessions.map(item => item.admissionSession));
    studentCounts.forEach((count, session) => {
      if (!existingIds.has(session)) {
        sessions.push({
          id: safeDocumentId(session),
          admissionSession: session,
          status: "Active",
          note: "",
          studentCount: count
        });
      }
    });

    const search = document.getElementById("sessionAdminSearch")?.value.trim().toLowerCase() || "";

    sessions = sessions
      .map(item => ({
        ...item,
        studentCount: studentCounts.get(item.admissionSession) || 0
      }))
      .filter(item => !search || String(item.admissionSession || "").toLowerCase().includes(search))
      .sort((a, b) => String(b.admissionSession || "").localeCompare(String(a.admissionSession || "")));

    if (!sessions.length) {
      area.className = "placeholder";
      area.textContent = "No admission sessions found.";
      return;
    }

    area.className = "table-wrap";
    area.innerHTML = `
      <table>
        <thead>
          <tr>
            <th>Admission Session</th>
            <th>Status</th>
            <th>Students</th>
            <th>Note</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${sessions.map(item => `
            <tr>
              <td>${escapeHtml(item.admissionSession)}</td>
              <td><span class="status-badge ${String(item.status || "Active").toLowerCase()}">${escapeHtml(item.status || "Active")}</span></td>
              <td>${Number(item.studentCount || 0)}</td>
              <td>${escapeHtml(item.note || "")}</td>
              <td class="action-cell">
                <button class="secondary-btn edit-session-btn" data-id="${escapeHtml(item.id)}" data-session="${escapeHtml(item.admissionSession)}">Edit</button>
                <button class="danger-btn delete-session-btn" data-id="${escapeHtml(item.id)}" data-session="${escapeHtml(item.admissionSession)}">Delete</button>
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    `;

    document.querySelectorAll(".edit-session-btn").forEach(button => {
      button.addEventListener("click", () => openSessionModal(button.dataset.id, button.dataset.session));
    });

    document.querySelectorAll(".delete-session-btn").forEach(button => {
      button.addEventListener("click", () => deleteAdmissionSession(button.dataset.id, button.dataset.session));
    });
  } catch (error) {
    area.className = "message error";
    area.textContent = error.message;
  }
}

async function openSessionModal(sessionId = null, fallbackSession = "") {
  const host = document.getElementById("sessionModalHost");
  let session = {
    admissionSession: fallbackSession,
    status: "Active",
    note: ""
  };

  if (sessionId) {
    const snapshot = await getDoc(doc(db, "sessions", sessionId));
    if (snapshot.exists()) {
      session = { id: snapshot.id, ...snapshot.data() };
    }
  }

  host.innerHTML = `
    <div class="modal-backdrop" id="sessionModalBackdrop">
      <section class="student-modal" style="max-width:560px">
        <div class="modal-head">
          <h3>${sessionId ? "Update Admission Session" : "Add Admission Session"}</h3>
          <button id="closeSessionModal" class="icon-btn">✕</button>
        </div>

        <form id="sessionForm" class="form-grid">
          <div class="form-group full">
            <label for="sessionValue">Admission Session</label>
            <input id="sessionValue" value="${escapeHtml(session.admissionSession || "")}" placeholder="2024/2025" required ${sessionId ? "readonly" : ""}>
          </div>

          <div class="form-group full">
            <label for="sessionStatus">Status</label>
            <select id="sessionStatus">
              <option value="Active" ${session.status === "Active" ? "selected" : ""}>Active</option>
              <option value="Closed" ${session.status === "Closed" ? "selected" : ""}>Closed</option>
              <option value="Archived" ${session.status === "Archived" ? "selected" : ""}>Archived</option>
            </select>
          </div>

          <div class="form-group full">
            <label for="sessionNote">Note</label>
            <textarea id="sessionNote" placeholder="Optional information">${escapeHtml(session.note || "")}</textarea>
          </div>

          <div class="full modal-actions">
            <button type="button" id="cancelSessionModal" class="secondary-btn">Cancel</button>
            <button type="submit" class="primary-btn">${sessionId ? "Update Session" : "Save Session"}</button>
          </div>

          <div id="sessionFormMessage" class="full"></div>
        </form>
      </section>
    </div>
  `;

  const close = () => host.innerHTML = "";
  document.getElementById("closeSessionModal").addEventListener("click", close);
  document.getElementById("cancelSessionModal").addEventListener("click", close);
  document.getElementById("sessionModalBackdrop").addEventListener("click", event => {
    if (event.target.id === "sessionModalBackdrop") close();
  });

  document.getElementById("sessionForm").addEventListener("submit", async event => {
    event.preventDefault();
    const message = document.getElementById("sessionFormMessage");

    try {
      const admissionSession = document.getElementById("sessionValue").value.trim();
      if (!/^\d{4}\/\d{4}$/.test(admissionSession)) {
        message.innerHTML = `<div class="message error">Use this format: 2024/2025.</div>`;
        return;
      }

      const targetId = sessionId || safeDocumentId(admissionSession);
      await setDoc(doc(db, "sessions", targetId), {
        admissionSession,
        status: document.getElementById("sessionStatus").value,
        note: document.getElementById("sessionNote").value.trim(),
        updatedAt: serverTimestamp()
      }, { merge: true });

      message.innerHTML = `<div class="message success">Admission session saved.</div>`;
      setTimeout(async () => {
        close();
        await loadSessionManagement();
      }, 500);
    } catch (error) {
      message.innerHTML = `<div class="message error">${escapeHtml(error.message)}</div>`;
    }
  });
}

async function deleteAdmissionSession(sessionId, admissionSession) {
  const studentSnapshot = await getDocs(collection(db, "students"));
  const linkedStudents = studentSnapshot.docs.filter(item => item.data().admissionSession === admissionSession).length;

  if (linkedStudents > 0) {
    alert(`This session cannot be deleted because ${linkedStudents} student record(s) are linked to it. Change those students' admission sessions first.`);
    return;
  }

  const confirmed = confirm(`Delete admission session ${admissionSession}?`);
  if (!confirmed) return;

  try {
    await deleteDoc(doc(db, "sessions", sessionId));
    await loadSessionManagement();
  } catch (error) {
    alert(error.message);
  }
}


function renderBackupRestore() {
  dashboardLayout(`
    <section class="section-head">
      <div>
        <h3>Backup and Restore</h3>
        <p>Export the main Firestore collections to one JSON file or restore them later.</p>
      </div>
    </section>

    <section class="grid backup-grid">
      <article class="card">
        <h3>Download Backup</h3>
        <p>Creates a JSON backup containing students, results, courses, sessions and settings.</p>
        <button id="downloadBackupBtn" class="primary-btn" style="margin-top:16px">Download Backup</button>
        <div id="backupMessage"></div>
      </article>

      <article class="card">
        <h3>Restore Backup</h3>
        <p>Select a backup JSON file created by this system. Existing matching records will be updated.</p>
        <input id="restoreFile" type="file" accept=".json" style="margin-top:16px">
        <button id="restoreBackupBtn" class="secondary-btn" style="margin-top:12px">Preview Backup</button>
        <div id="restorePreview"></div>
        <div id="restoreMessage"></div>
      </article>
    </section>
  `);

  document.getElementById("downloadBackupBtn").addEventListener("click", downloadFirestoreBackup);
  document.getElementById("restoreBackupBtn").addEventListener("click", previewRestoreBackup);
}

async function downloadFirestoreBackup() {
  const button = document.getElementById("downloadBackupBtn");
  const message = document.getElementById("backupMessage");
  const collectionNames = ["students", "results", "courses", "sessions", "settings"];

  button.disabled = true;
  button.textContent = "Preparing Backup...";
  message.innerHTML = "";

  try {
    const backup = {
      app: "SAHLAN RESULT BANK",
      version: 1,
      exportedAt: new Date().toISOString(),
      collections: {}
    };

    for (const name of collectionNames) {
      const snapshot = await getDocs(collection(db, name));
      backup.collections[name] = snapshot.docs.map(item => ({
        id: item.id,
        data: serializeFirestoreData(item.data())
      }));
    }

    const json = JSON.stringify(backup, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    anchor.href = url;
    anchor.download = `SAHLAN-Result-Bank-Backup-${stamp}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);

    message.innerHTML = `<div class="message success">Backup downloaded successfully.</div>`;
  } catch (error) {
    message.innerHTML = `<div class="message error">${escapeHtml(error.message)}</div>`;
  } finally {
    button.disabled = false;
    button.textContent = "Download Backup";
  }
}

function serializeFirestoreData(value) {
  if (value === null || value === undefined) return value;

  if (Array.isArray(value)) {
    return value.map(serializeFirestoreData);
  }

  if (typeof value === "object") {
    if (typeof value.toDate === "function") {
      return {
        __type: "timestamp",
        value: value.toDate().toISOString()
      };
    }

    const output = {};
    for (const [key, item] of Object.entries(value)) {
      output[key] = serializeFirestoreData(item);
    }
    return output;
  }

  return value;
}

let pendingRestoreBackup = null;

async function previewRestoreBackup() {
  const input = document.getElementById("restoreFile");
  const preview = document.getElementById("restorePreview");
  const message = document.getElementById("restoreMessage");

  if (!input.files.length) {
    message.innerHTML = `<div class="message error">Select a backup JSON file first.</div>`;
    return;
  }

  try {
    const text = await input.files[0].text();
    const backup = JSON.parse(text);

    if (!backup.collections || typeof backup.collections !== "object") {
      throw new Error("This is not a valid SAHLAN Result Bank backup.");
    }

    const allowedCollections = ["students", "results", "courses", "sessions", "settings"];
    const counts = {};

    for (const name of allowedCollections) {
      counts[name] = Array.isArray(backup.collections[name])
        ? backup.collections[name].length
        : 0;
    }

    pendingRestoreBackup = backup;

    preview.innerHTML = `
      <div class="preview-summary">
        <article><strong>${counts.students}</strong><span>Students</span></article>
        <article><strong>${counts.results}</strong><span>Results</span></article>
        <article><strong>${counts.courses}</strong><span>Courses</span></article>
        <article><strong>${counts.sessions}</strong><span>Sessions</span></article>
      </div>
      <button id="confirmRestoreBtn" class="danger-btn">Restore This Backup</button>
      <div class="progress-shell"><div id="restoreProgressBar" class="progress-bar"></div></div>
    `;

    document.getElementById("confirmRestoreBtn").addEventListener("click", restoreFirestoreBackup);
    message.innerHTML = `<div class="message success">Backup preview is ready.</div>`;
  } catch (error) {
    pendingRestoreBackup = null;
    preview.innerHTML = "";
    message.innerHTML = `<div class="message error">${escapeHtml(error.message)}</div>`;
  }
}

async function restoreFirestoreBackup() {
  if (!pendingRestoreBackup) return;

  const confirmed = confirm(
    "Restore this backup? Existing records with the same document IDs will be updated."
  );
  if (!confirmed) return;

  const button = document.getElementById("confirmRestoreBtn");
  const progressBar = document.getElementById("restoreProgressBar");
  const message = document.getElementById("restoreMessage");
  const allowedCollections = ["students", "results", "courses", "sessions", "settings"];

  button.disabled = true;
  button.textContent = "Restoring...";

  try {
    const writes = [];

    for (const collectionName of allowedCollections) {
      const items = pendingRestoreBackup.collections[collectionName] || [];
      items.forEach(item => {
        if (!item.id || !item.data) return;
        writes.push({
          reference: doc(db, collectionName, item.id),
          data: deserializeBackupData(item.data)
        });
      });
    }

    const chunkSize = 400;
    let completed = 0;

    for (let start = 0; start < writes.length; start += chunkSize) {
      const batch = writeBatch(db);
      const chunk = writes.slice(start, start + chunkSize);

      chunk.forEach(item => {
        batch.set(item.reference, item.data, { merge: true });
      });

      await batch.commit();
      completed += chunk.length;
      progressBar.style.width = `${Math.round((completed / writes.length) * 100)}%`;
    }

    message.innerHTML = `<div class="message success">${writes.length} records restored successfully.</div>`;
    button.textContent = "Restore Completed";
    await loadCounts();
  } catch (error) {
    button.disabled = false;
    button.textContent = "Try Restore Again";
    message.innerHTML = `<div class="message error">${escapeHtml(error.message)}</div>`;
  }
}

function deserializeBackupData(value) {
  if (value === null || value === undefined) return value;

  if (Array.isArray(value)) {
    return value.map(deserializeBackupData);
  }

  if (typeof value === "object") {
    if (value.__type === "timestamp" && value.value) {
      return new Date(value.value);
    }

    const output = {};
    for (const [key, item] of Object.entries(value)) {
      output[key] = deserializeBackupData(item);
    }
    return output;
  }

  return value;
}

function renderPlaceholder(title, description) {
  dashboardLayout(`
    <section class="section-head">
      <div>
        <h3>${title}</h3>
        <p>${description}</p>
      </div>
    </section>
    <div class="placeholder">${description}</div>
  `);
}



async function renderCourses() {
  dashboardLayout(`
    <section class="section-head">
      <div>
        <h3>Course Management</h3>
        <p>Add courses once. Result uploads will link every course code to its title and credit unit.</p>
      </div>
    </section>

    <section class="card">
      <form id="courseForm" class="form-grid">
        <div class="form-group">
          <label for="courseCode">Course Code</label>
          <input id="courseCode" placeholder="Example: CHE 111" required>
        </div>
        <div class="form-group">
          <label for="courseTitle">Full Course Title</label>
          <input id="courseTitle" placeholder="Example: Introduction to Community Health" required>
        </div>
        <div class="form-group">
          <label for="courseUnit">Credit Unit</label>
          <input id="courseUnit" type="number" min="1" max="20" required>
        </div>
        <div class="form-group">
          <label for="courseDepartment">Department</label>
          <select id="courseDepartment">
            <option value="CHEW">Community Health Extension Worker (CHEW)</option>
            <option value="MLT">Medical Laboratory Technician (MLT)</option>
          </select>
        </div>
        <div class="form-group">
          <label for="courseLevel">Level</label>
          <select id="courseLevel">
            <option value="1">Year One</option>
            <option value="2">Year Two</option>
            <option value="3">Year Three</option>
          </select>
        </div>
        <div class="form-group">
          <label for="courseSemester">Semester</label>
          <select id="courseSemester">
            <option value="First Semester">First Semester</option>
            <option value="Second Semester">Second Semester</option>
          </select>
        </div>
        <div class="full">
          <button class="primary-btn" type="submit">Save Course</button>
          <span id="courseMessage"></span>
        </div>
      </form>
    </section>

    <section class="card section">
      <div class="section-head">
        <div>
          <h3>Import Course List</h3>
          <p>Excel headings: Course Code, Course Title, Unit, Department, Level, Semester.</p>
        </div>
      </div>
      <input id="courseExcelFile" type="file" accept=".xlsx,.xls">
      <button id="importCoursesBtn" class="secondary-btn" style="margin-left:8px">Import Courses</button>
      <div id="courseImportMessage"></div>
    </section>

    <section class="section">
      <div class="section-head"><h3>Saved Courses</h3></div>
      <div id="courseTableArea" class="placeholder">Loading courses...</div>
    </section>
  `);

  document.getElementById("courseForm").addEventListener("submit", saveCourse);
  document.getElementById("importCoursesBtn").addEventListener("click", importCourseWorkbook);
  await loadCourseTable();
}

async function saveCourse(event) {
  event.preventDefault();
  const code = normalizeCourseCode(document.getElementById("courseCode").value);
  const message = document.getElementById("courseMessage");
  if (!code) {
    message.innerHTML = `<span class="message error">Enter a valid course code.</span>`;
    return;
  }

  const data = {
    courseCode: code,
    courseTitle: document.getElementById("courseTitle").value.trim(),
    units: Number(document.getElementById("courseUnit").value),
    department: document.getElementById("courseDepartment").value,
    level: Number(document.getElementById("courseLevel").value),
    semester: document.getElementById("courseSemester").value,
    updatedAt: serverTimestamp()
  };
  const id = courseDocumentId(data);
  try {
    await setDoc(doc(db, "courses", id), data, { merge: true });
    message.innerHTML = `<span class="message success">Course saved successfully.</span>`;
    document.getElementById("courseForm").reset();
    await loadCourseTable();
  } catch (error) {
    message.innerHTML = `<span class="message error">${escapeHtml(error.message)}</span>`;
  }
}

async function loadCourseTable() {
  const area = document.getElementById("courseTableArea");
  try {
    const snapshot = await getDocs(collection(db, "courses"));
    const courses = snapshot.docs.map(item => ({ id: item.id, ...item.data() }))
      .sort((a,b) => `${a.department}${a.level}${a.semester}${a.courseCode}`.localeCompare(`${b.department}${b.level}${b.semester}${b.courseCode}`));
    if (!courses.length) {
      area.className = "placeholder";
      area.textContent = "No courses saved yet.";
      return;
    }
    area.className = "table-wrap";
    area.innerHTML = `<table><thead><tr><th>Code</th><th>Course Title</th><th>Unit</th><th>Department</th><th>Level</th><th>Semester</th><th>Action</th></tr></thead><tbody>${courses.map(c => `
      <tr><td>${escapeHtml(c.courseCode || "")}</td><td>${escapeHtml(c.courseTitle || "")}</td><td>${c.units || ""}</td><td>${escapeHtml(c.department || "")}</td><td>${c.level || ""}</td><td>${escapeHtml(c.semester || "")}</td><td><button class="danger-btn" data-delete-course="${c.id}">Delete</button></td></tr>`).join("")}</tbody></table>`;
    area.querySelectorAll("[data-delete-course]").forEach(btn => btn.addEventListener("click", async () => {
      if (!confirm("Delete this course?")) return;
      await deleteDoc(doc(db, "courses", btn.dataset.deleteCourse));
      await loadCourseTable();
    }));
  } catch (error) {
    area.className = "message error";
    area.textContent = error.message;
  }
}

async function importCourseWorkbook() {
  const input = document.getElementById("courseExcelFile");
  const message = document.getElementById("courseImportMessage");
  if (!input.files.length) {
    message.innerHTML = `<div class="message error">Select a course Excel file.</div>`;
    return;
  }
  try {
    const buffer = await input.files[0].arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array" });
    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { defval: "" });
    const mapped = rows.map(row => ({
      courseCode: normalizeCourseCode(row["Course Code"] || row["COURSE CODE"] || row["Code"] || row["CODE"]),
      courseTitle: String(row["Course Title"] || row["COURSE TITLE"] || row["Title"] || row["TITLE"] || "").trim(),
      units: Number(row["Unit"] || row["UNIT"] || row["Credit Unit"] || row["CREDIT UNIT"]),
      department: String(row["Department"] || row["DEPARTMENT"] || "").trim().toUpperCase(),
      level: Number(row["Level"] || row["LEVEL"]),
      semester: normalizeSemester(row["Semester"] || row["SEMESTER"])
    })).filter(c => c.courseCode && c.courseTitle && c.units && c.department && c.level && c.semester);
    if (!mapped.length) throw new Error("No valid course rows were found.");
    for (let start=0; start<mapped.length; start+=400) {
      const batch=writeBatch(db);
      mapped.slice(start,start+400).forEach(c => batch.set(doc(db,"courses",courseDocumentId(c)), {...c, updatedAt:serverTimestamp()}, {merge:true}));
      await batch.commit();
    }
    message.innerHTML = `<div class="message success">${mapped.length} courses imported successfully.</div>`;
    await loadCourseTable();
  } catch (error) {
    message.innerHTML = `<div class="message error">${escapeHtml(error.message)}</div>`;
  }
}

function courseDocumentId(course) {
  return safeDocumentId(`${course.department}_${course.courseCode}_${course.level}_${course.semester}`);
}

function normalizeSemester(value) {
  const text = String(value || "").trim().toLowerCase();
  if (text.includes("first") || text === "1" || text === "1st") return "First Semester";
  if (text.includes("second") || text === "2" || text === "2nd") return "Second Semester";
  return "";
}

function renderImportPage() {
  dashboardLayout(`
    <section class="section-head">
      <div>
        <h3>Import Excel Workbook</h3>
        <p>Preview the workbook first, then save students, courses, sessions and results to Firestore.</p>
      </div>
    </section>

    <section class="card import-panel">
      <div class="import-note">
        Recommended result format: <span class="code-note">FULL NAME</span>,
        <span class="code-note">MATRIC NUMBER</span>, <span class="code-note">SEX</span>,
        followed by one column for each course code. Enter scores only. GPA, CGPA, grades,
        credit points, carry-overs and remarks will be calculated by the system.
      </div>

      <div class="form-grid">
        <div class="form-group">
          <label for="importDepartment">Department</label>
          <select id="importDepartment">
            <option value="CHEW">Community Health Extension Worker (CHEW)</option>
            <option value="MLT">Medical Laboratory Technician (MLT)</option>
          </select>
        </div>

        <div class="form-group">
          <label for="admissionSession">Admission Session</label>
          <input id="admissionSession" placeholder="Example: 2024/2025" required>
        </div>

        <div class="form-group">
          <label for="resultSession">Result Session</label>
          <input id="resultSession" placeholder="Example: 2024/2025" required>
        </div>

        <div class="form-group">
          <label for="level">Level</label>
          <select id="level">
            <option value="1">Year One</option>
            <option value="2">Year Two</option>
            <option value="3">Year Three</option>
          </select>
        </div>

        <div class="form-group">
          <label for="semester">Semester</label>
          <select id="semester">
            <option value="First Semester">First Semester</option>
            <option value="Second Semester">Second Semester</option>
          </select>
        </div>
      </div>

      <div class="file-drop">
        <div>
          <strong>Select an Excel workbook</strong>
          <p>.xlsx or .xls files are accepted. The original Excel file is not uploaded to Firebase.</p>
          <input id="excelFile" type="file" accept=".xlsx,.xls">
        </div>
      </div>

      <div>
        <button id="previewWorkbookBtn" class="secondary-btn">Preview Workbook</button>
      </div>

      <div id="importMessage"></div>
      <div id="importPreview"></div>
    </section>
  `);

  document.getElementById("previewWorkbookBtn").addEventListener("click", previewWorkbook);
}

let pendingImport = null;

async function previewWorkbook() {
  const fileInput = document.getElementById("excelFile");
  const message = document.getElementById("importMessage");
  const preview = document.getElementById("importPreview");

  if (!window.XLSX) {
    message.innerHTML = `<div class="message error">SheetJS did not load. Check your internet connection and refresh the page.</div>`;
    return;
  }

  if (!fileInput.files.length) {
    message.innerHTML = `<div class="message error">Please select an Excel workbook first.</div>`;
    return;
  }

  const metadata = readImportMetadata();
  if (!metadata.admissionSession || !metadata.resultSession) {
    message.innerHTML = `<div class="message error">Enter both the admission session and result session.</div>`;
    return;
  }

  message.innerHTML = `<div class="message">Reading workbook...</div>`;
  preview.innerHTML = "";

  try {
    const arrayBuffer = await fileInput.files[0].arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, {
      type: "array",
      cellDates: true,
      cellFormula: true,
      cellNF: false
    });

    const parsedSheets = [];

    for (const sheetName of workbook.SheetNames) {
      const worksheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        defval: null,
        raw: true
      });

      const parsed = parseSahlanSheet(sheetName, rows, metadata);
      if (parsed && parsed.students.length) {
        parsedSheets.push(parsed);
      }
    }

    if (!parsedSheets.length) {
      throw new Error("No valid result sheet was detected. The sheet must contain FULL NAMES and MAT.NO headings.");
    }

    pendingImport = await mergeParsedSheets(parsedSheets, metadata);
    renderImportPreview(pendingImport);
    message.innerHTML = `<div class="message success">Workbook preview is ready. Review it before importing.</div>`;
  } catch (error) {
    console.error(error);
    pendingImport = null;
    message.innerHTML = `<div class="message error">${escapeHtml(error.message)}</div>`;
  }
}

function readImportMetadata() {
  return {
    department: document.getElementById("importDepartment").value,
    admissionSession: document.getElementById("admissionSession").value.trim(),
    resultSession: document.getElementById("resultSession").value.trim(),
    level: Number(document.getElementById("level").value),
    semester: document.getElementById("semester").value
  };
}

function parseSahlanSheet(sheetName, rows, metadata) {
  if (!rows.length) return null;
  let headerRowIndex = -1;
  let nameColumn = -1;
  let matricColumn = -1;
  let sexColumn = -1;

  for (let rowIndex = 0; rowIndex < Math.min(rows.length, 30); rowIndex += 1) {
    const normalized = rows[rowIndex].map(normalizeHeader);
    nameColumn = normalized.findIndex(value => ["FULL NAMES", "FULL NAME", "STUDENT NAME", "NAME"].includes(value));
    matricColumn = normalized.findIndex(value => ["MAT.NO", "MAT NO", "MATRIC NO", "MATRIC NUMBER", "MATRICULATION NUMBER"].includes(value));
    sexColumn = normalized.findIndex(value => ["SEX", "GENDER"].includes(value));
    if (nameColumn >= 0 && matricColumn >= 0) { headerRowIndex = rowIndex; break; }
  }
  if (headerRowIndex < 0) return null;

  const header = rows[headerRowIndex].map(value => value == null ? "" : String(value).trim());
  const protectedHeaders = new Set(["FULL NAMES","FULL NAME","STUDENT NAME","NAME","MAT.NO","MAT NO","MATRIC NO","MATRIC NUMBER","MATRICULATION NUMBER","SEX","GENDER","DEPARTMENT","ADMISSION SESSION"]);
  const courseColumns = [];
  header.forEach((value, column) => {
    const normalized = normalizeHeader(value);
    const code = normalizeCourseCode(value);
    if (column > matricColumn && code && !protectedHeaders.has(normalized) && !isSummaryHeader(normalized)) courseColumns.push({ column, code });
  });

  const students = [];
  for (let rowIndex = headerRowIndex + 1; rowIndex < rows.length; rowIndex += 1) {
    const row = rows[rowIndex];
    const name = cleanCell(row[nameColumn]);
    const matricNumber = cleanCell(row[matricColumn]);
    if (!name || !matricNumber || isLikelyFooter(name, matricNumber)) continue;
    const courses = courseColumns.map(course => ({ courseCode: course.code, score: numericValue(row[course.column]) })).filter(course => course.score !== null);
    if (!courses.length) continue;
    students.push({
      name,
      matricNumber,
      sex: sexColumn >= 0 ? normalizeSex(row[sexColumn]) : "",
      department: metadata.department,
      admissionSession: metadata.admissionSession,
      currentLevel: metadata.level,
      courses
    });
  }
  return { sheetName, headerRow: headerRowIndex + 1, courses: courseColumns, students };
}

async function mergeParsedSheets(parsedSheets, metadata) {
  const studentsMap = new Map();
  const courseCodes = new Set();
  parsedSheets.forEach(sheet => {
    sheet.courses.forEach(course => courseCodes.add(course.code));
    sheet.students.forEach(student => studentsMap.set(student.matricNumber, student));
  });

  const courseSnapshot = await getDocs(collection(db, "courses"));
  const catalogue = new Map();
  courseSnapshot.docs.forEach(item => {
    const c = item.data();
    if (c.department === metadata.department && Number(c.level) === metadata.level && c.semester === metadata.semester) catalogue.set(normalizeCourseCode(c.courseCode), c);
  });

  const missingCourses = [...courseCodes].filter(code => !catalogue.has(code));
  const students = [...studentsMap.values()].map(student => ({
    ...student,
    courses: student.courses.map(course => {
      const details = catalogue.get(course.courseCode) || {};
      return { ...course, courseTitle: details.courseTitle || "", units: Number(details.units || 0) };
    })
  }));

  return {
    metadata,
    sheets: parsedSheets.map(sheet => ({ name: sheet.sheetName, students: sheet.students.length, courses: sheet.courses.length, headerRow: sheet.headerRow })),
    students,
    courses: [...courseCodes],
    missingCourses
  };
}

function normalizeSex(value) {
  const text = String(value || "").trim().toLowerCase();
  if (["m","male"].includes(text)) return "Male";
  if (["f","female"].includes(text)) return "Female";
  return String(value || "").trim();
}

function renderImportPreview(data) {
  const preview = document.getElementById("importPreview");

  preview.innerHTML = `
    ${data.missingCourses.length ? `<div class="message error"><strong>Missing course definitions:</strong> ${data.missingCourses.map(escapeHtml).join(", ")}. Add them under Courses before importing.</div>` : ""}
    <div class="preview-summary">
      <article><strong>${data.sheets.length}</strong><span>Detected Sheets</span></article>
      <article><strong>${data.students.length}</strong><span>Students</span></article>
      <article><strong>${data.courses.length}</strong><span>Courses</span></article>
      <article><strong>${data.metadata.level}</strong><span>Academic Level</span></article>
    </div>

    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Student Name</th>
            <th>Matric Number</th>
            <th>Courses Found</th>
            <th>Sex</th>
            <th>Courses Found</th>
            <th>Course Definitions</th>
          </tr>
        </thead>
        <tbody>
          ${data.students.slice(0, 20).map((student) => `
            <tr>
              <td>${escapeHtml(student.name)}</td>
              <td>${escapeHtml(student.matricNumber)}</td>
              <td>${escapeHtml(student.sex || "")}</td>
              <td>${student.courses.length}</td>
              <td>${student.courses.filter(c => c.courseTitle && c.units).length}/${student.courses.length}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>

    ${data.students.length > 20 ? `<p style="margin-top:10px;color:var(--muted)">Showing the first 20 students only.</p>` : ""}

    <div style="margin-top:18px">
      <button id="confirmImportBtn" class="primary-btn" ${data.missingCourses.length ? "disabled" : ""}>${data.missingCourses.length ? "Add Missing Courses First" : "Import to Firestore"}</button>
      <div class="progress-shell"><div id="importProgressBar" class="progress-bar"></div></div>
      <div id="saveImportMessage"></div>
    </div>
  `;

  document.getElementById("confirmImportBtn").addEventListener("click", saveImportToFirestore);
}

async function saveImportToFirestore() {
  if (!pendingImport) return;

  const button = document.getElementById("confirmImportBtn");
  const progressBar = document.getElementById("importProgressBar");
  const message = document.getElementById("saveImportMessage");

  button.disabled = true;
  button.textContent = "Importing...";
  message.innerHTML = "";

  try {
    const writes = buildFirestoreWrites(pendingImport);
    const chunkSize = 400;
    let completed = 0;

    for (let start = 0; start < writes.length; start += chunkSize) {
      const batch = writeBatch(db);
      const chunk = writes.slice(start, start + chunkSize);

      chunk.forEach((item) => {
        batch.set(item.reference, item.data, { merge: true });
      });

      await batch.commit();
      completed += chunk.length;
      progressBar.style.width = `${Math.round((completed / writes.length) * 100)}%`;
    }

    message.innerHTML = `
      <div class="message success">
        Import completed successfully: ${pendingImport.students.length} students,
        ${pendingImport.students.length} semester result records. Course titles and units were linked from Course Management.
      </div>
    `;
    button.textContent = "Import Completed";
    await loadCounts();
  } catch (error) {
    console.error(error);
    button.disabled = false;
    button.textContent = "Try Import Again";
    message.innerHTML = `<div class="message error">${escapeHtml(error.message)}</div>`;
  }
}

function buildFirestoreWrites(data) {
  const writes = [];
  const now = serverTimestamp();
  const sessionId = safeDocumentId(data.metadata.admissionSession);
  const resultSessionId = safeDocumentId(data.metadata.resultSession);

  writes.push({
    reference: doc(db, "sessions", sessionId),
    data: {
      admissionSession: data.metadata.admissionSession,
      department: data.metadata.department,
      updatedAt: now
    }
  });

  data.students.forEach((student) => {
    const studentId = safeDocumentId(student.matricNumber);
    const resultId = safeDocumentId(
      `${student.matricNumber}_${data.metadata.resultSession}_${data.metadata.level}_${data.metadata.semester}`
    );

    writes.push({
      reference: doc(db, "students", studentId),
      data: {
        name: student.name,
        matricNumber: student.matricNumber,
        sex: student.sex || "",
        department: student.department,
        admissionSession: student.admissionSession,
        currentLevel: student.currentLevel,
        updatedAt: now
      }
    });

    writes.push({
      reference: doc(db, "results", resultId),
      data: {
        studentId,
        matricNumber: student.matricNumber,
        studentName: student.name,
        department: student.department,
        admissionSession: student.admissionSession,
        resultSession: data.metadata.resultSession,
        level: data.metadata.level,
        semester: data.metadata.semester,
        courses: calculateCourseRows(student.courses),
        ...calculateSemesterSummary(student.courses),
        cgpa: null,
        unresolvedCarryOvers: [],
        calculationStatus: "semester-calculated",
        sourceSheets: data.sheets.map((sheet) => sheet.name),
        importedAt: now
      }
    });
  });

  return writes;
}


const DEFAULT_GRADING = [
  { min: 70, max: 100, grade: "A", point: 5, status: "Passed" },
  { min: 60, max: 69, grade: "B", point: 4, status: "Passed" },
  { min: 50, max: 59, grade: "C", point: 3, status: "Passed" },
  { min: 45, max: 49, grade: "D", point: 2, status: "Passed" },
  { min: 40, max: 44, grade: "E", point: 1, status: "Passed" },
  { min: 0, max: 39, grade: "F", point: 0, status: "Carry Over" }
];

let gradingSettings = {
  scale: 5,
  bands: structuredClone(DEFAULT_GRADING),
  warningCgpa: 1.5,
  probationCgpa: 1.0,
  warningCarryOvers: 2,
  probationCarryOvers: 4
};

function gradeFromScore(score) {
  const numericScore = Number(score);
  const band = gradingSettings.bands.find(item => numericScore >= item.min && numericScore <= item.max);
  return band || { grade: "F", point: 0, status: "Carry Over" };
}

function calculateCourseRows(courses) {
  return (courses || []).map(course => {
    const score = Number(course.score);
    const units = Number(course.units || 0);
    const gradeInfo = gradeFromScore(score);
    return {
      courseCode: course.courseCode || "",
      courseTitle: course.courseTitle || "",
      units,
      score,
      grade: gradeInfo.grade,
      gradePoint: gradeInfo.point,
      creditPoint: units * gradeInfo.point,
      status: gradeInfo.status
    };
  });
}

function calculateSemesterSummary(courses) {
  const rows = calculateCourseRows(courses);
  const tnu = rows.reduce((sum, item) => sum + Number(item.units || 0), 0);
  const tcp = rows.reduce((sum, item) => sum + Number(item.creditPoint || 0), 0);
  const gpa = tnu > 0 ? Number((tcp / tnu).toFixed(2)) : 0;
  const failed = rows.filter(item => item.grade === "F");

  return {
    tnu,
    tcp,
    gpa,
    carryOvers: failed.length,
    remark: academicRemark(gpa, failed.length)
  };
}

function academicRemark(cgpa, carryCount) {
  const value = Number(cgpa || 0);

  if (carryCount >= Number(gradingSettings.probationCarryOvers) || value < Number(gradingSettings.probationCgpa)) {
    return "Probation";
  }

  if (carryCount >= Number(gradingSettings.warningCarryOvers) || value < Number(gradingSettings.warningCgpa)) {
    return "Academic Warning";
  }

  if (value >= 4.5) return "Distinction";
  if (value >= 3.5) return "Upper Credit";
  if (value >= 2.5) return "Lower Credit";
  return "Pass";
}

function resultSortKey(result) {
  const sessionStart = Number(String(result.resultSession || "0").split("/")[0]) || 0;
  const semesterOrder = String(result.semester).toLowerCase().startsWith("first") ? 1 : 2;
  return sessionStart * 100 + Number(result.level || 0) * 10 + semesterOrder;
}

async function renderResults() {
  dashboardLayout(`
    <section class="section-head">
      <div>
        <h3>Manage Results</h3>
        <p>Calculate grades, GPA, CGPA and outstanding carry-over courses.</p>
      </div>
      <button id="recalculateBtn" class="primary-btn">Recalculate All Results</button>
    </section>

    <section class="card">
      <div class="form-grid">
        <div class="form-group">
          <label for="resultSearch">Search Student</label>
          <input id="resultSearch" placeholder="Name or matric number">
        </div>
        <div class="form-group">
          <label for="resultDepartmentFilter">Department</label>
          <select id="resultDepartmentFilter">
            <option value="">All Departments</option>
            <option value="CHEW">CHEW</option>
            <option value="MLT">MLT</option>
          </select>
        </div>
      </div>
      <div id="resultsMessage"></div>
      <div id="resultsArea" class="placeholder" style="margin-top:16px">Loading result records...</div>
    </section>
  `);

  document.getElementById("recalculateBtn").addEventListener("click", recalculateAllResults);
  document.getElementById("resultSearch").addEventListener("input", loadResultRecords);
  document.getElementById("resultDepartmentFilter").addEventListener("change", loadResultRecords);
  await loadResultRecords();
}

async function loadResultRecords() {
  const area = document.getElementById("resultsArea");
  if (!area) return;

  area.className = "placeholder";
  area.textContent = "Loading result records...";

  try {
    const snapshot = await getDocs(collection(db, "results"));
    let rows = snapshot.docs.map(item => ({ id: item.id, ...item.data() }));

    const search = document.getElementById("resultSearch")?.value.trim().toLowerCase() || "";
    const department = document.getElementById("resultDepartmentFilter")?.value || "";

    rows = rows
      .filter(item => !department || item.department === department)
      .filter(item => {
        if (!search) return true;
        return String(item.studentName || "").toLowerCase().includes(search) ||
          String(item.matricNumber || "").toLowerCase().includes(search);
      })
      .sort((a, b) => {
        const nameCompare = String(a.studentName || "").localeCompare(String(b.studentName || ""));
        return nameCompare || resultSortKey(a) - resultSortKey(b);
      });

    if (!rows.length) {
      area.className = "placeholder";
      area.textContent = "No result records found. Import a result workbook first.";
      return;
    }

    area.className = "table-wrap";
    area.innerHTML = `
      <table>
        <thead>
          <tr>
            <th>Student</th>
            <th>Matric Number</th>
            <th>Session</th>
            <th>Level</th>
            <th>Semester</th>
            <th>GPA</th>
            <th>CGPA</th>
            <th>Carry Overs</th>
            <th>Remark</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          ${rows.map(item => `
            <tr>
              <td>${escapeHtml(item.studentName)}</td>
              <td>${escapeHtml(item.matricNumber)}</td>
              <td>${escapeHtml(item.resultSession)}</td>
              <td>Year ${escapeHtml(item.level)}</td>
              <td>${escapeHtml(item.semester)}</td>
              <td>${formatNumber(item.gpa)}</td>
              <td>${formatNumber(item.cgpa)}</td>
              <td>${Number(item.carryOvers || 0)}</td>
              <td>${escapeHtml(item.remark || "Not calculated")}</td>
              <td class="action-cell">
                <button class="secondary-btn view-result-btn" data-result-id="${escapeHtml(item.id)}">View / Print</button>
                <button class="primary-btn edit-result-btn" data-result-id="${escapeHtml(item.id)}">Edit</button>
                <button class="danger-btn delete-result-btn" data-result-id="${escapeHtml(item.id)}" data-student="${escapeHtml(item.studentName)}">Delete</button>
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    `;

    document.querySelectorAll(".view-result-btn").forEach(button => {
      button.addEventListener("click", () => viewResultRecord(button.dataset.resultId));
    });

    document.querySelectorAll(".edit-result-btn").forEach(button => {
      button.addEventListener("click", () => openResultEditor(button.dataset.resultId));
    });

    document.querySelectorAll(".delete-result-btn").forEach(button => {
      button.addEventListener("click", () => deleteResultRecord(button.dataset.resultId, button.dataset.student));
    });
  } catch (error) {
    console.error(error);
    area.className = "message error";
    area.textContent = error.message;
  }
}

async function recalculateAllResults() {
  const button = document.getElementById("recalculateBtn");
  const message = document.getElementById("resultsMessage");

  button.disabled = true;
  button.textContent = "Calculating...";
  message.innerHTML = `<div class="message">Reading all result records...</div>`;

  try {
    const snapshot = await getDocs(collection(db, "results"));
    const allResults = snapshot.docs.map(item => ({ id: item.id, ...item.data() }));
    const grouped = new Map();

    allResults.forEach(result => {
      const studentKey = result.studentId || safeDocumentId(result.matricNumber);
      if (!grouped.has(studentKey)) grouped.set(studentKey, []);
      grouped.get(studentKey).push(result);
    });

    const updates = [];

    grouped.forEach(studentResults => {
      studentResults.sort((a, b) => resultSortKey(a) - resultSortKey(b));

      let cumulativeUnits = 0;
      let cumulativePoints = 0;
      const latestCourseStatus = new Map();

      studentResults.forEach(result => {
        const courseRows = calculateCourseRows(result.courses || []);
        const summary = calculateSemesterSummary(courseRows);

        cumulativeUnits += summary.tnu;
        cumulativePoints += summary.tcp;
        const cgpa = cumulativeUnits > 0
          ? Number((cumulativePoints / cumulativeUnits).toFixed(2))
          : 0;

        courseRows.forEach(course => {
          const code = normalizeCourseCode(course.courseCode);
          const existing = latestCourseStatus.get(code);
          if (!existing || resultSortKey(result) >= existing.sortKey) {
            latestCourseStatus.set(code, {
              courseCode: course.courseCode,
              courseTitle: course.courseTitle,
              score: course.score,
              grade: course.grade,
              passed: course.grade !== "F",
              sortKey: resultSortKey(result)
            });
          }
        });

        const unresolved = [...latestCourseStatus.values()]
          .filter(item => !item.passed)
          .map(item => ({
            courseCode: item.courseCode,
            courseTitle: item.courseTitle,
            lastScore: item.score
          }));

        updates.push({
          id: result.id,
          data: {
            courses: courseRows,
            tnu: summary.tnu,
            tcp: summary.tcp,
            gpa: summary.gpa,
            cgpa,
            carryOvers: unresolved.length,
            unresolvedCarryOvers: unresolved,
            remark: academicRemark(cgpa, unresolved.length),
            calculationStatus: "calculated",
            calculatedAt: serverTimestamp()
          }
        });
      });
    });

    const chunkSize = 400;
    for (let start = 0; start < updates.length; start += chunkSize) {
      const batch = writeBatch(db);
      updates.slice(start, start + chunkSize).forEach(update => {
        batch.set(doc(db, "results", update.id), update.data, { merge: true });
      });
      await batch.commit();
    }

    message.innerHTML = `<div class="message success">${updates.length} result records were recalculated successfully.</div>`;
    button.textContent = "Recalculate All Results";
    button.disabled = false;
    await loadResultRecords();
  } catch (error) {
    console.error(error);
    button.disabled = false;
    button.textContent = "Try Again";
    message.innerHTML = `<div class="message error">${escapeHtml(error.message)}</div>`;
  }
}


async function openResultEditor(resultId) {
  const snapshot = await getDoc(doc(db, "results", resultId));
  if (!snapshot.exists()) {
    alert("Result record not found.");
    return;
  }

  const result = { id: snapshot.id, ...snapshot.data() };
  dashboardLayout(`
    <section class="section-head">
      <div>
        <h3>Edit Semester Result</h3>
        <p>Correct scores, add omitted courses or remove incorrect courses.</p>
      </div>
      <button id="backToResultsFromEditor" class="secondary-btn">← Back to Results</button>
    </section>

    <section class="card">
      <div class="result-editor-meta">
        <div><span>Student</span><strong>${escapeHtml(result.studentName)}</strong></div>
        <div><span>Matric Number</span><strong>${escapeHtml(result.matricNumber)}</strong></div>
        <div><span>Session</span><strong>${escapeHtml(result.resultSession)}</strong></div>
        <div><span>Level</span><strong>Year ${escapeHtml(result.level)}</strong></div>
        <div><span>Semester</span><strong>${escapeHtml(result.semester)}</strong></div>
      </div>

      <div class="table-wrap" style="margin-top:18px">
        <table id="resultEditorTable">
          <thead>
            <tr>
              <th>Course Code</th>
              <th>Course Title</th>
              <th>Unit</th>
              <th>Score</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody id="resultEditorBody">
            ${(result.courses || []).map(course => editorCourseRow(course)).join("")}
          </tbody>
        </table>
      </div>

      <div class="editor-actions">
        <button id="addEditorCourse" class="secondary-btn">Add Course</button>
        <button id="saveEditedResult" class="primary-btn">Save and Recalculate</button>
      </div>
      <div id="resultEditorMessage"></div>
    </section>
  `);

  document.getElementById("backToResultsFromEditor").addEventListener("click", () => navigate("results"));
  document.getElementById("addEditorCourse").addEventListener("click", () => {
    document.getElementById("resultEditorBody").insertAdjacentHTML(
      "beforeend",
      editorCourseRow({ courseCode: "", courseTitle: "", units: 0, score: 0 })
    );
    attachRemoveEditorRowHandlers();
  });
  attachRemoveEditorRowHandlers();

  document.getElementById("saveEditedResult").addEventListener("click", async () => {
    const message = document.getElementById("resultEditorMessage");
    const rows = [...document.querySelectorAll("#resultEditorBody tr")];
    const courses = rows.map(row => ({
      courseCode: row.querySelector(".edit-course-code").value.trim().toUpperCase(),
      courseTitle: row.querySelector(".edit-course-title").value.trim(),
      units: Number(row.querySelector(".edit-course-unit").value),
      score: Number(row.querySelector(".edit-course-score").value)
    }));

    if (courses.some(course => !course.courseCode || !course.courseTitle)) {
      message.innerHTML = `<div class="message error">Every course must have a code and title.</div>`;
      return;
    }

    if (courses.some(course => course.score < 0 || course.score > 100)) {
      message.innerHTML = `<div class="message error">Scores must be between 0 and 100.</div>`;
      return;
    }

    try {
      const calculatedRows = calculateCourseRows(courses);
      const summary = calculateSemesterSummary(calculatedRows);

      await setDoc(doc(db, "results", resultId), {
        courses: calculatedRows,
        tnu: summary.tnu,
        tcp: summary.tcp,
        gpa: summary.gpa,
        carryOvers: summary.carryOvers,
        remark: summary.remark,
        calculationStatus: "edited",
        updatedAt: serverTimestamp()
      }, { merge: true });

      message.innerHTML = `<div class="message success">Result saved. Recalculating the student's cumulative record...</div>`;
      await recalculateSingleStudent(result.studentId || safeDocumentId(result.matricNumber));
      setTimeout(() => navigate("results"), 700);
    } catch (error) {
      message.innerHTML = `<div class="message error">${escapeHtml(error.message)}</div>`;
    }
  });
}

function editorCourseRow(course) {
  return `
    <tr>
      <td><input class="edit-course-code table-input" value="${escapeHtml(course.courseCode || "")}" placeholder="CHE 111"></td>
      <td><input class="edit-course-title table-input" value="${escapeHtml(course.courseTitle || "")}" placeholder="Course title"></td>
      <td><input class="edit-course-unit table-input" type="number" min="0" step="1" value="${Number(course.units || 0)}"></td>
      <td><input class="edit-course-score table-input" type="number" min="0" max="100" step="1" value="${Number(course.score || 0)}"></td>
      <td><button type="button" class="danger-btn remove-editor-row">Remove</button></td>
    </tr>
  `;
}

function attachRemoveEditorRowHandlers() {
  document.querySelectorAll(".remove-editor-row").forEach(button => {
    button.onclick = () => button.closest("tr").remove();
  });
}

async function recalculateSingleStudent(studentId) {
  const snapshot = await getDocs(collection(db, "results"));
  const studentResults = snapshot.docs
    .map(item => ({ id: item.id, ...item.data() }))
    .filter(item => (item.studentId || safeDocumentId(item.matricNumber)) === studentId)
    .sort((a, b) => resultSortKey(a) - resultSortKey(b));

  let cumulativeUnits = 0;
  let cumulativePoints = 0;
  const latestCourseStatus = new Map();
  const updates = [];

  studentResults.forEach(result => {
    const courseRows = calculateCourseRows(result.courses || []);
    const summary = calculateSemesterSummary(courseRows);

    cumulativeUnits += summary.tnu;
    cumulativePoints += summary.tcp;
    const cgpa = cumulativeUnits > 0
      ? Number((cumulativePoints / cumulativeUnits).toFixed(2))
      : 0;

    courseRows.forEach(course => {
      const code = normalizeCourseCode(course.courseCode);
      latestCourseStatus.set(code, {
        courseCode: course.courseCode,
        courseTitle: course.courseTitle,
        score: course.score,
        passed: course.grade !== "F"
      });
    });

    const unresolved = [...latestCourseStatus.values()]
      .filter(item => !item.passed)
      .map(item => ({
        courseCode: item.courseCode,
        courseTitle: item.courseTitle,
        lastScore: item.score
      }));

    updates.push({
      id: result.id,
      data: {
        courses: courseRows,
        tnu: summary.tnu,
        tcp: summary.tcp,
        gpa: summary.gpa,
        cgpa,
        carryOvers: unresolved.length,
        unresolvedCarryOvers: unresolved,
        remark: academicRemark(cgpa, unresolved.length),
        calculationStatus: "calculated",
        calculatedAt: serverTimestamp()
      }
    });
  });

  const batch = writeBatch(db);
  updates.forEach(update => {
    batch.set(doc(db, "results", update.id), update.data, { merge: true });
  });
  if (updates.length) await batch.commit();
}

async function deleteResultRecord(resultId, studentName) {
  const confirmed = confirm(
    `Delete this semester result for ${studentName}? This cannot be undone.`
  );
  if (!confirmed) return;

  try {
    const snapshot = await getDoc(doc(db, "results", resultId));
    const result = snapshot.exists() ? snapshot.data() : null;
    await deleteDoc(doc(db, "results", resultId));

    if (result) {
      await recalculateSingleStudent(result.studentId || safeDocumentId(result.matricNumber));
    }

    await loadResultRecords();
  } catch (error) {
    alert(error.message);
  }
}

async function viewResultRecord(resultId) {
  try {
    const resultSnapshot = await getDocs(collection(db, "results"));
    const match = resultSnapshot.docs.find(item => item.id === resultId);
    if (!match) throw new Error("Result record not found.");

    const result = { id: match.id, ...match.data() };
    const studentSnapshot = await getDocs(collection(db, "students"));
    const studentDoc = studentSnapshot.docs.find(item =>
      item.id === result.studentId || item.data().matricNumber === result.matricNumber
    );
    const student = studentDoc ? studentDoc.data() : {};

    dashboardLayout(`
      <div class="result-toolbar no-print">
        <button id="backToResultsBtn" class="secondary-btn">← Back to Results</button>
        <button id="printResultBtn" class="primary-btn">Print Result</button>
      </div>

      <article id="printableResult" class="official-result">
        <header class="result-header">
          <img src="assets/images/logo.png" alt="School logo">
          <div>
            <h1>SAHLAN COLLEGE OF HEALTH SCIENCE AND TECHNOLOGY, JOS</h1>
            <h2>OFFICIAL SEMESTER RESULT</h2>
          </div>
        </header>

        <section class="student-detail-grid">
          <div><strong>Name:</strong> ${escapeHtml(result.studentName || student.name)}</div>
          <div><strong>Matric Number:</strong> ${escapeHtml(result.matricNumber)}</div>
          <div><strong>Sex:</strong> ${escapeHtml(student.sex || "")}</div>
          <div><strong>Department:</strong> ${escapeHtml(result.department)}</div>
          <div><strong>Admission Session:</strong> ${escapeHtml(result.admissionSession)}</div>
          <div><strong>Current Level:</strong> Year ${escapeHtml(student.currentLevel || result.level)}</div>
          <div><strong>Result Session:</strong> ${escapeHtml(result.resultSession)}</div>
          <div><strong>Semester:</strong> ${escapeHtml(result.semester)}</div>
        </section>

        <div class="table-wrap result-table-wrap">
          <table>
            <thead>
              <tr>
                <th>S/N</th>
                <th>Course Code</th>
                <th>Course Title</th>
                <th>Unit</th>
                <th>Score</th>
                <th>Grade</th>
                <th>Grade Point</th>
                <th>Credit Point</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${(result.courses || []).map((course, index) => `
                <tr>
                  <td>${index + 1}</td>
                  <td>${escapeHtml(course.courseCode)}</td>
                  <td>${escapeHtml(course.courseTitle)}</td>
                  <td>${Number(course.units || 0)}</td>
                  <td>${Number(course.score || 0)}</td>
                  <td>${escapeHtml(course.grade || gradeFromScore(course.score).grade)}</td>
                  <td>${Number(course.gradePoint ?? gradeFromScore(course.score).point)}</td>
                  <td>${Number(course.creditPoint ?? (Number(course.units || 0) * gradeFromScore(course.score).point))}</td>
                  <td>${escapeHtml(course.status || gradeFromScore(course.score).status)}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>

        <section class="result-summary-grid">
          <div><span>Total Units</span><strong>${Number(result.tnu || 0)}</strong></div>
          <div><span>Total Credit Points</span><strong>${Number(result.tcp || 0)}</strong></div>
          <div><span>GPA</span><strong>${formatNumber(result.gpa)}</strong></div>
          <div><span>CGPA</span><strong>${formatNumber(result.cgpa)}</strong></div>
          <div><span>Outstanding Carry Overs</span><strong>${Number(result.carryOvers || 0)}</strong></div>
          <div><span>Academic Remark</span><strong>${escapeHtml(result.remark || "")}</strong></div>
        </section>

        <section class="carry-box">
          <strong>Outstanding Carry-Over Courses:</strong>
          ${(result.unresolvedCarryOvers || []).length
            ? (result.unresolvedCarryOvers || []).map(item =>
                `${escapeHtml(item.courseCode)} — ${escapeHtml(item.courseTitle || "")}`
              ).join(", ")
            : "None"}
        </section>

        <section class="signature-grid">
          <div><span></span><strong>Examination Officer</strong></div>
          <div><span></span><strong>Head of Department</strong></div>
          <div><span></span><strong>Registrar / Management</strong></div>
        </section>
      </article>
    `);

    document.getElementById("backToResultsBtn").addEventListener("click", () => navigate("results"));
    document.getElementById("printResultBtn").addEventListener("click", () => window.print());
  } catch (error) {
    alert(error.message);
  }
}

function formatNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number.toFixed(2) : "0.00";
}


async function renderAdmissionSessionBrowser() {
  dashboardLayout(`
    <section class="section-head">
      <div>
        <h3>Browse Result Bank</h3>
        <p>Select an admission session to view its students.</p>
      </div>
    </section>
    <section class="card">
      <div class="form-group" style="max-width:420px">
        <label for="sessionSearch">Search Session</label>
        <input id="sessionSearch" placeholder="Example: 2024/2025">
      </div>
      <div id="sessionCards" class="session-grid" style="margin-top:18px"></div>
    </section>
  `);
  document.getElementById("sessionSearch").addEventListener("input", loadAdmissionSessions);
  await loadAdmissionSessions();
}

async function loadAdmissionSessions() {
  const area = document.getElementById("sessionCards");
  area.innerHTML = `<div class="placeholder">Loading sessions...</div>`;
  try {
    const snap = await getDocs(collection(db, "students"));
    const map = new Map();
    snap.docs.forEach(d => {
      const s = d.data();
      const session = String(s.admissionSession || "").trim();
      if (!session) return;
      if (!map.has(session)) map.set(session, {session, count:0, departments:new Set()});
      const x = map.get(session);
      x.count += 1;
      if (s.department) x.departments.add(s.department);
    });
    const search = (document.getElementById("sessionSearch").value || "").toLowerCase();
    const rows = [...map.values()]
      .filter(x => x.session.toLowerCase().includes(search))
      .sort((a,b) => b.session.localeCompare(a.session));
    area.innerHTML = rows.length ? rows.map(x => `
      <button class="session-card" data-session="${escapeHtml(x.session)}">
        <div class="session-icon">📁</div>
        <strong>${escapeHtml(x.session)}</strong>
        <span>${x.count} student${x.count === 1 ? "" : "s"}</span>
        <small>${escapeHtml([...x.departments].join(", "))}</small>
      </button>
    `).join("") : `<div class="placeholder">No sessions found.</div>`;
    document.querySelectorAll(".session-card").forEach(btn => {
      btn.addEventListener("click", () => renderStudentsBySession(btn.dataset.session));
    });
  } catch (e) {
    area.innerHTML = `<div class="message error">${escapeHtml(e.message)}</div>`;
  }
}

async function renderStudentsBySession(session) {
  dashboardLayout(`
    <section class="section-head">
      <div><h3>${escapeHtml(session)} Students</h3><p>Select a student to open the academic profile.</p></div>
      <button id="backSessions" class="secondary-btn">← Sessions</button>
    </section>
    <section class="card">
      <div class="form-grid">
        <div class="form-group">
          <label for="studentSearch">Search Student</label>
          <input id="studentSearch" placeholder="Name or matric number">
        </div>
        <div class="form-group">
          <label for="deptFilter">Department</label>
          <select id="deptFilter"><option value="">All Departments</option><option>CHEW</option><option>MLT</option></select>
        </div>
      </div>
      <div id="studentCards" style="margin-top:18px"></div>
    </section>
  `);
  document.getElementById("backSessions").addEventListener("click", () => navigate("browse"));
  document.getElementById("studentSearch").addEventListener("input", () => loadStudentsBySession(session));
  document.getElementById("deptFilter").addEventListener("change", () => loadStudentsBySession(session));
  await loadStudentsBySession(session);
}

async function loadStudentsBySession(session) {
  const area = document.getElementById("studentCards");
  area.innerHTML = `<div class="placeholder">Loading students...</div>`;
  const snap = await getDocs(collection(db, "students"));
  const search = (document.getElementById("studentSearch").value || "").toLowerCase();
  const dept = document.getElementById("deptFilter").value;
  const rows = snap.docs.map(d => ({id:d.id, ...d.data()}))
    .filter(s => s.admissionSession === session)
    .filter(s => !dept || s.department === dept)
    .filter(s => !search || String(s.name||"").toLowerCase().includes(search) || String(s.matricNumber||"").toLowerCase().includes(search))
    .sort((a,b) => String(a.name||"").localeCompare(String(b.name||"")));
  area.innerHTML = rows.length ? `<div class="student-browser-grid">${
    rows.map(s => `
      <button class="student-browser-card" data-id="${escapeHtml(s.id)}">
        <div class="student-avatar">${escapeHtml(initials(s.name))}</div>
        <div><strong>${escapeHtml(s.name)}</strong><span>${escapeHtml(s.matricNumber)}</span><small>${escapeHtml(s.department)} • Year ${escapeHtml(s.currentLevel)}</small></div>
      </button>
    `).join("")
  }</div>` : `<div class="placeholder">No matching students found.</div>`;
  document.querySelectorAll(".student-browser-card").forEach(btn => {
    btn.addEventListener("click", () => renderStudentProfile(btn.dataset.id, session));
  });
}

async function renderStudentProfile(studentId, session) {
  const ss = await getDocs(collection(db, "students"));
  const sd = ss.docs.find(d => d.id === studentId);
  if (!sd) return alert("Student not found.");
  const student = {id:sd.id, ...sd.data()};
  const rs = await getDocs(collection(db, "results"));
  const results = rs.docs.map(d => ({id:d.id, ...d.data()}))
    .filter(r => r.studentId === studentId || r.matricNumber === student.matricNumber)
    .sort((a,b) => resultSortKey(a)-resultSortKey(b));
  const latest = results[results.length-1] || {};
  const years = [...new Set(results.map(r => Number(r.level)).filter(Boolean))].sort();

  dashboardLayout(`
    <section class="section-head">
      <div><h3>Student Academic Profile</h3><p>View yearly results or the complete transcript.</p></div>
      <button id="backStudentList" class="secondary-btn">← Student List</button>
    </section>

    <section class="profile-card">
      <div class="profile-avatar">${escapeHtml(initials(student.name))}</div>
      <div class="profile-details">
        <h2>${escapeHtml(student.name)}</h2>
        <div class="profile-info-grid">
          <div><span>Matric Number</span><strong>${escapeHtml(student.matricNumber)}</strong></div>
          <div><span>Sex</span><strong>${escapeHtml(student.sex || "Not specified")}</strong></div>
          <div><span>Department</span><strong>${escapeHtml(student.department)}</strong></div>
          <div><span>Admission Session</span><strong>${escapeHtml(student.admissionSession)}</strong></div>
          <div><span>Current Level</span><strong>Year ${escapeHtml(student.currentLevel)}</strong></div>
          <div><span>Current CGPA</span><strong>${formatNumber(latest.cgpa)}</strong></div>
          <div><span>Outstanding Carry Overs</span><strong>${Number(latest.carryOvers || 0)}</strong></div>
          <div><span>Current Remark</span><strong>${escapeHtml(latest.remark || "Not available")}</strong></div>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="year-buttons">
        ${years.map(y => `<button class="year-result-btn" data-year="${y}"><strong>Year ${y}</strong><span>First and Second Semester</span></button>`).join("")}
        <button id="transcriptBtn" class="year-result-btn transcript-highlight"><strong>Complete Transcript</strong><span>All available semesters</span></button>
      </div>
    </section>
    <section id="yearResultArea" class="section"></section>
  `);

  document.getElementById("backStudentList").addEventListener("click", () => renderStudentsBySession(session));
  document.querySelectorAll(".year-result-btn[data-year]").forEach(btn => {
    btn.addEventListener("click", () => renderYearResult(student, results, Number(btn.dataset.year)));
  });
  document.getElementById("transcriptBtn").addEventListener("click", () => renderCompleteTranscript(student, results));
  if (years.length) renderYearResult(student, results, years[0]);
  else document.getElementById("yearResultArea").innerHTML = `<div class="placeholder">No results available.</div>`;
}

function renderYearResult(student, results, year) {
  const area = document.getElementById("yearResultArea");
  const rows = results.filter(r => Number(r.level) === year).sort((a,b) => resultSortKey(a)-resultSortKey(b));
  area.innerHTML = rows.length ? `
    <div class="result-toolbar no-print"><h3>Year ${year} Result</h3><button id="printYear" class="primary-btn">Print Year ${year}</button></div>
    <article class="official-result">
      ${officialResultHeader(`YEAR ${year} RESULT`)}
      ${studentIdentitySection(student)}
      ${rows.map(semesterResultBlock).join("")}
      ${yearSummaryBlock(rows)}
      ${signatureSection()}
    </article>
  ` : `<div class="placeholder">No Year ${year} result available.</div>`;
  document.getElementById("printYear")?.addEventListener("click", () => window.print());
}

function renderCompleteTranscript(student, results) {
  const area = document.getElementById("yearResultArea");
  const levels = [...new Set(results.map(r => Number(r.level)).filter(Boolean))].sort();
  const latest = results[results.length-1] || {};
  area.innerHTML = `
    <div class="result-toolbar no-print"><h3>Complete Transcript</h3><button id="printTranscript" class="primary-btn">Print Transcript</button></div>
    <article class="official-result">
      ${officialResultHeader("COMPLETE ACADEMIC TRANSCRIPT")}
      ${studentIdentitySection(student)}
      ${levels.map(level => `
        <section class="transcript-year">
          <h3>YEAR ${level}</h3>
          ${results.filter(r => Number(r.level) === level).sort((a,b) => resultSortKey(a)-resultSortKey(b)).map(semesterResultBlock).join("")}
        </section>
      `).join("")}
      <section class="final-summary">
        <div><span>Final / Current CGPA</span><strong>${formatNumber(latest.cgpa)}</strong></div>
        <div><span>Outstanding Carry Overs</span><strong>${Number(latest.carryOvers || 0)}</strong></div>
        <div><span>Academic Standing</span><strong>${escapeHtml(latest.remark || "")}</strong></div>
      </section>
      <section class="carry-box"><strong>Outstanding Carry-Over Courses:</strong> ${
        (latest.unresolvedCarryOvers || []).length
          ? latest.unresolvedCarryOvers.map(x => `${escapeHtml(x.courseCode)} — ${escapeHtml(x.courseTitle || "")}`).join(", ")
          : "None"
      }</section>
      ${signatureSection()}
    </article>
  `;
  document.getElementById("printTranscript").addEventListener("click", () => window.print());
}

function officialResultHeader(title) {
  return `<header class="result-header"><img src="assets/images/logo.png" alt="School logo"><div><h1>SAHLAN COLLEGE OF HEALTH SCIENCE AND TECHNOLOGY, JOS</h1><h2>${escapeHtml(title)}</h2></div></header>`;
}

function studentIdentitySection(student) {
  return `<section class="student-detail-grid">
    <div><strong>Name:</strong> ${escapeHtml(student.name)}</div>
    <div><strong>Matric Number:</strong> ${escapeHtml(student.matricNumber)}</div>
    <div><strong>Sex:</strong> ${escapeHtml(student.sex || "")}</div>
    <div><strong>Department:</strong> ${escapeHtml(student.department)}</div>
    <div><strong>Admission Session:</strong> ${escapeHtml(student.admissionSession)}</div>
    <div><strong>Current Level:</strong> Year ${escapeHtml(student.currentLevel)}</div>
  </section>`;
}

function semesterResultBlock(result) {
  return `<section class="semester-block">
    <div class="semester-heading"><h3>${escapeHtml(result.semester)} — ${escapeHtml(result.resultSession)}</h3></div>
    <div class="table-wrap result-table-wrap"><table><thead><tr>
      <th>S/N</th><th>Course Code</th><th>Course Title</th><th>Unit</th><th>Score</th><th>Grade</th><th>Credit Point</th><th>Status</th>
    </tr></thead><tbody>
      ${(result.courses || []).map((c,i) => `<tr>
        <td>${i+1}</td><td>${escapeHtml(c.courseCode)}</td><td>${escapeHtml(c.courseTitle)}</td><td>${Number(c.units||0)}</td>
        <td>${Number(c.score||0)}</td><td>${escapeHtml(c.grade || gradeFromScore(c.score).grade)}</td>
        <td>${Number(c.creditPoint ?? 0)}</td><td>${escapeHtml(c.status || gradeFromScore(c.score).status)}</td>
      </tr>`).join("")}
    </tbody></table></div>
    <div class="semester-summary">
      <span>TNU: <strong>${Number(result.tnu||0)}</strong></span>
      <span>TCP: <strong>${Number(result.tcp||0)}</strong></span>
      <span>GPA: <strong>${formatNumber(result.gpa)}</strong></span>
      <span>CGPA: <strong>${formatNumber(result.cgpa)}</strong></span>
      <span>Carry Overs: <strong>${Number(result.carryOvers||0)}</strong></span>
      <span>Remark: <strong>${escapeHtml(result.remark||"")}</strong></span>
    </div>
  </section>`;
}

function yearSummaryBlock(rows) {
  const latest = rows[rows.length-1];
  const units = rows.reduce((s,r) => s + Number(r.tnu||0), 0);
  const points = rows.reduce((s,r) => s + Number(r.tcp||0), 0);
  const gpa = units ? points/units : 0;
  return `<section class="final-summary">
    <div><span>Year Total Units</span><strong>${units}</strong></div>
    <div><span>Year Total Credit Points</span><strong>${points}</strong></div>
    <div><span>Year GPA</span><strong>${formatNumber(gpa)}</strong></div>
    <div><span>Current CGPA</span><strong>${formatNumber(latest.cgpa)}</strong></div>
    <div><span>Outstanding Carry Overs</span><strong>${Number(latest.carryOvers||0)}</strong></div>
    <div><span>Academic Standing</span><strong>${escapeHtml(latest.remark||"")}</strong></div>
  </section>`;
}

function signatureSection() {
  return `<section class="signature-grid">
    <div><span></span><strong>Examination Officer</strong></div>
    <div><span></span><strong>Head of Department</strong></div>
    <div><span></span><strong>Registrar / Management</strong></div>
  </section>`;
}

function initials(name) {
  return String(name || "?").split(/\s+/).filter(Boolean).slice(0,2).map(x => x[0].toUpperCase()).join("");
}

function normalizeHeader(value) {
  return String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, " ");
}

function findHeaderIndex(headers, options) {
  return headers.findIndex((value) => options.includes(value));
}

function normalizeCourseCode(value) {
  const text = String(value ?? "").trim().toUpperCase();
  if (!text || text === "N.U" || text === "NU") return "";
  if (!/[A-Z]/.test(text) || !/\d/.test(text)) return "";
  return text.replace(/\s+/g, " ");
}

function isSummaryHeader(value) {
  return ["TNU", "TCP", "REMARK", "NO OF C/O"].includes(value) || value.includes("GPA");
}

function cleanCell(value) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function numericValue(value) {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number" && Number.isFinite(value)) return value;

  const parsed = Number(String(value).replace(/,/g, "").trim());
  return Number.isFinite(parsed) ? parsed : null;
}

function isLikelyFooter(name, matricNumber) {
  const combined = `${name} ${matricNumber}`.toUpperCase();
  return combined.includes("TOTAL") || combined.includes("SIGNATURE") || combined.includes("KEYS:");
}

function safeDocumentId(value) {
  return String(value)
    .trim()
    .replace(/\//g, "_")
    .replace(/[.#$[\]]/g, "_")
    .replace(/\s+/g, "_");
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[character]);
}


async function isAdministrator(user) {
  if (!user || user.isAnonymous) {
    return { allowed: false, reason: "The current account is anonymous.", uid: user?.uid || "" };
  }
  try {
    const snapshot = await getDoc(doc(db, "users", user.uid));
    if (!snapshot.exists()) {
      return { allowed: false, reason: "No Firestore document was found at users/" + user.uid, uid: user.uid, email: user.email || "" };
    }
    const data = snapshot.data();
    const role = String(data.role || "").trim().toLowerCase();
    if (role !== "admin") {
      return { allowed: false, reason: 'The user document exists, but role is "' + String(data.role || "") + '" instead of "admin".', uid: user.uid, email: user.email || "", role: data.role || "" };
    }
    return { allowed: true, uid: user.uid, email: user.email || "", role };
  } catch (error) {
    console.error("Unable to verify administrator role:", error);
    return { allowed: false, reason: error.message || "Unable to read the administrator role document.", code: error.code || "", uid: user.uid, email: user.email || "" };
  }
}

onAuthStateChanged(auth, async (user) => {
  state.user = user;

  if (!user) {
    showPublicHome();
    return;
  }

  await loadGradingSettings();

  if (user.isAnonymous) {
    await renderPublicSessions();
    return;
  }

  const adminCheck = await isAdministrator(user);

  if (!adminCheck.allowed) {
    app.innerHTML = `
      <main class="login-screen">
        <section class="login-card">
          <img src="assets/images/logo.png" class="login-logo" alt="School logo">
          <h1>Administrator Verification Failed</h1>
          <div class="message error" style="margin-top:18px"><strong>${escapeHtml(adminCheck.reason)}</strong></div>
          <div class="card" style="margin-top:16px;text-align:left">
            <p><strong>Signed-in email:</strong><br>${escapeHtml(adminCheck.email || user.email || "")}</p>
            <p style="margin-top:10px"><strong>Authentication UID:</strong><br><code style="word-break:break-all">${escapeHtml(adminCheck.uid || user.uid)}</code></p>
            ${adminCheck.code ? `<p style="margin-top:10px"><strong>Error code:</strong><br>${escapeHtml(adminCheck.code)}</p>` : ""}
          </div>
          <p style="margin-top:16px;color:var(--muted)">In Firestore, create a document at <strong>users/UID</strong> using the exact UID shown above, and add the string field <strong>role</strong> with the value <strong>admin</strong>.</p>
          <button id="diagnosticLogoutBtn" class="primary-btn" style="width:100%;margin-top:18px">Return to Home</button>
        </section>
      </main>`;
    document.getElementById("diagnosticLogoutBtn").addEventListener("click", () => signOut(auth));
    return;
  }

  await renderDashboard();
});

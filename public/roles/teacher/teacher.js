// Tiny Steps — Teacher (Unified Student Workspace) v6 — 2025-10-25
// Path: /roles/teacher/teacher.js
// Firebase v11 CDN. Roles: teacher/admin. All actions in one Student View.

import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAuth, onAuthStateChanged, getIdTokenResult, signOut } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { initializeAppCheck, ReCaptchaV3Provider } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app-check.js";
import { initProfileMenu } from "/shared/profile-menu.js";
import {
  getFirestore, collection, query, where, getDocs, doc, getDoc, setDoc,
  addDoc, serverTimestamp, orderBy, limit
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

/* ========= Firebase bootstrap ========= */
const firebaseConfig = {
  apiKey: "AIzaSyBxLOnu1Se8w8bDzh4LytpFN6JLUh1CCTs",
  authDomain: "tinystepselearning-surya.firebaseapp.com",
  projectId: "tinystepselearning-surya",
  storageBucket: "tinystepselearning-surya.appspot.com",
  messagingSenderId: "846077016782",
  appId: "1:846077016782:web:placeholderappid"
};
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
try {
  initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider("6LdTsPMrAAAAAP42m-LXFw80Jz4Ip8ut2Ta_TBwc"),
    isTokenAutoRefreshEnabled: true,
  });
} catch (_) {}

const auth = getAuth(app);
const db = getFirestore(app);

/* ========= Utilities ========= */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const todayYMD = (d = new Date()) => {
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}`;
};
const humanDate = (d = new Date()) =>
  d.toLocaleString(undefined, { weekday: "long", month: "short", day: "numeric" });

function csvEscape(v) {
  if (v == null) return "";
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
function toast(msg, type = "info") {
  const t = $("#toast");
  if (!t) return alert(msg);
  t.textContent = msg;
  t.dataset.type = type;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 1800);
}

/* ========= State ========= */
const S = {
  user: null,
  claims: {},
  isAdmin: false,
  isTeacher: false,

  students: [],              // [{ id, name, username, className, grade, dob, parentName, parentEmail, teacherId }]
  classes: [],
  activeClass: null,

  sessions: ["3:00–3:35", "4:00–4:40", "5:00–5:35", "6:15–7:00", "7:00–7:35", "8:00–8:35"],
  activeSession: null,

  date: new Date(),
  lastSelectedStudentId: null,

  attendanceToday: {},       // { [studentId]: "present"|"absent" }
};

let profileMenuHandle = null;

/* ========= Init ========= */
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    location.href = "/roles/login.html?role=teacher&next=%2Froles%2Fteacher%2F";
    return;
  }
  S.user = user;
  const token = await getIdTokenResult(user, true);
  S.claims = token.claims || {};
  S.isAdmin = S.claims.role === "admin";
  S.isTeacher = S.isAdmin || S.claims.role === "teacher";
  if (!S.isTeacher) {
    await signOut(auth);
    location.href = "/roles/login.html?role=teacher&next=%2Froles%2Fteacher%2F";
    return;
  }

  // Header / subheader
  $("#welcomeName").textContent = user.displayName || user.email || "Teacher";
  $("#welcome").textContent = `Signed in as ${user.email || "user"} • ${S.isAdmin ? "Admin" : "Teacher"}`;
  $("#todayLabel").textContent = humanDate(S.date);

  const roleLabel = S.isAdmin ? "Admin" : "Teacher";
  if (!profileMenuHandle) {
    profileMenuHandle = initProfileMenu({
      menuSelector: "#profileMenu",
      triggerSelector: "#profileTrigger",
      dropdownSelector: "#profileDropdown",
      avatarSelector: "#profileAvatar",
      nameSelector: "#profileName",
      displaySelector: "#profileDisplay",
      emailSelector: "#profileEmail",
      roleSelector: "#profileRole",
      signOutSelector: "#signOutBtn",
      user,
      roleLabel,
      fallbackName: roleLabel,
      onSignOut: () => signOut(auth)
    });
  } else {
    profileMenuHandle.updateUser(user, { roleLabel, fallbackName: roleLabel });
  }

  wireStaticUI();
  await loadStudents();
  buildClassChips();
  buildSessionChips();

  // Default selects
  if (S.classes.length) selectClass(S.classes[0]);
  if (S.sessions.length) selectSession(S.sessions[0]);

  refreshKPIs();
  refreshTodaySummary();
  refreshStudentView(); // if a student is already selected
});

/* ========= UI wiring ========= */
function wireStaticUI() {
  // Search quick-focus
  document.addEventListener("keydown", (e) => {
    if (e.key === "/" && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName || "")) {
      e.preventDefault();
      $("#searchInput")?.focus();
    }
  });
  $("#searchInput")?.addEventListener("input", filterRosterBySearch);

  // Date & session
  $("#datePicker")?.addEventListener("change", (e) => {
    const val = e.currentTarget.value; // yyyy-mm-dd
    if (val) {
      const [y, m, d] = val.split("-").map(Number);
      S.date = new Date(y, m - 1, d);
      $("#todayLabel").textContent = humanDate(S.date);
      // Re-read attendance for that date (for simplicity, clear cache in this pass)
      S.attendanceToday = {};
      toast("Date changed");
      refreshKPIs();
      refreshTodaySummary();
      renderRoster();
    }
  });

  // Student view attendance toggles
  $("#btnStuPresent")?.addEventListener("click", () => {
    $("#btnStuPresent").classList.add("active");
    $("#btnStuAbsent").classList.remove("active");
  });
  $("#btnStuAbsent")?.addEventListener("click", () => {
    $("#btnStuAbsent").classList.add("active");
    $("#btnStuPresent").classList.remove("active");
  });

  // Student dropdown + actions
  $("#studentSelect")?.addEventListener("change", (e) => {
    S.lastSelectedStudentId = e.currentTarget.value || null;
    refreshStudentView();
  });
  $$("#deltaChips .chip").forEach(c => {
    c.addEventListener("click", () => {
      const step = Number(c.dataset.delta || "0");
      const slider = $("#masteryDelta");
      slider.value = Math.max(0, Math.min(25, Number(slider.value || 0) + step));
    });
  });
  $("#btnSaveAll")?.addEventListener("click", saveAllForStudent);
  $("#btnRefreshStudent")?.addEventListener("click", refreshStudentView);

  // Quick attendance (roster)
  $("#btnMarkAllPresent")?.addEventListener("click", markAllPresent);

  // Export
  $("#btnExport")?.addEventListener("click", exportCSV);

  // Modal (Add Note)
  $("#btnAddNote")?.addEventListener("click", () => showModal(true));
  $("#modalNoteClose")?.addEventListener("click", () => showModal(false));
  $("#btnCancelNote")?.addEventListener("click", () => showModal(false));
  $("#btnSaveNote")?.addEventListener("click", saveTeacherNote);
}

function showModal(on) {
  const m = $("#modalNote");
  if (!m) return;
  m.hidden = !on;
  if (on) $("#noteText")?.focus();
}

/* ========= Load students & build chips ========= */
async function loadStudents() {
  let qRef;
  if (S.isAdmin) {
    qRef = query(collection(db, "students"), orderBy("createdAt", "desc"), limit(100));
  } else {
    qRef = query(collection(db, "students"), where("teacherId", "==", S.user.uid));
  }
  const snap = await getDocs(qRef);
  S.students = snap.docs.map(d => ({ id: d.id, ...d.data() }));

  // Populate student select
  const sel = $("#studentSelect");
  if (sel) {
    sel.innerHTML = `<option value="">Select a student…</option>` +
      S.students.map(s => `<option value="${s.id}">${csvEscape(s.name || s.username || s.id)}</option>`).join("");
  }
}
function buildClassChips() {
  const set = new Set();
  S.students.forEach(s => set.add(s.className || s.grade || "Unassigned"));
  S.classes = Array.from(set);
  const wrap = $("#classChips");
  wrap.innerHTML = S.classes.length ? "" : `<div class="muted">No classes assigned yet.</div>`;
  S.classes.forEach(c => {
    const b = document.createElement("button");
    b.className = "chip";
    b.textContent = c;
    b.addEventListener("click", () => selectClass(c));
    wrap.appendChild(b);
  });
}
function buildSessionChips() {
  const wrap = $("#sessionChips");
  wrap.innerHTML = "";
  S.sessions.forEach(s => {
    const b = document.createElement("button");
    b.className = "chip";
    b.textContent = s;
    b.addEventListener("click", () => selectSession(s));
    wrap.appendChild(b);
  });
}

function selectClass(cls) {
  S.activeClass = cls;
  $("#activeClass").textContent = `• ${cls}`;
  $$("#classChips .chip").forEach(ch => ch.classList.toggle("active", ch.textContent === cls));
  renderRoster();
  refreshKPIs();
  refreshTodaySummary();
}
function selectSession(s) {
  S.activeSession = s;
  $$("#sessionChips .chip").forEach(ch => ch.classList.toggle("active", ch.textContent === s));
  toast(`Session: ${s}`);
}

/* ========= Roster (inline attendance only) ========= */
function renderRoster() {
  const tb = $("#rosterTbody");
  if (!tb) return;
  const rows = S.students
    .filter(s => (s.className || s.grade || "Unassigned") === S.activeClass)
    .map(s => {
      const status = S.attendanceToday[s.id];
      const presentOn = status === "present" ? "active" : "";
      const absentOn = status === "absent" ? "active" : "";
      return `
        <tr data-id="${s.id}">
          <td><button class="link" data-pick="${s.id}">${csvEscape(s.name || "Student")}</button></td>
          <td>${csvEscape(s.username || "—")}</td>
          <td>${csvEscape(s.dob || "—")}</td>
          <td>${csvEscape(s.parentName || s.parentEmail || "—")}</td>
          <td>
            <div class="btn-group">
              <button class="btn ${presentOn}" data-attend="present">Present</button>
              <button class="btn ghost ${absentOn}" data-attend="absent">Absent</button>
            </div>
          </td>
        </tr>
      `;
    });

  tb.innerHTML = rows.length ? rows.join("") : `<tr><td colspan="5" class="muted">No students in this class.</td></tr>`;

  // Wire attendance
  $$("#rosterTbody [data-attend]").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      const tr = e.currentTarget.closest("tr");
      const sid = tr.dataset.id;
      await markAttendance(sid, e.currentTarget.dataset.attend);
      tr.querySelectorAll("[data-attend]").forEach(b => b.classList.remove("active"));
      e.currentTarget.classList.add("active");
      refreshKPIs();
      refreshTodaySummary();
    });
  });

  // Click name -> auto-select student in workspace
  $$("#rosterTbody [data-pick]").forEach(a => {
    a.addEventListener("click", () => {
      const sid = a.dataset.pick;
      S.lastSelectedStudentId = sid;
      $("#studentSelect").value = sid;
      refreshStudentView();
      toast("Loaded in Student Workspace");
      window.scrollTo({ top: $("#studentWorkspace").offsetTop - 12, behavior: "smooth" });
    });
  });
}

async function markAttendance(studentId, status) {
  const ref = doc(db, "students", studentId, "attendance", todayYMD(S.date));
  await setDoc(ref, { status, markedBy: S.user.uid, markedAt: serverTimestamp() }, { merge: true });
  S.attendanceToday[studentId] = status;
}
function markAllPresent() {
  const ids = S.students.filter(s => (s.className || s.grade || "Unassigned") === S.activeClass).map(s => s.id);
  Promise.all(ids.map(id => markAttendance(id, "present"))).then(() => {
    renderRoster();
    refreshKPIs();
    refreshTodaySummary();
  });
}

/* ========= KPIs & Today summary ========= */
function refreshKPIs() {
  const ids = S.students.filter(s => (s.className || s.grade || "Unassigned") === S.activeClass).map(s => s.id);
  let present = 0, absent = 0, total = ids.length;
  ids.forEach(id => {
    if (S.attendanceToday[id] === "present") present++;
    else if (S.attendanceToday[id] === "absent") absent++;
  });
  $("#statPresent").textContent = present;
  $("#statAbsent").textContent = absent;
  $("#statTotal").textContent = total;

  const pct = total ? Math.round((present / total) * 100) : 0;
  const bar = $("#overallProgressBar");
  bar.style.width = `${pct}%`;
  bar.setAttribute("aria-valuenow", String(pct));
}
function refreshTodaySummary() {
  $("#tPresent").textContent = $("#statPresent").textContent;
  $("#tAbsent").textContent = $("#statAbsent").textContent;
  $("#tTotal").textContent  = $("#statTotal").textContent;
}

/* ========= Search filter ========= */
function filterRosterBySearch(e) {
  const term = (e?.currentTarget?.value || "").toLowerCase();
  $$("#rosterTbody tr").forEach(tr => {
    tr.style.display = tr.innerText.toLowerCase().includes(term) ? "" : "none";
  });
}

/* ========= Export CSV ========= */
function exportCSV() {
  const rows = [["Name", "Username", "DOB", "Parent", "Class", "Attendance (Today)"]];
  S.students
    .filter(s => (s.className || s.grade || "Unassigned") === S.activeClass)
    .forEach(s => rows.push([
      s.name || "", s.username || "", s.dob || "",
      s.parentName || s.parentEmail || "",
      s.className || s.grade || "Unassigned",
      S.attendanceToday[s.id] || ""
    ]));
  const csv = rows.map(r => r.map(csvEscape).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `Roster_${S.activeClass || "class"}_${todayYMD(S.date)}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}

/* ========= Notes ========= */
async function saveTeacherNote() {
  const txt = $("#noteText").value.trim();
  if (!txt) return toast("Type a note first", "warn");
  if (S.lastSelectedStudentId) {
    await addDoc(collection(db, "students", S.lastSelectedStudentId, "notes"), {
      text: txt, by: S.user.uid, createdAt: serverTimestamp()
    });
  } else {
    await addDoc(collection(db, "teachers", S.user.uid, "notes"), {
      text: txt, createdAt: serverTimestamp()
    });
  }
  $("#noteText").value = "";
  showModal(false);
  toast("Note saved", "success");
}

/* ========= Student Workspace (attendance + curriculum + progress) ========= */
async function refreshStudentView() {
  const sid = S.lastSelectedStudentId;
  const nameEl = $("#studentNameHdr");
  const pctP = $("#pPct"), pctG = $("#gPct"), pctS = $("#sPct");
  const hist = $("#studentHistory");

  if (!sid) {
    nameEl.textContent = "—";
    pctP.textContent = "0%"; pctG.textContent = "0%"; pctS.textContent = "0%";
    hist.innerHTML = `<tr><td colspan="4" class="muted">Pick a student…</td></tr>`;
    return;
  }
  const st = S.students.find(x => x.id === sid);
  nameEl.textContent = st?.name || st?.username || sid;

  // Load today’s attendance doc (optional read; we keep local cache)
  const aRef = doc(db, "students", sid, "attendance", todayYMD(S.date));
  const aSnap = await getDoc(aRef);
  const status = aSnap.exists() ? aSnap.data().status : S.attendanceToday[sid];
  $("#btnStuPresent").classList.toggle("active", status === "present");
  $("#btnStuAbsent").classList.toggle("active", status === "absent");

  // Load progress to compute area averages & fill history
  const pSnap = await getDocs(collection(db, "students", sid, "progress"));
  let phon = 0, gram = 0, speak = 0, totP = 0, totG = 0, totS = 0;
  const rows = [];
  pSnap.forEach(d => {
    const x = d.data();
    const sc = ({ not_started: 0, emerging: 25, developing: 50, proficient: 75, mastered: 100 })[x.mastery || "not_started"] || 0;
    if (x.area === "phonics") { phon += sc; totP++; }
    else if (x.area === "grammar") { gram += sc; totG++; }
    else if (x.area === "speaking") { speak += sc; totS++; }
    const when = x.updatedAt?.toDate?.() ? x.updatedAt.toDate().toLocaleString() : "—";
    rows.push(`<tr><td>${csvEscape(x.area || "")}</td><td>${csvEscape(x.topic || x.topicId || "")}</td><td>${csvEscape(x.mastery || "")}</td><td>${when}</td></tr>`);
  });
  const pct = (sum, cnt) => cnt ? Math.round(sum / cnt) : 0;
  pctP.textContent = pct(phon, totP) + "%";
  pctG.textContent = pct(gram, totG) + "%";
  pctS.textContent = pct(speak, totS) + "%";
  hist.innerHTML = rows.length ? rows.sort().reverse().slice(0, 15).join("") : `<tr><td colspan="4" class="muted">No entries</td></tr>`;
}

async function saveAllForStudent() {
  const sid = S.lastSelectedStudentId;
  if (!sid) return toast("Pick a student first", "warn");

  // 1) Attendance
  const pres = $("#btnStuPresent").classList.contains("active");
  const abs  = $("#btnStuAbsent").classList.contains("active");
  if (pres || abs) {
    await markAttendance(sid, pres ? "present" : "absent");
  }

  // 2) Curriculum
  const cTopic = $("#curTopic").value.trim();
  const cStatus = $("#curStatus").value;
  const cNote = $("#curNote").value.trim();
  if (cTopic && cStatus) {
    const topicId = cTopic.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    const ref = doc(db, "students", sid, "curriculum", topicId);
    await setDoc(ref, {
      topicId, status: cStatus, teacherNote: cNote || null,
      updatedBy: S.user.uid, updatedAt: serverTimestamp()
    }, { merge: true });
  }

  // 3) Topic Progress
  const area = $("#progArea").value;
  const topic = $("#progTopic").value.trim();
  const subskill = $("#progSubskill").value.trim();
  const mastery = $("#progMastery").value;
  const scoreBand = $("#progScore").value;
  const evidence = $("#progEvidence").value;
  const nextAction = $("#progNext").value;
  const remark = $("#progRemark").value.trim();

  if (area && topic && mastery) {
    const topicId = topic.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    const ref = doc(db, "students", sid, "progress", topicId);
    await setDoc(ref, {
      topicId, area, topic, subskill: subskill || null,
      mastery, scoreBand: scoreBand || null,
      lastEvidence: evidence || null, nextAction: nextAction || null,
      teacherRemark: remark || null, updatedBy: S.user.uid, updatedAt: serverTimestamp()
    }, { merge: true });
  }

  toast("Saved all updates", "success");
  refreshStudentView();
}

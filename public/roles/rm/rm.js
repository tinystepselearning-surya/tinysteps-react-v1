// Tiny Steps — RM Front-End (v1.2 safe-guarded)
// Path: public/roles/rm/rm.js

// ========== Firebase (Modular v11, CDN) ==========
import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAuth, onAuthStateChanged, getIdTokenResult, signOut } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { initializeAppCheck, ReCaptchaV3Provider } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app-check.js";
import { initProfileMenu } from "../../shared/profile-menu.js";
import {
  getFirestore, doc, getDoc, setDoc, updateDoc, deleteDoc, serverTimestamp,
  collection, collectionGroup, getDocs, addDoc, query, where, orderBy, limit
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

// ---- Config ----
const firebaseConfig = {
  apiKey: "AIzaSyBxLOnu1Se8w8bDzh4LytpFN6JLUh1CCTs",
  authDomain: "tinystepselearning-surya.firebaseapp.com",
  projectId: "tinystepselearning-surya"
};

// ---- Bootstrap ----
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Optional App Check via <meta name="app-check-key" content="...">
try {
  const appCheckKey = document.querySelector('meta[name="app-check-key"]')?.content?.trim();
  if (appCheckKey) {
    initializeAppCheck(app, { provider: new ReCaptchaV3Provider(appCheckKey), isTokenAutoRefreshEnabled: true });
  }
} catch (e) { console.warn("AppCheck init skipped:", e?.message || e); }

// ========== DOM Helpers ==========
const $  = (sel, root=document) => root.querySelector(sel);
const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));
const formatDate = (d) => d instanceof Date ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(d) : "";
const toYyyymmdd = (date=new Date()) => {
  const y = date.getFullYear(); const m = String(date.getMonth()+1).padStart(2,"0"); const d = String(date.getDate()).padStart(2,"0");
  return `${y}${m}${d}`;
};
const ellipsize = (str, n=42) => (str?.length>n ? str.slice(0, n-1)+"…" : (str||""));

// ========== State ==========
const state = {
  user: null,
  role: "rm",
  filters: { teachers: new Set(), status: "active", area: "all", from: null, to: null, search: "" },
  pagination: { assignmentsPage: 1, pageSize: 20, rows: [] },
  currentTicketId: null,
  currentStudentId: null,
  students: [],
  teacherDirectory: [],
  currentAssignment: null,
  currentEnrollments: {},
  currentSubscription: null
};

const COURSE_TRACKS = [
  {
    course: "phonics",
    label: "Phonics",
    tracks: [
      { key: "phonics_early", code: "early", label: "Early Phonics" },
      { key: "phonics_advanced", code: "advanced", label: "Advanced Phonics" },
      { key: "phonics_foundations", code: "foundations", label: "Phonics Foundations" }
    ]
  },
  {
    course: "grammar",
    label: "Grammar",
    tracks: [
      { key: "grammar_basic", code: "basic", label: "Basic Grammar" },
      { key: "grammar_advanced", code: "advanced", label: "Advanced Grammar" }
    ]
  },
  {
    course: "speaking",
    label: "Public Speaking",
    tracks: [
      { key: "speaking_basic", code: "basic", label: "Basic Public Speaking" },
      { key: "speaking_advanced", code: "advanced", label: "Advanced Public Speaking" }
    ]
  }
];

const TRACK_LOOKUP = {};
COURSE_TRACKS.forEach(course => {
  course.tracks.forEach(track => {
    TRACK_LOOKUP[track.key] = { course: course.course, courseLabel: course.label, label: track.label, code: track.code };
  });
});

// ========== Auth Guard (RM/Admin only; no premature redirect) ==========

/** Get role from custom claims; if missing, fall back to Firestore users/{uid}.role */
async function resolveUserRole(user) {
  try {
    const token = await getIdTokenResult(user, true);
    if (token?.claims?.role) return token.claims.role;
  } catch (e) { console.warn("getIdTokenResult failed:", e?.message || e); }

  try {
    const udoc = await getDoc(doc(db, "users", user.uid));
    if (udoc.exists()) {
      const role = udoc.data()?.role;
      if (role) return role;
    }
  } catch (e) { console.warn("users doc role fetch failed:", e?.message || e); }

  return null;
}

/** Show sign-in UI instead of kicking back to home */
function showNeedsAuth() {
  location.replace("/roles/login.html?role=rm&next=%2Froles%2Frm%2F");
}

async function waitForAuthReady(instance) {
  if (typeof instance?.authStateReady === "function") {
    try {
      await instance.authStateReady();
      return;
    } catch (err) {
      console.warn("authStateReady failed:", err?.message || err);
    }
  }

  await new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(instance, () => {
      unsubscribe();
      resolve();
    });
  });
}

let uiInitialized = false;
let currentAuthedUid = null;
let authQueue = Promise.resolve();
let profileMenuHandle = null;

function queueAuthProcessing(user) {
  authQueue = authQueue.then(() => processAuthState(user)).catch((err) => {
    console.error("Auth guard processing failed:", err);
  });
}

async function processAuthState(user) {
  if (!user) {
    currentAuthedUid = null;
    uiInitialized = false;
    document.body.classList.remove("ready");
    showNeedsAuth();
    return;
  }

  if (uiInitialized && currentAuthedUid === user.uid) {
    return;
  }

  try {
    const role = await resolveUserRole(user);

    if (role !== "rm" && role !== "admin") {
      alert("Access denied. This page is for Relationship Managers.");
      await signOut(auth);
      showNeedsAuth();
      return;
    }

    currentAuthedUid = user.uid;
    state.user = user;
    state.role = role;

    if (!uiInitialized) {
      initUI(user, role);
      uiInitialized = true;
    } else {
      document.body.classList.add("ready");
      try {
        await refreshPortalData();
      } catch (err) {
        console.error("RM portal data refresh failed:", err);
      }
    }
  } catch (e) {
    console.error("Auth guard error:", e);
    alert("Authentication error. Please sign in again.");
    await signOut(auth);
    showNeedsAuth();
  }
}

(async () => {
  await waitForAuthReady(auth);
  await processAuthState(auth.currentUser);
  onAuthStateChanged(auth, (user) => queueAuthProcessing(user));
})();

// ========== UI Init ==========
function initUI(user, role) {
  state.user = user;
  state.role = role;
  document.body.classList.add("ready"); // hide any “please sign in” state

  const roleLabel = role === "admin" ? "Admin" : "Relationship Manager";
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

  setupTabs();
  setupFilters();
  wireAssignmentsSection();
  wireMonitorSection();
  wireStudentsSection();
  wireCommSection();

  $("#globalSearch")?.addEventListener("input", (e) => {
    state.filters.search = e.target.value.trim().toLowerCase();
    renderAssignmentsTable();
    renderStudentsGrid();
  });

  refreshPortalData().catch(console.error);
}

function refreshPortalData() {
  return Promise.all([
    loadTeachersForFilters(),
    loadAssignments(),
    loadTodayKpis(),
    loadStudentsSummaries(),
    loadTicketsInbox()
  ]);
}

// ========== Tabs ==========
function setupTabs() {
  const tabs = $$(".tab");
  tabs.forEach(btn => {
    btn.addEventListener("click", () => {
      tabs.forEach(b => {
        b.classList.toggle("active", b === btn);
        const pid = b.getAttribute("aria-controls");
        const panel = pid ? document.getElementById(pid) : null;
        if (panel) panel.toggleAttribute("hidden", !b.classList.contains("active"));
      });
    });
  });
}

// ========== Filters ==========
function setupFilters() {
  const filterTeacher = $("#filterTeacher");
  const filterStatus  = $("#filterStatus");
  const filterArea    = $("#filterArea");
  const filterFrom    = $("#filterFrom");
  const filterTo      = $("#filterTo");
  const clearBtn      = $("#clearFiltersBtn");

  filterTeacher?.addEventListener("change", () => {
    state.filters.teachers = new Set(Array.from(filterTeacher.selectedOptions).map(o => o.value));
    renderAssignmentsTable(); renderMonitorTeachers(); renderStudentsGrid();
  });
  filterStatus?.addEventListener("change", () => { state.filters.status = filterStatus.value; renderAssignmentsTable(); });
  filterArea?.addEventListener("change", () => { state.filters.area = filterArea.value; renderStudentsGrid(); });
  filterFrom?.addEventListener("change", () => { state.filters.from = filterFrom.value ? new Date(filterFrom.value) : null; renderAssignmentsTable(); });
  filterTo?.addEventListener("change", () => { state.filters.to   = filterTo.value   ? new Date(filterTo.value)   : null; renderAssignmentsTable(); });
  clearBtn?.addEventListener("click", () => {
    state.filters = { teachers: new Set(), status: "active", area: "all", from: null, to: null, search: "" };
    if (filterTeacher) Array.from(filterTeacher.options).forEach(o => (o.selected = false));
    if (filterStatus)  filterStatus.value = "active";
    if (filterArea)    filterArea.value   = "all";
    if (filterFrom)    filterFrom.value   = "";
    if (filterTo)      filterTo.value     = "";
    const globalSearch = $("#globalSearch"); if (globalSearch) globalSearch.value = "";
    renderAssignmentsTable(); renderStudentsGrid(); renderMonitorTeachers();
  });
}

async function fetchTeacherDirectory(force=false) {
  if (!force && Array.isArray(state.teacherDirectory) && state.teacherDirectory.length) {
    return state.teacherDirectory;
  }

  let snap;
  try {
    snap = await getDocs(query(collection(db, "users"), where("role", "==", "teacher"), orderBy("displayName")));
  } catch {
    snap = await getDocs(query(collection(db, "users"), where("role", "==", "teacher")));
  }

  const teachers = [];
  snap.forEach(docu => {
    const d = docu.data() || {};
    teachers.push({
      id: docu.id,
      name: d.displayName || d.email || docu.id,
      email: d.email || "",
      status: (d.status || "").toLowerCase(),
      rawStatus: d.status || ""
    });
  });

  teachers.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
  state.teacherDirectory = teachers;
  return teachers;
}

async function loadTeachersForFilters() {
  const sel = $("#filterTeacher"); if (!sel) return;
  const selected = state.filters.teachers instanceof Set ? new Set(state.filters.teachers) : new Set();
  sel.innerHTML = "";

  const teachers = await fetchTeacherDirectory(true);
  teachers.forEach(t => {
    const option = document.createElement("option");
    option.value = t.id;
    option.textContent = t.name;
    if (selected.has(t.id)) option.selected = true;
    sel.appendChild(option);
  });

  if (sel.multiple) {
    state.filters.teachers = new Set(Array.from(sel.selectedOptions).map(o => o.value));
  }
}

// ========== Assignments ==========
const assignmentsTbody  = $("#assignmentsTbody");
const assignPrev        = $("#assignPrev");
const assignNext        = $("#assignNext");
const assignPageInfo    = $("#assignPageInfo");
const btnAssign         = $("#btnAssign");
const assignModal       = $("#assignModal");
const assignForm        = $("#assignForm");
const assignClose       = $("#assignClose");
const assignCancel      = $("#assignCancel");

btnAssign?.addEventListener("click", openAssignModal);
assignClose?.addEventListener("click", () => assignModal?.close?.() ?? assignModal?.removeAttribute?.("open"));
assignCancel?.addEventListener("click", () => assignModal?.close?.() ?? assignModal?.removeAttribute?.("open"));
assignForm?.addEventListener("submit", saveAssignment);
assignPrev?.addEventListener("click", () => paginateAssignments(-1));
assignNext?.addEventListener("click", () => paginateAssignments(1));

async function loadAssignments() {
  const isAdmin = state.role === "admin";
  const snap = await getDocs(collectionGroup(db, "links"));
  const assignDocs = [];

  for (const docu of snap.docs) {
    if (docu.id !== "assignment") continue;
    const d = docu.data();
    if (!isAdmin && d.rmId !== state.user.uid) continue; // RM sees only theirs
    const sid = docu.ref.path.split("/")[1]; // students/{sid}/links/assignment
    assignDocs.push({ sid, ...d });
  }

  state.pagination.rows = await Promise.all(assignDocs.map(async a => {
    const parent  = a.parentUid  ? await getDoc(doc(db, "users", a.parentUid))   : null;
    const teacher = a.teacherId  ? await getDoc(doc(db, "users", a.teacherId))   : null;
    const student =                await getDoc(doc(db, "students", a.sid));
    return {
      ...a,
      studentName: student.exists() ? (student.data().name || a.sid) : a.sid,
      parentName:  parent?.exists() ? (parent.data().displayName  || parent.data().email  || a.parentUid) : (a.parentUid || "-"),
      teacherName: teacher?.exists() ? (teacher.data().displayName || teacher.data().email || a.teacherId) : (a.teacherId || "-"),
      updatedAt:   a.updatedAt?.toDate ? a.updatedAt.toDate() : null
    };
  }));

  state.pagination.assignmentsPage = 1;
  renderAssignmentsTable();
}

function renderAssignmentsTable() {
  const { rows, assignmentsPage, pageSize } = state.pagination;
  if (!assignmentsTbody) return;

  let filtered = rows.filter(r => {
    if (state.filters.status !== "all" && r.status !== state.filters.status) return false;
    if (state.filters.teachers.size && !state.filters.teachers.has(r.teacherId)) return false;
    const s = state.filters.search;
    if (s) {
      const blob = `${r.studentName} ${r.parentName} ${r.teacherName}`.toLowerCase();
      if (!blob.includes(s)) return false;
    }
    if (state.filters.from && r.updatedAt && r.updatedAt < state.filters.from) return false;
    if (state.filters.to && r.updatedAt && r.updatedAt > state.filters.to) return false;
    return true;
  });

  const total = filtered.length;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const page  = Math.min(assignmentsPage, pages);
  const start = (page - 1) * pageSize;
  const slice = filtered.slice(start, start + pageSize);

  assignmentsTbody.innerHTML = slice.map(r => `
    <tr>
      <td>${ellipsize(r.studentName, 28)}</td>
      <td>${ellipsize(r.parentName, 28)}</td>
      <td>${ellipsize(r.teacherName, 28)}</td>
      <td><span class="status ${r.status}">${r.status}</span></td>
      <td>${r.updatedAt ? formatDate(r.updatedAt) : "-"}</td>
      <td>
        <button class="btn tiny ghost" data-action="reassign" data-sid="${r.sid}">Reassign</button>
        <button class="btn tiny ghost" data-action="pause"    data-sid="${r.sid}">Pause</button>
        <button class="btn tiny ghost" data-action="end"      data-sid="${r.sid}">End</button>
      </td>
    </tr>
  `).join("") || `<tr><td colspan="6">No assignments found.</td></tr>`;

  if (assignPrev) assignPrev.disabled = page <= 1;
  if (assignNext) assignNext.disabled = page >= pages;
  if (assignPageInfo) assignPageInfo.textContent = `Page ${page} of ${pages}`;

  assignmentsTbody.querySelectorAll("button[data-action]").forEach(btn => {
    btn.addEventListener("click", () => handleAssignmentAction(btn.dataset.action, btn.dataset.sid));
  });
}

function paginateAssignments(delta) {
  state.pagination.assignmentsPage = Math.max(1, state.pagination.assignmentsPage + delta);
  renderAssignmentsTable();
}

async function handleAssignmentAction(action, sid) {
  const ref = doc(db, `students/${sid}/links/assignment`);
  const snap = await getDoc(ref);
  if (!snap.exists()) return alert("Assignment not found");

  if (action === "pause" || action === "end") {
    const status = action === "pause" ? "paused" : "ended";
    await updateDoc(ref, { status, updatedAt: serverTimestamp(), updatedBy: state.user.uid });
    await loadAssignments();
    return;
  }
  if (action === "reassign") openAssignModal(sid, snap.data());
}

async function openAssignModal(sid=null, data=null) {
  const pSel = $("#assignParent");
  const sSel = $("#assignStudent");
  const tSel = $("#assignTeacher");
  const statusSel = $("#assignStatus");
  if (!pSel || !sSel || !tSel) return;

  // Parents
  pSel.innerHTML = "";
  const psnap = await getDocs(query(collection(db, "users"), where("role", "==", "parent")));
  psnap.forEach(u => {
    const d = u.data(); const opt = document.createElement("option");
    opt.value = u.id; opt.textContent = d.displayName || d.email || u.id; pSel.appendChild(opt);
  });

  // Students
  sSel.innerHTML = "";
  const studentsSnap = await getDocs(collection(db, "students"));
  studentsSnap.forEach(s => {
    const d = s.data(); const opt = document.createElement("option");
    opt.value = s.id; opt.textContent = d.name || s.id; sSel.appendChild(opt);
  });

  // Teachers
  tSel.innerHTML = "";
  try {
    const tsnap = await getDocs(query(collection(db, "users"), where("role", "==", "teacher"), orderBy("displayName")));
    tsnap.forEach(t => {
      const d = t.data(); const opt = document.createElement("option");
      opt.value = t.id; opt.textContent = d.displayName || d.email || t.id; tSel.appendChild(opt);
    });
  } catch {
    const tsnap = await getDocs(query(collection(db, "users"), where("role", "==", "teacher")));
    tsnap.forEach(t => {
      const d = t.data(); const opt = document.createElement("option");
      opt.value = t.id; opt.textContent = d.displayName || d.email || t.id; tSel.appendChild(opt);
    });
  }

  const assignTitleEl = $("#assignTitle");
  if (sid && data) {
    sSel.value = sid;
    if (data.parentUid) pSel.value = data.parentUid;
    if (data.teacherId) tSel.value = data.teacherId;
    if (statusSel) statusSel.value = data.status || "active";
    if (assignTitleEl) assignTitleEl.textContent = "Reassign";
  } else {
    if (assignTitleEl) assignTitleEl.textContent = "New Assignment";
  }

  if (assignModal?.showModal) assignModal.showModal();
  else assignModal?.setAttribute?.("open", "");
}

async function saveAssignment(e) {
  e.preventDefault();
  const parentUid = $("#assignParent")?.value;
  const sid       = $("#assignStudent")?.value;
  const teacherId = $("#assignTeacher")?.value;
  const status    = $("#assignStatus")?.value || "active";
  const rmId      = state.user.uid;

  if (!parentUid || !sid || !teacherId) { alert("Please select Parent, Student, and Teacher."); return; }

  const assignRef = doc(db, `students/${sid}/links/assignment`);
  await setDoc(assignRef, {
    parentUid, teacherId, rmId, status,
    assignedAt: serverTimestamp(), assignedBy: state.user.uid,
    updatedAt: serverTimestamp(), updatedBy: state.user.uid
  }, { merge: true });

  await setDoc(doc(db, `teachers/${teacherId}/students/${sid}`), {
    linked: true, rmId, parentUid, status, updatedAt: serverTimestamp()
  }, { merge: true });

  await setDoc(doc(db, `parents/${parentUid}/children/${sid}`), {
    linked: true, teacherId, rmId, status, updatedAt: serverTimestamp()
  }, { merge: true });

  assignModal?.close?.() ?? assignModal?.removeAttribute?.("open");
  await loadAssignments();
  alert("Assignment saved.");
}

// ========== Daily Monitor ==========
const kpiClasses        = $("#kpiClasses");
const kpiMinutes        = $("#kpiMinutes");
const kpiActiveTeachers = $("#kpiActiveTeachers");
const refreshMonitor    = $("#refreshMonitor");
const monitorTeachersTbody = $("#monitorTeachersTbody");
const monitorAlerts      = $("#monitorAlerts");

refreshMonitor?.addEventListener("click", () => { loadTodayKpis().catch(console.error); });

async function loadTodayKpis() {
  const todayKey = toYyyymmdd(new Date());
  let classes = 0, minutes = 0, active = 0;
  if (monitorTeachersTbody) monitorTeachersTbody.innerHTML = `<tr><td colspan="5">Loading…</td></tr>`;

  const tsnap = await getDocs(query(collection(db, "users"), where("role", "==", "teacher")));
  const rows = [];
  for (const tdoc of tsnap.docs) {
    const t = tdoc.data();
    const sess = await getDoc(doc(db, `teachers/${tdoc.id}/sessions/${todayKey}`));
    if (sess.exists()) {
      const d = sess.data();
      const count = d.classesCount || 0;
      const mins = d.minutesTaught || 0;
      const students = Array.isArray(d.students) ? d.students : [];
      if (count > 0) active += 1;
      classes += count; minutes += mins;
      rows.push({ teacherId: tdoc.id, teacherName: t.displayName || t.email || tdoc.id, classes: count, minutes: mins, students });
    } else {
      rows.push({ teacherId: tdoc.id, teacherName: t.displayName || t.email || tdoc.id, classes: 0, minutes: 0, students: [] });
    }
  }

  if (kpiClasses) kpiClasses.textContent = String(classes);
  if (kpiMinutes) kpiMinutes.textContent = String(minutes);
  if (kpiActiveTeachers) kpiActiveTeachers.textContent = String(active);
  renderMonitorTeachers(rows);
  await loadMonitorAlerts(rows);
}

function renderMonitorTeachers(rows = []) {
  if (!monitorTeachersTbody) return;
  let list = rows;

  const teacherFilter = state.filters.teachers;
  if (teacherFilter.size) list = list.filter(r => teacherFilter.has(r.teacherId));

  monitorTeachersTbody.innerHTML = list.map(r => `
    <tr>
      <td>${ellipsize(r.teacherName, 28)}</td>
      <td>${r.classes}</td>
      <td>${r.minutes}</td>
      <td>
        <div class="chips">
          ${r.students.map(sid => `<span class="chip">${ellipsize(sid, 16)}</span>`).join("")}
        </div>
      </td>
      <td><button class="btn tiny ghost" data-open-students="${r.teacherId}">View</button></td>
    </tr>
  `).join("") || `<tr><td colspan="5">No teacher data for today.</td></tr>`;

  monitorTeachersTbody.querySelectorAll("button[data-open-students]").forEach(btn => {
    btn.addEventListener("click", () => {
      const tid = btn.dataset.openStudents;
      $("#tab-students")?.click();
      const filterTeacher = $("#filterTeacher");
      if (filterTeacher) {
        Array.from(filterTeacher.options).forEach(o => (o.selected = (o.value === tid)));
        state.filters.teachers = new Set([tid]);
      }
      renderStudentsGrid();
    });
  });
}

async function loadMonitorAlerts(rows) {
  if (!monitorAlerts) return;
  monitorAlerts.innerHTML = "";
  const zeroTeachers = rows.filter(r => r.classes === 0);
  zeroTeachers.forEach(r => {
    const li = document.createElement("li");
    li.innerHTML = `<span>${ellipsize(r.teacherName)} hasn't marked any class today.</span>`;
    monitorAlerts.appendChild(li);
  });
}

// ========== Students ==========
const studentsGrid        = $("#studentsGrid");
const studentSearch       = $("#studentSearch");
const studentDrawer       = $("#studentDrawer");
const studentDrawerMask   = $("#studentDrawerMask");
const studentDrawerTitle  = $("#studentDrawerTitle");
const studentPlanForm     = $("#studentPlanForm");
const studentParentList   = $("#studentParentList");
const studentEnrollmentList = $("#studentEnrollmentList");
const studentTeacherSelect  = $("#studentTeacherSelect");
const studentTeacherStatus  = $("#studentTeacherStatus");
const studentMappingMeta    = $("#studentMappingMeta");
const studentIdBadge        = $("#studentIdBadge");
const courseTrackContainer  = $("#courseTrackContainer");
const studentProgressMeta   = $("#studentProgressMeta");
const studentProgressCards  = $("#studentProgressCards");
const studentSaveStatus     = $("#studentSaveStatus");
const studentSaveBtn        = $("#studentSaveBtn");
const subscriptionPlanInput   = $("#subscriptionPlan");
const subscriptionExpiryInput = $("#subscriptionExpiry");
const subscriptionFlagPlan    = $("#subscriptionFlagPlan");
const subscriptionFlagExpiry  = $("#subscriptionFlagExpiry");
const sdTabs = {
  progress:   $("#sd-tab-progress"),
  curriculum: $("#sd-tab-curriculum"),
  attendance: $("#sd-tab-attendance")
};
const sdPanels = {
  progress:   $("#sd-progress"),
  curriculum: $("#sd-curriculum"),
  attendance: $("#sd-attendance")
};
const sdProgressList    = $("#sdProgressList");
const sdCurriculumList  = $("#sdCurriculumList");
const sdAttendanceTbody = $("#sdAttendanceTbody");

studentSearch?.addEventListener("input", () => renderStudentsGrid());
$("#closeStudentDrawer")?.addEventListener("click", closeStudentDrawer);
studentDrawerMask?.addEventListener("click", closeStudentDrawer);
studentPlanForm?.addEventListener("submit", saveStudentPlan);

Object.entries(sdTabs).forEach(([key, btn]) => {
  btn?.addEventListener("click", () => {
    Object.values(sdTabs).forEach(b => b.classList.toggle("active", b === btn));
    Object.entries(sdPanels).forEach(([k, p]) => p.toggleAttribute("hidden", k !== key));
  });
});

function buildCourseTrackControls() {
  if (!courseTrackContainer || courseTrackContainer.dataset.ready === "true") return;
  const cards = COURSE_TRACKS.map(course => `
    <article class="course-card" data-course="${course.course}">
      <h5>${course.label}</h5>
      <div class="track-list">
        ${course.tracks.map(trackItemMarkup).join("")}
      </div>
    </article>
  `).join("");
  courseTrackContainer.innerHTML = cards;
  courseTrackContainer.dataset.ready = "true";
  courseTrackContainer.querySelectorAll(".track-status").forEach(sel => {
    sel.addEventListener("change", () => updateTrackItemState(sel.closest(".track-item")));
  });
  courseTrackContainer.querySelectorAll(".track-item").forEach(updateTrackItemState);
}

function trackItemMarkup(track) {
  return `
    <div class="track-item" data-track-key="${track.key}">
      <div class="track-head">
        <span class="track-name">${track.label}</span>
        <select class="select track-status" aria-label="${track.label} status">
          <option value="inactive" selected>Not enrolled</option>
          <option value="active">Active</option>
          <option value="paused">Paused</option>
        </select>
      </div>
      <div class="track-fields">
        <label class="field">
          <span class="field-label">Start</span>
          <input type="date" class="input track-start" disabled />
        </label>
        <label class="field">
          <span class="field-label">End</span>
          <input type="date" class="input track-end" disabled />
        </label>
      </div>
      <label class="field">
        <span class="field-label">Notes</span>
        <textarea class="input track-notes" rows="2" placeholder="Optional notes" disabled></textarea>
      </label>
    </div>
  `;
}

function updateTrackItemState(item) {
  if (!item) return;
  const status = item.querySelector(".track-status")?.value || "inactive";
  const active = status !== "inactive";
  item.classList.toggle("track-inactive", !active);
  item.querySelectorAll(".track-start, .track-end, .track-notes").forEach(input => {
    input.disabled = !active;
  });
}

function toInputDate(value) {
  if (!value) return "";
  if (typeof value === "string") {
    return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : "";
  }
  if (value instanceof Date) {
    const y = value.getFullYear();
    const m = String(value.getMonth() + 1).padStart(2, "0");
    const d = String(value.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  if (value?.toDate) {
    return toInputDate(value.toDate());
  }
  if (typeof value === "number") {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "" : toInputDate(date);
  }
  return "";
}

function collectTrackFormData() {
  const map = {};
  COURSE_TRACKS.forEach(course => {
    course.tracks.forEach(track => {
      const item = courseTrackContainer?.querySelector(`.track-item[data-track-key="${track.key}"]`);
      if (!item) return;
      const status = item.querySelector(".track-status")?.value || "inactive";
      const start = item.querySelector(".track-start")?.value || "";
      const end   = item.querySelector(".track-end")?.value   || "";
      const notes = item.querySelector(".track-notes")?.value?.trim() || "";
      map[track.key] = {
        status,
        startDate: start || null,
        endDate: end || null,
        notes,
        course: course.course,
        courseLabel: course.label,
        track: track.code || track.label,
        trackLabel: track.label
      };
    });
  });
  return map;
}

function hydrateCourseTrackForm(enrollments = {}) {
  COURSE_TRACKS.forEach(course => {
    course.tracks.forEach(track => {
      const item = courseTrackContainer?.querySelector(`.track-item[data-track-key="${track.key}"]`);
      if (!item) return;
      const row = enrollments[track.key];
      const statusSel = item.querySelector(".track-status");
      const startInput = item.querySelector(".track-start");
      const endInput   = item.querySelector(".track-end");
      const notesInput = item.querySelector(".track-notes");

      if (row) {
        if (statusSel) statusSel.value = row.status || "active";
        if (startInput) startInput.value = toInputDate(row.startDate);
        if (endInput)   endInput.value   = toInputDate(row.endDate);
        if (notesInput) notesInput.value = row.notes || "";
      } else {
        if (statusSel) statusSel.value = "inactive";
        if (startInput) startInput.value = "";
        if (endInput)   endInput.value   = "";
        if (notesInput) notesInput.value = "";
      }
      updateTrackItemState(item);
    });
  });
}

function renderChipList(container, chips = [], fallbackText = "None") {
  if (!container) return;
  container.classList.remove("muted");
  container.innerHTML = "";
  if (!chips.length) {
    const span = document.createElement("span");
    span.className = "muted";
    span.textContent = fallbackText;
    container.appendChild(span);
    return;
  }
  chips.forEach(chip => {
    const span = document.createElement("span");
    span.className = chip.className || "chip";
    span.textContent = chip.label;
    if (chip.title) span.title = chip.title;
    container.appendChild(span);
  });
}

function renderEnrollmentChips(enrollments = {}) {
  if (!studentEnrollmentList) return;
  const chips = Object.entries(enrollments)
    .filter(([, row]) => {
      if (!row) return false;
      const status = (row.status || "active").toLowerCase();
      return status === "active" || status === "paused";
    })
    .map(([key, row]) => {
      const status = (row.status || "active").toLowerCase();
      const meta = TRACK_LOOKUP[key];
      const label = meta ? `${meta.courseLabel} · ${meta.label}` : key;
      const statusLabel = status === "paused" ? "Paused" : "Active";
      return {
        label: `${label} (${statusLabel})`,
        title: label,
        className: `chip ${status === "paused" ? "chip-paused" : "chip-active"}`
      };
    });
  renderChipList(studentEnrollmentList, chips, "No active enrollments.");
}

function renderProgressSnapshot(sum = {}) {
  if (studentProgressCards) {
    const areas = [
      { key: "phonics", label: "Phonics" },
      { key: "grammar", label: "Grammar" },
      { key: "speaking", label: "Public Speaking" }
    ];
    studentProgressCards.innerHTML = areas.map(area => {
      const data = sum[area.key] || {};
      const curriculum = data.curriculumPct ?? data.curriculumCompletionPct ?? 0;
      const mastery    = data.masteryPct ?? data.mastery ?? 0;
      const track      = data.track || "—";
      const lastEvidence = data.lastEvidence || data.lastEvidenceTopic || data.lastEvidenceSummary || "—";
      const updatedTs = data.updatedAt?.toDate?.() || data.lastEvidenceAt?.toDate?.() || data.lastUpdated?.toDate?.();
      const updated = updatedTs ? formatDate(updatedTs) : "—";
      return `
        <article class="progress-card">
          <h5>${area.label}</h5>
          <div class="progress-metrics">
            <div>Track <span>${track || "—"}</span></div>
            <div>Curriculum <span>${Math.round(Number(curriculum) || 0)}%</span></div>
            <div>Mastery <span>${Math.round(Number(mastery) || 0)}%</span></div>
          </div>
          <div class="progress-meta">Last evidence: ${ellipsize(lastEvidence, 64) || "—"}</div>
          <div class="progress-meta">Updated: ${updated}</div>
        </article>
      `;
    }).join("");
  }
  if (studentProgressMeta) {
    const overall = sum.lastUpdated?.toDate?.();
    studentProgressMeta.textContent = overall ? `Last synced ${formatDate(overall)}` : "No progress data yet";
  }
}

function setStudentSaveStatus(message = "", tone = "info") {
  if (!studentSaveStatus) return;
  studentSaveStatus.textContent = message;
  studentSaveStatus.classList.remove("success", "error");
  if (tone === "success") studentSaveStatus.classList.add("success");
  if (tone === "error") studentSaveStatus.classList.add("error");
}

function isTeacherActive(teacher) {
  const status = (teacher?.status || "").toLowerCase();
  return !status || status === "active" || status === "approved" || status === "enabled";
}

function populateTeacherSelect(teachers = [], assignment = {}, studentData = {}) {
  if (!studentTeacherSelect) return null;
  const selectedId = assignment?.teacherId || studentData.primaryTeacherUid || "";
  studentTeacherSelect.innerHTML = "";
  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = "Select teacher";
  studentTeacherSelect.appendChild(placeholder);

  const activeTeachers = teachers.filter(isTeacherActive);
  activeTeachers.forEach(t => {
    const opt = document.createElement("option");
    opt.value = t.id;
    opt.textContent = t.name;
    studentTeacherSelect.appendChild(opt);
  });

  const activeIds = new Set(activeTeachers.map(t => t.id));
  if (selectedId && activeIds.has(selectedId)) {
    studentTeacherSelect.value = selectedId;
  } else {
    studentTeacherSelect.value = "";
  }

  const teacher = teachers.find(t => t.id === selectedId) || null;
  const teacherLabel = teacher ? teacher.name : (selectedId || "");
  const teacherActive = teacher ? isTeacherActive(teacher) : false;

  if (studentMappingMeta) {
    const parts = [];
    if (teacherLabel) parts.push(`Primary teacher: ${teacherLabel}${teacher && !teacherActive ? " (inactive)" : ""}`);
    if (assignment?.status) parts.push(`Status: ${assignment.status}`);
    if (assignment?.rmId) parts.push(`RM: ${assignment.rmId}`);
    studentMappingMeta.textContent = parts.join(" · ") || "—";
  }

  if (studentTeacherStatus) {
    const bits = [];
    if (assignment?.status) bits.push(`Assignment status: ${assignment.status}`);
    if (teacher) {
      bits.push(teacherActive ? `Current teacher: ${teacher.name}` : `Current teacher ${teacher.name} is inactive`);
    } else if (selectedId) {
      bits.push(`Current teacher: ${selectedId}`);
    } else {
      bits.push("No teacher assigned");
    }
    bits.push("Only active teachers are listed");
    studentTeacherStatus.textContent = bits.filter(Boolean).join(". ") + ".";
  }

  return teacher;
}

async function loadStudentsSummaries() {
  const studentIds = new Set();

  if (state.role === "admin") {
    const all = await getDocs(collection(db, "students"));
    all.forEach(d => studentIds.add(d.id));
  } else {
    const assignCg = await getDocs(collectionGroup(db, "links"));
    assignCg.forEach(d => {
      if (d.id === "assignment" && d.data().rmId === state.user.uid) {
        const sid = d.ref.path.split("/")[1];
        studentIds.add(sid);
      }
    });
  }

  const rows = [];
  for (const sid of studentIds) {
    const sDoc   = await getDoc(doc(db, "students", sid));
    const s      = sDoc.data() || {};
    const assign = await getDoc(doc(db, `students/${sid}/links/assignment`));
    const a      = assign.data() || {};
    const parent = a.parentUid ? await getDoc(doc(db, "users", a.parentUid)) : null;
    const teacher= a.teacherId ? await getDoc(doc(db, "users", a.teacherId)) : null;
    const summary= await getDoc(doc(db, `students/${sid}/summary`));
    const sum    = summary.data() || {};
    rows.push({
      sid,
      name: s.name || sid,
      parentName:  parent?.exists()  ? (parent.data().displayName || parent.data().email) : "-",
      teacherName: teacher?.exists() ? (teacher.data().displayName || teacher.data().email) : "-",
      teacherId: a.teacherId || null,
      mastery: {
        phonics:  sum.phonics?.masteryPct  ?? 0,
        grammar:  sum.grammar?.masteryPct  ?? 0,
        speaking: sum.speaking?.masteryPct ?? 0
      }
    });
  }

  state.students = rows;
  renderStudentsGrid();
}

function renderStudentsGrid() {
  if (!studentsGrid) return;
  const q = (studentSearch?.value || "").toLowerCase();
  const teacherFilter = state.filters.teachers;

  let rows = (state.students || []).filter(r => {
    if (q && !`${r.name} ${r.parentName} ${r.teacherName}`.toLowerCase().includes(q)) return false;
    if (teacherFilter?.size && (!r.teacherId || !teacherFilter.has(r.teacherId))) return false;
    return true;
  });

  studentsGrid.innerHTML = rows.map(r => `
    <article class="card student-card" data-student-id="${r.sid}">
      <header class="student-head">
        <div class="avatar" aria-hidden="true">👦</div>
        <div>
          <h3 class="student-name">${ellipsize(r.name, 26)}</h3>
          <div class="muted student-meta">${ellipsize(r.parentName, 32)} · ${ellipsize(r.teacherName, 32)}</div>
        </div>
        <button class="btn ghost open-details" data-sid="${r.sid}">Open</button>
      </header>
      <div class="student-metrics">
        ${metricRow("Phonics",  r.mastery.phonics)}
        ${metricRow("Grammar",  r.mastery.grammar)}
        ${metricRow("Speaking", r.mastery.speaking)}
      </div>
      <footer class="student-foot">
        <button class="btn tiny view-progress"   data-sid="${r.sid}">View Progress</button>
        <button class="btn tiny ghost view-curriculum" data-sid="${r.sid}">View Curriculum</button>
        <button class="btn tiny ghost view-attendance" data-sid="${r.sid}">Attendance</button>
      </footer>
    </article>
  `).join("") || `<div class="muted">No students.</div>`;

  studentsGrid.querySelectorAll(".open-details").forEach(b => b.addEventListener("click", () => openStudentDrawer(b.dataset.sid)));
  studentsGrid.querySelectorAll(".view-progress").forEach(b => b.addEventListener("click", async () => { await openStudentDrawer(b.dataset.sid); sdTabs.progress?.click(); }));
  studentsGrid.querySelectorAll(".view-curriculum").forEach(b => b.addEventListener("click", async () => { await openStudentDrawer(b.dataset.sid); sdTabs.curriculum?.click(); }));
  studentsGrid.querySelectorAll(".view-attendance").forEach(b => b.addEventListener("click", async () => { await openStudentDrawer(b.dataset.sid); sdTabs.attendance?.click(); }));
}

function metricRow(label, pct) {
  const p = Number(pct || 0);
  return `
    <div class="metric">
      <div class="metric-label">${label}</div>
      <div class="metric-bar"><span style="width:${Math.max(0, Math.min(100, p))}%"></span></div>
      <div class="metric-value">${Math.round(p)}%</div>
    </div>
  `;
}

async function openStudentDrawer(sid) {
  state.currentStudentId = sid;
  state.currentEnrollments = {};
  state.currentSubscription = null;
  state.currentAssignment = null;
  setStudentSaveStatus("");
  studentSaveBtn?.setAttribute("disabled", "true");

  studentPlanForm?.reset();
  hydrateCourseTrackForm({});

  if (studentDrawerTitle) studentDrawerTitle.textContent = "Loading…";
  if (studentIdBadge) studentIdBadge.textContent = sid;
  if (studentParentList) {
    studentParentList.classList.add("muted");
    studentParentList.textContent = "Loading…";
  }
  if (studentEnrollmentList) {
    studentEnrollmentList.classList.add("muted");
    studentEnrollmentList.textContent = "Loading…";
  }
  if (studentProgressCards) studentProgressCards.innerHTML = `<div class="muted">Loading progress…</div>`;
  if (studentProgressMeta) studentProgressMeta.textContent = "Pulling latest progress…";

  try {
    const studentRef = doc(db, "students", sid);
    const [studentSnap, assignmentSnap, summarySnap] = await Promise.all([
      getDoc(studentRef),
      getDoc(doc(db, `students/${sid}/links/assignment`)),
      getDoc(doc(db, `students/${sid}/summary`))
    ]);

    const studentData = studentSnap.data() || {};
    const assignment = assignmentSnap.exists() ? assignmentSnap.data() : {};
    const summary = summarySnap.data() || {};

    state.currentAssignment = assignment;

    if (studentDrawerTitle) studentDrawerTitle.textContent = studentData.name || sid;

    const parentIds = new Set();
    if (assignment.parentUid) parentIds.add(assignment.parentUid);
    if (Array.isArray(assignment.parentUids)) assignment.parentUids.forEach(pid => pid && parentIds.add(pid));
    if (assignment.secondaryParentUid) parentIds.add(assignment.secondaryParentUid);
    if (Array.isArray(assignment.parents)) {
      assignment.parents.forEach(entry => {
        if (!entry) return;
        if (typeof entry === "string") parentIds.add(entry);
        else if (entry.uid) parentIds.add(entry.uid);
      });
    }

    const parentChips = [];
    for (const pid of parentIds) {
      const snap = await getDoc(doc(db, "users", pid));
      const data = snap.exists() ? snap.data() : null;
      const name = data ? (data.displayName || data.email || pid) : pid;
      parentChips.push({ label: ellipsize(name, 42), title: name });
    }
    renderChipList(studentParentList, parentChips, "No parents linked.");

    const teachers = await fetchTeacherDirectory();
    populateTeacherSelect(teachers, assignment, studentData);

    const enrollmentSnap = await getDocs(collection(db, `students/${sid}/enrollments`));
    const enrollments = {};
    enrollmentSnap.forEach(docu => {
      enrollments[docu.id] = { ...docu.data() };
    });
    state.currentEnrollments = enrollments;
    hydrateCourseTrackForm(enrollments);
    renderEnrollmentChips(enrollments);

    const subscriptionSnap = await getDoc(doc(db, `students/${sid}/meta/subscription`));
    const subscription = subscriptionSnap.exists() ? subscriptionSnap.data() : {};
    state.currentSubscription = subscriptionSnap.exists() ? subscription : null;
    if (subscriptionPlanInput) subscriptionPlanInput.value = subscription.plan || "";
    if (subscriptionExpiryInput) subscriptionExpiryInput.value = toInputDate(subscription.expiry);
    if (subscriptionFlagPlan) subscriptionFlagPlan.checked = !!subscription.showPlan;
    if (subscriptionFlagExpiry) subscriptionFlagExpiry.checked = !!subscription.showExpiry;

    renderProgressSnapshot(summary);

    const sdProgressList = $("#sdProgressList");
    if (sdProgressList) sdProgressList.innerHTML = "Loading…";
    const progSnap = await getDocs(collection(db, `students/${sid}/progress`));
    const prog = progSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    if (sdProgressList) sdProgressList.innerHTML = prog.map(p => `
      <div class="progress-item">
        <div>
          <div><strong>${ellipsize(p.topic || p.id, 40)}</strong></div>
          <div class="muted">${ellipsize(p.area || "-", 64)} · Mastery: ${p.mastery || "-"}</div>
          ${p.teacherRemark ? `<div>${ellipsize(p.teacherRemark, 140)}</div>` : ""}
        </div>
        <div class="muted">${p.updatedAt?.toDate ? formatDate(p.updatedAt.toDate()) : ""}</div>
      </div>
    `).join("") || `<div class="muted">No progress yet.</div>`;

    const sdCurriculumList = $("#sdCurriculumList");
    if (sdCurriculumList) sdCurriculumList.innerHTML = "Loading…";
    const curSnap = await getDocs(collection(db, `students/${sid}/curriculum`));
    const cur = curSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    if (sdCurriculumList) sdCurriculumList.innerHTML = cur.map(c => `
      <div class="curriculum-item">
        <div>
          <div><strong>${ellipsize(c.topic || c.id, 40)}</strong></div>
          <div class="muted">Status: ${c.status || "-"}</div>
          ${c.teacherNote ? `<div>${ellipsize(c.teacherNote, 160)}</div>` : ""}
        </div>
        <div class="muted">${c.updatedAt?.toDate ? formatDate(c.updatedAt.toDate()) : ""}</div>
      </div>
    `).join("") || `<div class="muted">No curriculum entries.</div>`;

    const sdAttendanceTbody = $("#sdAttendanceTbody");
    if (sdAttendanceTbody) sdAttendanceTbody.innerHTML = "";
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const dt = new Date(today); dt.setDate(today.getDate() - i);
      const key = toYyyymmdd(dt);
      const row = await getDoc(doc(db, `students/${sid}/attendance/${key}`));
      if (row.exists() && sdAttendanceTbody) {
        const d = row.data();
        const marker = d.markedBy ? await getDoc(doc(db, "users", d.markedBy)) : null;
        const name = marker?.exists() ? (marker.data().displayName || marker.data().email || d.markedBy) : d.markedBy || "-";
        sdAttendanceTbody.insertAdjacentHTML("beforeend", `
          <tr>
            <td>${formatDate(dt)}</td>
            <td>${d.type || "class"}</td>
            <td>${d.durationMin || "-"}</td>
            <td>${ellipsize(name, 28)}</td>
          </tr>
        `);
      }
    }
  } catch (err) {
    console.error("Failed to load student detail", err);
    setStudentSaveStatus(err?.message ? `Failed to load student: ${err.message}` : "Failed to load student", "error");
  } finally {
    studentDrawer?.setAttribute("aria-hidden", "false");
    studentSaveBtn?.removeAttribute("disabled");
  }
}
function closeStudentDrawer() {
  state.currentStudentId = null;
  state.currentAssignment = null;
  state.currentEnrollments = {};
  state.currentSubscription = null;
  setStudentSaveStatus("");
  studentDrawer?.setAttribute("aria-hidden", "true");
}

async function saveStudentPlan(e) {
  e.preventDefault();
  if (!state.currentStudentId) return;

  studentSaveBtn?.setAttribute("disabled", "true");
  setStudentSaveStatus("Saving…");

  const sid = state.currentStudentId;
  const teacherId = studentTeacherSelect?.value || "";
  const normalizedTeacherId = teacherId || null;
  const assignment = state.currentAssignment || {};
  const trackData = collectTrackFormData();

  const assignmentRef   = doc(db, `students/${sid}/links/assignment`);
  const studentRef      = doc(db, "students", sid);
  const subscriptionRef = doc(db, `students/${sid}/meta/subscription`);

  try {
    const writes = [];
    const teacherChanged = (assignment.teacherId || null) !== normalizedTeacherId;
    const rmChanged = assignment.rmId !== state.user.uid;

    if (teacherChanged || rmChanged) {
      writes.push(setDoc(assignmentRef, {
        teacherId: normalizedTeacherId,
        rmId: state.user.uid,
        updatedAt: serverTimestamp(),
        updatedBy: state.user.uid
      }, { merge: true }));
    }

    if (teacherChanged || rmChanged) {
      const studentUpdates = {
        rmUid: state.user.uid,
        updatedAt: serverTimestamp(),
        updatedBy: state.user.uid,
        primaryTeacherUid: normalizedTeacherId
      };
      writes.push(setDoc(studentRef, studentUpdates, { merge: true }));
    }

    const enrollmentMap = {};
    Object.entries(trackData).forEach(([key, data]) => {
      const prev = state.currentEnrollments?.[key];
      if (data.status === "inactive") {
        if (prev) writes.push(deleteDoc(doc(db, `students/${sid}/enrollments/${key}`)));
      } else {
        const payload = {
          course: data.course,
          courseLabel: data.courseLabel,
          track: data.track,
          trackLabel: data.trackLabel,
          status: data.status,
          startDate: data.startDate,
          endDate: data.endDate,
          notes: data.notes || null,
          updatedAt: serverTimestamp(),
          updatedBy: state.user.uid
        };
        if (!prev ||
            (prev.status || "inactive") !== data.status ||
            (toInputDate(prev.startDate) !== (data.startDate || "")) ||
            (toInputDate(prev.endDate) !== (data.endDate || "")) ||
            ((prev.notes || "") !== (data.notes || ""))) {
          writes.push(setDoc(doc(db, `students/${sid}/enrollments/${key}`), payload, { merge: true }));
        }
        enrollmentMap[key] = {
          course: data.course,
          courseLabel: data.courseLabel,
          track: data.track,
          trackLabel: data.trackLabel,
          status: data.status,
          startDate: data.startDate,
          endDate: data.endDate,
          notes: data.notes || ""
        };
      }
    });

    const plan = subscriptionPlanInput?.value?.trim() || "";
    const expiry = subscriptionExpiryInput?.value || "";
    const showPlan = !!subscriptionFlagPlan?.checked;
    const showExpiry = !!subscriptionFlagExpiry?.checked;
    const hasSubscription = plan || expiry || showPlan || showExpiry;
    const prevSubscription = state.currentSubscription || {};

    if (hasSubscription) {
      const payload = {
        plan: plan || null,
        expiry: expiry || null,
        showPlan,
        showExpiry,
        updatedAt: serverTimestamp(),
        updatedBy: state.user.uid
      };
      if (!prevSubscription ||
          (prevSubscription.plan || "") !== (plan || "") ||
          (toInputDate(prevSubscription.expiry) !== (expiry || "")) ||
          (!!prevSubscription.showPlan !== showPlan) ||
          (!!prevSubscription.showExpiry !== showExpiry)) {
        writes.push(setDoc(subscriptionRef, payload, { merge: true }));
      }
      state.currentSubscription = {
        plan: plan || null,
        expiry: expiry || null,
        showPlan,
        showExpiry
      };
    } else if (prevSubscription && Object.keys(prevSubscription).length) {
      writes.push(deleteDoc(subscriptionRef));
      state.currentSubscription = null;
    }

    if (writes.length) {
      await Promise.all(writes);
    }

    state.currentAssignment = {
      ...(state.currentAssignment || {}),
      teacherId: normalizedTeacherId,
      rmId: state.user.uid
    };
    state.currentEnrollments = enrollmentMap;

    const teachers = state.teacherDirectory || [];
    populateTeacherSelect(teachers, state.currentAssignment, { primaryTeacherUid: normalizedTeacherId });
    renderEnrollmentChips(state.currentEnrollments);

    setStudentSaveStatus("Changes saved", "success");
    await Promise.all([loadAssignments(), loadStudentsSummaries()]);
  } catch (err) {
    console.error("Failed to save student plan", err);
    setStudentSaveStatus(err?.message ? `Failed to save: ${err.message}` : "Failed to save changes", "error");
  } finally {
    studentSaveBtn?.removeAttribute("disabled");
  }
}

// ========== Communication (Tickets) ==========
const ticketsList       = $("#ticketsList");
const ticketThread      = $("#ticketThread");
const ticketComposer    = $("#ticketComposer");
const ticketMsg         = $("#ticketMsg");
const ticketStatusFilter= $("#ticketStatusFilter");
const btnNewTicket      = $("#btnNewTicket");
const btnAttach         = $("#btnAttach");
const ticketFile        = $("#ticketFile");

ticketStatusFilter?.addEventListener("change", () => loadTicketsInbox());
btnNewTicket?.addEventListener("click", newTicketPrompt);
btnAttach?.addEventListener("click", () => ticketFile?.click());

ticketComposer?.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!state.currentTicketId) return;
  const text = (ticketMsg.value || "").trim();
  if (!text) return;
  const msg = { senderRole: "rm", senderUid: state.user.uid, text, createdAt: serverTimestamp() };
  await addDoc(collection(db, `tickets/${state.currentTicketId}/messages`), msg);
  ticketMsg.value = "";
  await openTicket(state.currentTicketId);
});

async function loadTicketsInbox() {
  const filter = ticketStatusFilter?.value || "open";
  if (ticketsList) ticketsList.innerHTML = `<li>Loading…</li>`;

  let qTickets;
  if (state.role === "admin") {
    qTickets = query(collection(db, "tickets"), orderBy("updatedAt", "desc"), limit(50));
  } else {
    qTickets = query(collection(db, "tickets"), where("rmId", "==", state.user.uid), orderBy("updatedAt", "desc"), limit(50));
  }
  const snap = await getDocs(qTickets);
  const list = [];
  snap.forEach(d => {
    const t = d.data();
    if (filter !== "all" && t.status !== filter) return;
    list.push({ id: d.id, ...t });
  });

  ticketsList.innerHTML = list.map(t => `
    <li data-ticket-id="${t.id}">
      <div><strong>${ellipsize(t.subject || "(no subject)", 52)}</strong></div>
      <div class="meta">
        <span class="badge ${badgeClass(t.status)}">${t.status}</span>
        <span class="badge ${t.priority === "high" ? "high" : ""}">${t.priority || "normal"}</span>
        <span>${t.studentId || "-"}</span>
        <span>${t.updatedAt?.toDate ? formatDate(t.updatedAt.toDate()) : ""}</span>
      </div>
    </li>
  `).join("") || `<li>No tickets.</li>`;

  $$("#ticketsList li").forEach(li => {
    li.addEventListener("click", async () => {
      $$("#ticketsList li").forEach(x => x.classList.remove("active"));
      li.classList.add("active");
      await openTicket(li.dataset.ticketId);
    });
  });

  if (!state.currentTicketId && list.length) {
    ticketsList.querySelector("li[data-ticket-id]")?.click();
  } else if (!list.length) {
    if (ticketThread) ticketThread.innerHTML = `<div class="muted">No tickets.</div>`;
    if (ticketComposer) ticketComposer.hidden = true;
  }
}

function badgeClass(status) {
  if (status === "open") return "open";
  if (status?.startsWith("pending")) return "pending";
  if (status === "resolved" || status === "closed") return "closed";
  return "";
}

async function openTicket(ticketId) {
  state.currentTicketId = ticketId;
  if (ticketComposer) ticketComposer.hidden = false;
  const tdoc = await getDoc(doc(db, "tickets", ticketId));
  const t    = tdoc.data() || {};
  const msnap = await getDocs(query(collection(db, `tickets/${ticketId}/messages`), orderBy("createdAt", "asc")));
  const msgs  = msnap.docs.map(d => ({ id: d.id, ...d.data() }));

  if (ticketThread) {
    ticketThread.innerHTML = `
      <div class="muted" style="margin-bottom:6px">
        Subject: <strong>${ellipsize(t.subject || "(no subject)", 80)}</strong> ·
        Student: ${t.studentId || "-"} ·
        Parent: ${t.parentUid || "-"} ·
        Teacher: ${t.teacherId || "-"}
      </div>
      ${msgs.map(m => renderMsg(m)).join("")}
    `;
    ticketThread.scrollTop = ticketThread.scrollHeight;
  }
}

function renderMsg(m) {
  const role = m.senderRole || "rm";
  const you  = m.senderUid === state.user.uid ? " you" : "";
  return `
    <div class="msg ${role}${you}">
      <div class="who">${role}${you ? " (you)" : ""}</div>
      <div>${(m.text || "").replace(/</g,"&lt;").replace(/>/g,"&gt;")}</div>
      <div class="muted" style="font-size:11px">${m.createdAt?.toDate ? formatDate(m.createdAt.toDate()) : ""}</div>
    </div>
  `;
}

async function newTicketPrompt() {
  const subject = prompt("Ticket subject?"); if (!subject) return;
  const studentId = prompt("Student ID?");   if (!studentId) return;

  const assign = await getDoc(doc(db, `students/${studentId}/links/assignment`));
  const a = assign.data() || {};
  const data = {
    subject, studentId,
    parentUid: a.parentUid || null, teacherId: a.teacherId || null,
    rmId: state.user.uid, status: "open", priority: "normal",
    createdAt: serverTimestamp(), createdBy: state.user.uid, updatedAt: serverTimestamp()
  };
  const tdoc = await addDoc(collection(db, "tickets"), data);
  await loadTicketsInbox();
  await openTicket(tdoc.id);
}

// ========== Wiring helpers ==========
function wireAssignmentsSection() {
  const csvUpload = $("#csvUpload");
  csvUpload?.addEventListener("change", async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    const text = await file.text();
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    let ok = 0, fail = 0;
    for (const line of lines) {
      const [parentUid, studentId, teacherId, status = "active"] = line.split(",").map(s => s.trim());
      if (!parentUid || !studentId || !teacherId) { fail++; continue; }
      try {
        await setDoc(doc(db, `students/${studentId}/links/assignment`), {
          parentUid, teacherId, rmId: state.user.uid, status,
          assignedAt: serverTimestamp(), assignedBy: state.user.uid,
          updatedAt: serverTimestamp(), updatedBy: state.user.uid
        }, { merge: true });
        await setDoc(doc(db, `teachers/${teacherId}/students/${studentId}`), {
          linked: true, rmId: state.user.uid, parentUid, status, updatedAt: serverTimestamp()
        }, { merge: true });
        await setDoc(doc(db, `parents/${parentUid}/children/${studentId}`), {
          linked: true, teacherId, rmId: state.user.uid, status, updatedAt: serverTimestamp()
        }, { merge: true });
        ok++;
      } catch (e) { console.error(e); fail++; }
    }
    alert(`Import done. OK: ${ok}, Failed: ${fail}`);
    await loadAssignments();
  });
}
function wireMonitorSection() { /* already wired */ }
function wireStudentsSection() {
  buildCourseTrackControls();
}
function wireCommSection() { /* placeholder */ }

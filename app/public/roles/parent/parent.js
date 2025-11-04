// --- Imports (same as your original) ---
import { app, auth } from "/shared/firebase-init.js";
import { mountRoleGuard } from "/shared/guard.js";
import { initProfileMenu } from "/shared/profile-menu.js";
import {
  getFunctions, httpsCallable
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-functions.js";
import {
  getFirestore, doc, collection, query, orderBy, limit,
  onSnapshot, getDocs
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import {
  signOut
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

// --- Callables & Firestore ---
const functions = getFunctions(app, "asia-south1");
const listKids = httpsCallable(functions, "parentListKids");
const addKid   = httpsCallable(functions, "parentAddKid");
const db       = getFirestore(app);

// --- DOM refs ---
const kidsSelect   = document.getElementById("kidsSelect");
const addBtn       = document.getElementById("addKidBtn");

const kidNameEl    = document.getElementById("kidName");
const kidAvatarEl  = document.getElementById("kidAvatar");
const welcomeEl    = document.getElementById("welcome");

const statPhonics  = document.getElementById("statPhonics");
const statGrammar  = document.getElementById("statGrammar");
const statSpeaking = document.getElementById("statSpeaking");

const progressList   = document.getElementById("progressList");
const grammarList    = document.getElementById("grammarList");
const speakingList   = document.getElementById("speakingList");
const attendanceList = document.getElementById("attendanceList");
const feesList       = document.getElementById("feesList");
const scheduleList   = document.getElementById("scheduleList");

// --- CSP-safe: hide avatar if its image fails to load (replaces inline onerror) ---
if (kidAvatarEl) {
  kidAvatarEl.addEventListener("error", () => {
    kidAvatarEl.style.display = "none";
  });
}

// --- Charts (will be created/destroyed per kid) ---
let chartPhonics, chartGrammar, chartSpeaking;
let profileMenuHandle = null;

// --- Live listeners cleanup ---
let unsubscribers = [];
function clearListeners() {
  unsubscribers.forEach(fn => { try { fn && fn(); } catch {} });
  unsubscribers = [];
}
function addUnsub(unsub) { if (typeof unsub === "function") unsubscribers.push(unsub); }

// --- Utilities ---
const $li = (text, cls) => {
  const li = document.createElement("li");
  if (cls) li.className = cls;
  li.textContent = text;
  return li;
};
function safeAvg(nums) {
  if (!nums || !nums.length) return null;
  const sum = nums.reduce((a,b)=>a+Number(b||0),0);
  return sum / nums.length;
}
function setQuickStat(el, val, suffix="") {
  el.textContent = (val === null || Number.isNaN(val)) ? "—" : `${Math.round(val)}${suffix}`;
}
function setListLoading(el) {
  el.innerHTML = ""; el.appendChild($li("Loading…","muted"));
}
function setListEmpty(el, msg="No data yet") {
  el.innerHTML = ""; el.appendChild($li(msg,"muted"));
}
function destroyCharts(){
  try { chartPhonics?.destroy(); } catch {}
  try { chartGrammar?.destroy(); } catch {}
  try { chartSpeaking?.destroy(); } catch {}
  chartPhonics = chartGrammar = chartSpeaking = null;
}

// --- Extra safety for charts/canvas ---
function hasChart() {
  return typeof window !== "undefined" && typeof window.Chart !== "undefined";
}
function getCtx(id) {
  const el = document.getElementById(id);
  if (!el || !el.getContext) return null;
  return el.getContext("2d");
}

// --- Renderers (per subcollection) ---
async function attachProgress(parentUid, kidId){
  setListLoading(progressList);

  const col = collection(db, `families/${parentUid}/kids/${kidId}/progress`);
  const q   = query(col, orderBy("updatedAt","desc"), limit(20));
  const unsub = onSnapshot(q, (snap)=>{
    const items = [];
    snap.forEach(d => items.push({ id: d.id, ...d.data() }));

    // List
    progressList.innerHTML = "";
    if (!items.length) {
      setListEmpty(progressList, "No progress yet");
    } else {
      items.forEach(x => progressList.appendChild($li(`${x.title}: ${x.percent ?? 0}%`)));
    }

    // Chart (donut)
    const labels = items.map(x=>x.title);
    const values = items.map(x=>Number(x.percent||0));
    if (labels.length && hasChart()){
      const ctx = getCtx("chartPhonicsLive");
      if (ctx) {
        try { chartPhonics?.destroy(); } catch {}
        chartPhonics = new Chart(ctx, {
          type: "doughnut",
          data: { labels, datasets: [{ data: values }] },
          options: { plugins:{ legend:{ position:"bottom" } }, cutout: "60%" }
        });
      }
    } else {
      try { chartPhonics?.destroy(); } catch {}
    }

    // Quick stat (avg %)
    setQuickStat(statPhonics, safeAvg(values), "%");
  }, ()=> setListEmpty(progressList, "No progress yet"));
  addUnsub(unsub);
}

async function attachGrammar(parentUid, kidId){
  setListLoading(grammarList);

  const col = collection(db, `families/${parentUid}/kids/${kidId}/grammar`);
  const q   = query(col, orderBy("updatedAt","desc"), limit(20));
  const unsub = onSnapshot(q, (snap)=>{
    const items = [];
    snap.forEach(d => items.push({ id: d.id, ...d.data() }));
    // sort for nicer bars
    items.sort((a,b)=>Number(b.score||0)-Number(a.score||0));

    // List
    grammarList.innerHTML = "";
    if (!items.length){
      setListEmpty(grammarList, "No grammar entries");
    } else {
      items.forEach(x => grammarList.appendChild($li(`${x.title}: ${x.score ?? 0}/100`)));
    }

    // Chart (horizontal bar)
    const labels = items.map(x=>x.title);
    const values = items.map(x=>Number(x.score||0));
    if (labels.length && hasChart()){
      const ctx = getCtx("chartGrammarLive");
      if (ctx) {
        try { chartGrammar?.destroy(); } catch {}
        chartGrammar = new Chart(ctx, {
          type: "bar",
          data: { labels, datasets: [{ label: "Score", data: values }] },
          options: {
            indexAxis: "y",
            scales: { x: { suggestedMin: 0, suggestedMax: 100, ticks: { stepSize: 10 } } },
            plugins: { legend: { display: false } }
          }
        });
      }
    } else {
      try { chartGrammar?.destroy(); } catch {}
    }

    // Quick stat
    setQuickStat(statGrammar, safeAvg(values));
  }, ()=> setListEmpty(grammarList, "No grammar entries"));
  addUnsub(unsub);
}

async function attachSpeaking(parentUid, kidId){
  setListLoading(speakingList);

  const col = collection(db, `families/${parentUid}/kids/${kidId}/publicSpeaking`);
  const q   = query(col, orderBy("updatedAt","desc"), limit(20));
  const unsub = onSnapshot(q, (snap)=>{
    const items = [];
    snap.forEach(d => items.push({ id: d.id, ...d.data() }));

    // List
    speakingList.innerHTML = "";
    if (!items.length){
      setListEmpty(speakingList, "No speaking metrics");
    }else{
      items.forEach(x => speakingList.appendChild($li(`${x.title}: ${x.score ?? 0}/10`)));
    }

    // Chart (radar)
    const labels = items.map(x=>x.title);
    const values = items.map(x=>Number(x.score||0));
    if (labels.length && hasChart()){
      const ctx = getCtx("chartSpeakingLive");
      if (ctx) {
        try { chartSpeaking?.destroy(); } catch {}
        chartSpeaking = new Chart(ctx, {
          type: "radar",
          data: { labels, datasets: [{ label: "Confidence", data: values, pointRadius: 3 }] },
          options: {
            scales: { r: { suggestedMin: 0, suggestedMax: 10, ticks: { stepSize: 2 } } },
            plugins: { legend: { display: false } }
          }
        });
      }
    } else {
      try { chartSpeaking?.destroy(); } catch {}
    }

    // Quick stat
    setQuickStat(statSpeaking, safeAvg(values));
  }, ()=> setListEmpty(speakingList, "No speaking metrics"));
  addUnsub(unsub);
}

async function attachAttendance(parentUid, kidId){
  setListLoading(attendanceList);

  const col = collection(db, `families/${parentUid}/kids/${kidId}/attendance`);
  const q   = query(col, orderBy("date","desc"), limit(10));
  const unsub = onSnapshot(q, (snap)=>{
    const items = [];
    snap.forEach(d => items.push({ id: d.id, ...d.data() }));
    attendanceList.innerHTML = "";
    if (!items.length){
      setListEmpty(attendanceList, "No attendance yet");
    } else {
      items.forEach(x=>{
        const state = x.present ? "Present" : "Absent";
        const extra = x.notes ? ` — ${x.notes}` : "";
        attendanceList.appendChild($li(`${x.date}: ${state}${extra}`));
      });
    }
  }, ()=> setListEmpty(attendanceList, "No attendance yet"));
  addUnsub(unsub);
}

async function attachFees(parentUid, kidId){
  setListLoading(feesList);

  const col = collection(db, `families/${parentUid}/kids/${kidId}/fees`);
  const q   = query(col, orderBy("dueDate","asc"), limit(10));
  const unsub = onSnapshot(q, (snap)=>{
    const items = [];
    snap.forEach(d => items.push({ id: d.id, ...d.data() }));
    // show dues first
    items.sort((a,b)=>{
      const aDue = (a.status || "").toLowerCase() !== "paid";
      const bDue = (b.status || "").toLowerCase() !== "paid";
      if (aDue === bDue) return String(a.dueDate||"").localeCompare(String(b.dueDate||""));
      return aDue ? -1 : 1;
    });

    feesList.innerHTML = "";
    if (!items.length){
      setListEmpty(feesList, "No invoices yet");
    } else {
      items.forEach(x=>{
        const status = (x.status || "").toUpperCase();
        feesList.appendChild($li(`Invoice ${x.invoiceId}: ₹${x.amount} — ${status} — Due ${x.dueDate || "-"}`));
      });
    }
  }, ()=> setListEmpty(feesList, "No invoices yet"));
  addUnsub(unsub);
}

async function attachSchedule(parentUid, kidId){
  setListLoading(scheduleList);

  // You can name this subcollection "schedule" or "classes"
  const col = collection(db, `families/${parentUid}/kids/${kidId}/schedule`);
  const q   = query(col, orderBy("startAt","asc"), limit(10));
  const unsub = onSnapshot(q, (snap)=>{
    const items = [];
    snap.forEach(d => items.push({ id: d.id, ...d.data() }));
    scheduleList.innerHTML = "";
    if (!items.length){
      setListEmpty(scheduleList, "No upcoming classes");
    } else {
      items.forEach(x=>{
        const when = x.startAt || x.date || "-";
        const title = x.title || "Class";
        scheduleList.appendChild($li(`${when}: ${title}`));
      });
    }
  }, ()=> setListEmpty(scheduleList, "No upcoming classes"));
  addUnsub(unsub);
}

// --- Kid switch orchestration ---
let currentKidId = null;

async function loadKid(parentUid, kid) {
  currentKidId = kid.id;

  // Header
  if (kidNameEl) kidNameEl.textContent = kid.displayName || "Your Child";
  if (welcomeEl) welcomeEl.textContent = kid.dob ? `DOB: ${kid.dob}` : "Live dashboard";

  if (kidAvatarEl) {
    if (kid.avatarUrl) {
      kidAvatarEl.style.display = "block";   // reset if previously hidden
      kidAvatarEl.src = kid.avatarUrl;
    } else {
      kidAvatarEl.style.display = "none";
      kidAvatarEl.removeAttribute("src");
    }
  }

  // Reset lists and stats
  setQuickStat(statPhonics, null);
  setQuickStat(statGrammar, null);
  setQuickStat(statSpeaking, null);

  if (progressList)   progressList.innerHTML = "";
  if (grammarList)    grammarList.innerHTML = "";
  if (speakingList)   speakingList.innerHTML = "";
  if (attendanceList) attendanceList.innerHTML = "";
  if (feesList)       feesList.innerHTML = "";
  if (scheduleList)   scheduleList.innerHTML = "";

  destroyCharts();
  clearListeners();

  // Attach live listeners
  await Promise.allSettled([
    attachProgress(parentUid, kid.id),
    attachGrammar(parentUid,  kid.id),
    attachSpeaking(parentUid, kid.id),
    attachAttendance(parentUid,kid.id),
    attachFees(parentUid,     kid.id),
    attachSchedule(parentUid, kid.id),
  ]);

  // If user switched while we were loading, prevent stale overwrite
  if (currentKidId !== kid.id) {
    destroyCharts();
    clearListeners();
  }
}

// --- Kids rendering & selection ---
function renderKids(items){
  kidsSelect.innerHTML = "";
  if (!items.length){
    const opt = document.createElement("option");
    opt.textContent = "No kids yet";
    opt.value = "";
    kidsSelect.appendChild(opt);
    kidsSelect.disabled = true;
    return;
  }
  kidsSelect.disabled = false;
  items.forEach(k=>{
    const opt = document.createElement("option");
    opt.value = k.id;
    opt.textContent = k.displayName || k.id;
    kidsSelect.appendChild(opt);
  });
}

async function refreshKidsAndLoadFirst(parentUid){
  const { data } = await listKids({ parentUid });
  const kids = Array.isArray(data) ? data : [];
  renderKids(kids);
  if (kids.length){
    kidsSelect.value = kids[0].id;
    await loadKid(parentUid, kids[0]);
  } else {
    destroyCharts();
    clearListeners();
  }
}

// --- Event wiring ---
kidsSelect?.addEventListener("change", async ()=>{
  const id = kidsSelect.value;
  if (!id) return;
  const parentUid = auth.currentUser?.uid;
  if (!parentUid) return;

  // re-fetch quick list (cheap) and find selected kid
  const { data } = await listKids({ parentUid });
  const kids = Array.isArray(data) ? data : [];
  const kid = kids.find(k => k.id === id);
  if (kid) await loadKid(parentUid, kid);
});

addBtn?.addEventListener("click", async ()=>{
  const name = prompt("Kid name?");
  if (!name) return;
  const parentUid = auth.currentUser?.uid;
  await addKid({ parentUid, displayName: name });
  await refreshKidsAndLoadFirst(parentUid);
});

const handleSignOut = async () => {
  await signOut(auth);
  window.location.assign("/roles/login.html?role=parent&next=%2Froles%2Fparent%2F");
};

// --- Guard & bootstrap ---
mountRoleGuard({
  allow: ["parent","admin"],
  onReady: async ({ user }) => {
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
        roleLabel: "Parent",
        fallbackName: "Parent",
        onSignOut: handleSignOut
      });
    } else {
      profileMenuHandle.updateUser(user, { roleLabel: "Parent", fallbackName: "Parent" });
    }

    if (welcomeEl) welcomeEl.textContent = "Loading your child’s dashboard…";
    await refreshKidsAndLoadFirst(user.uid);
  },
  onBlocked: (reason) => {
    if (reason === "unauthenticated") {
      window.location.assign("/roles/login.html?role=parent&next=%2Froles%2Fparent%2F");
    } else {
      window.location.assign("/parent/");
    }
  }
});

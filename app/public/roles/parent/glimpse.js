// Parent Glimpse — reads sample dashboards and auto-switches to live when role=parent

import { app, auth } from "/shared/firebase-init.js";
import {
  GoogleAuthProvider, signInWithPopup, signOut,
  onAuthStateChanged, getIdTokenResult, onIdTokenChanged
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import {
  getFirestore, collection, getDocs
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

const db = getFirestore(app);

// ---------- tiny helpers ----------
const $ = (q) => document.querySelector(q);
const li = (t, cls) => {
  const x = document.createElement("li");
  if (cls) x.className = cls;
  x.textContent = t;
  return x;
};

// Chart/canvas safety (avoid crashes if CDN not loaded or canvas absent)
function hasChart() {
  return typeof window !== "undefined" && typeof window.Chart !== "undefined";
}
function getCtx(id) {
  const el = document.getElementById(id);
  if (!el || typeof el.getContext !== "function") return null;
  return el.getContext("2d");
}

// ---------- auth box ----------
const provider = new GoogleAuthProvider();
try {
  // shows account chooser
  provider.setCustomParameters({ prompt: "select_account" });
} catch (_) { /* noop */ }

function renderAuthBox(user){
  const box = $("#authBox");
  if (!box) return;
  box.innerHTML = "";

  const btn = document.createElement("button");
  btn.className = "btn";

  if (user){
    const who = document.createElement("span");
    who.textContent = user.email || user.displayName || "Signed in";
    who.style.marginRight = "8px";
    box.appendChild(who);

    btn.textContent = "Sign out";
    btn.addEventListener("click", function () {
      signOut(auth);
    });
  } else {
    btn.textContent = "Continue with Google";
    btn.addEventListener("click", async function () {
      try {
        await signInWithPopup(auth, provider);
        // after sign-in, /parents (rewrite -> /roles/parent/index.html)
        window.location.assign("/parents");
      } catch (err) {
        console.error("Sign-in failed:", err);
        alert("Sign-in failed. Please try again.");
      }
    });
  }
  box.appendChild(btn);
}

async function checkRoleAndMaybeRedirect(user){
  if (!user) return;
  try {
    const token = await getIdTokenResult(user, true);
    const role = token && token.claims ? (token.claims.role || null) : null;
    if (role === "parent") {
      window.location.assign("/parents");
    }
  } catch (e) {
    console.warn("Role check failed:", e);
  }
}

var btnRefresh = document.getElementById("btnRefreshRole");
if (btnRefresh) {
  btnRefresh.addEventListener("click", async function () {
    if (auth.currentUser) await checkRoleAndMaybeRedirect(auth.currentUser);
  });
}

// ---------- Firestore reads ----------
async function readDocs(path){
  // Use single string path to avoid spread (...) for broad compatibility
  const snap = await getDocs(collection(db, path));
  const out = [];
  snap.forEach(function (d) { out.push(Object.assign({ id: d.id }, d.data())); });
  return out;
}

// ---------- sections: phonics / grammar / speaking ----------
async function loadPhonics(){
  const ul = $("#listPhonics");
  if (!ul) return;

  try {
    const items = await readDocs("samples/glimpse/Phonics");
    const labels = items.map(function (x){ return x.title; });
    const values = items.map(function (x){ return Number(x.percent || 0); });

    // Chart
    if (labels.length && hasChart()) {
      const ctx = getCtx("chartPhonics");
      if (ctx) {
        new Chart(ctx, {
          type: "doughnut",
          data: { labels: labels, datasets: [{ data: values }] },
          options: { plugins:{ legend:{ position:"bottom" } }, cutout: "60%" }
        });
      }
    }

    // List
    ul.innerHTML = "";
    if (!items.length) ul.appendChild(li("No sample data yet","muted"));
    items.forEach(function (x){ ul.appendChild(li((x.title || "") + ": " + (x.percent || 0) + "%")); });
  } catch (e) {
    console.error("Phonics load failed:", e);
    ul.innerHTML = "";
    ul.appendChild(li("Failed to load preview","muted"));
  }
}

async function loadGrammar(){
  const ul = $("#listGrammar");
  if (!ul) return;

  try {
    const items = await readDocs("samples/glimpse/Grammar");
    items.sort(function (a,b){ return Number(b.score || 0) - Number(a.score || 0); });
    const labels = items.map(function (x){ return x.title; });
    const values = items.map(function (x){ return Number(x.score || 0); });

    if (labels.length && hasChart()) {
      const ctx = getCtx("chartGrammar");
      if (ctx) {
        new Chart(ctx, {
          type: "bar",
          data: { labels: labels, datasets: [{ label:"Score", data: values }] },
          options: {
            indexAxis: "y",
            scales: { x: { suggestedMin: 0, suggestedMax: 100, ticks: { stepSize: 10 } } },
            plugins: { legend: { display:false } }
          }
        });
      }
    }

    ul.innerHTML = "";
    if (!items.length) ul.appendChild(li("No sample data yet","muted"));
    items.forEach(function (x){ ul.appendChild(li((x.title || "") + ": " + (x.score || 0) + "/100")); });
  } catch (e) {
    console.error("Grammar load failed:", e);
    ul.innerHTML = "";
    ul.appendChild(li("Failed to load preview","muted"));
  }
}

async function loadSpeaking(){
  const ul = $("#listSpeaking");
  if (!ul) return;

  try {
    const items = await readDocs("samples/glimpse/Public Speaking");
    const labels = items.map(function (x){ return x.title; });
    const values = items.map(function (x){ return Number(x.score || 0); });

    if (labels.length && hasChart()) {
      const ctx = getCtx("chartSpeaking");
      if (ctx) {
        new Chart(ctx, {
          type: "radar",
          data: { labels: labels, datasets: [{ label:"Confidence", data: values, pointRadius: 3 }] },
          options: {
            scales: { r: { suggestedMin: 0, suggestedMax: 10, ticks: { stepSize: 2 } } },
            plugins: { legend: { display:false } }
          }
        });
      }
    }

    ul.innerHTML = "";
    if (!items.length) ul.appendChild(li("No sample data yet","muted"));
    items.forEach(function (x){ ul.appendChild(li((x.title || "") + ": " + (x.score || 0) + "/10")); });
  } catch (e) {
    console.error("Speaking load failed:", e);
    ul.innerHTML = "";
    ul.appendChild(li("Failed to load preview","muted"));
  }
}

// ---------- lifecycle ----------
onAuthStateChanged(auth, async function (user){
  renderAuthBox(user);

  // If signed out, show sign-in prompt text
  const lp = $("#listPhonics");
  const lg = $("#listGrammar");
  const ls = $("#listSpeaking");
  if (!user){
    if (lp) { lp.innerHTML = ""; lp.appendChild(li("Sign in to preview","muted")); }
    if (lg) { lg.innerHTML = ""; lg.appendChild(li("Sign in to preview","muted")); }
    if (ls) { ls.innerHTML = ""; ls.appendChild(li("Sign in to preview","muted")); }
    return;
  }

  try {
    await Promise.all([loadPhonics(), loadGrammar(), loadSpeaking()]);
  } catch (_) { /* swallow */ }

  await checkRoleAndMaybeRedirect(user);
});

onIdTokenChanged(auth, async function (user){
  if (user) await checkRoleAndMaybeRedirect(user);
});

// (Optional) explicit export to ensure module context in some bundlers
export {};

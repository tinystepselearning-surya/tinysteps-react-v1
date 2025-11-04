import { app, auth } from "/shared/firebase-init.js";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  getIdTokenResult,
  sendPasswordResetEmail,
  signOut
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-functions.js";

const functions = getFunctions(app, "asia-south1");

const ROLE_INFO = {
  parent: {
    label: "Parent",
    path: "/roles/parent/",
    help: "Parents can use the email/username shared with Tiny Steps to view their child’s progress."
  },
  teacher: {
    label: "Teacher",
    path: "/roles/teacher/",
    help: "Teachers, sign in with the credentials shared by the Tiny Steps admin team."
  },
  rm: {
    label: "Relationship Manager",
    path: "/roles/rm/",
    help: "Relationship Managers can access assignments and communications from this portal."
  },
  kid: {
    label: "Kid",
    path: "/roles/kid/",
    help: "Need help logging in? Ask your parent or teacher to sign you in."
  }
};

const allowedNextPrefixes = [
  "/roles/parent",
  "/roles/teacher",
  "/roles/rm",
  "/roles/kid",
  "/parents",
  "/admin"
];

const url = new URL(window.location.href);
const rawRole = (url.searchParams.get("role") || "").toLowerCase();
const desiredRole = ROLE_INFO[rawRole] ? rawRole : "parent";
const roleInfo = ROLE_INFO[desiredRole];

document.body.dataset.role = desiredRole;
document.title = `Tiny Steps — ${roleInfo.label} Login`;

const loginForm = document.getElementById("loginForm");
const userIdInput = document.getElementById("userId");
const passwordInput = document.getElementById("password");
const submitBtn = document.getElementById("submitBtn");
const resetBtn = document.getElementById("resetBtn");
const statusEl = document.getElementById("status");
const rolePill = document.getElementById("rolePill");
const pageTitle = document.getElementById("pageTitle");
const pageLead = document.getElementById("pageLead");
const nextPathEl = document.getElementById("nextPath");
const helpMessageEl = document.getElementById("helpMessage");

if (rolePill) rolePill.textContent = `${roleInfo.label} portal`;
if (pageTitle) pageTitle.textContent = `Sign in as ${roleInfo.label}`;
if (pageLead) pageLead.textContent = `Enter your User ID and password to open the ${roleInfo.label} dashboard.`;
if (helpMessageEl) helpMessageEl.textContent = roleInfo.help;

const nextPath = sanitizeNext(url.searchParams.get("next")) || roleInfo.path;
if (nextPathEl) nextPathEl.textContent = nextPath;

updateRoleSwitcher();

function updateRoleSwitcher() {
  document.querySelectorAll("[data-role-link]").forEach((link) => {
    const roleKey = link.getAttribute("data-role-link");
    if (!roleKey || !ROLE_INFO[roleKey]) return;
    const params = new URLSearchParams({ role: roleKey, next: ROLE_INFO[roleKey].path });
    link.href = `/roles/login.html?${params.toString()}`;
    link.setAttribute("data-current", String(roleKey === desiredRole));
  });
}

function sanitizeNext(raw) {
  if (!raw) return null;
  const val = String(raw).trim();
  if (!val.startsWith("/") || val.startsWith("//")) return null;
  for (const prefix of allowedNextPrefixes) {
    if (val === prefix || val.startsWith(prefix + "/") || val.startsWith(prefix + "?")) {
      return val;
    }
  }
  return null;
}

function resolveRoleLabel(role) {
  if (!role) return "Unknown";
  return ROLE_INFO[role]?.label || role.charAt(0).toUpperCase() + role.slice(1);
}

function setStatus(message, type = "info") {
  if (!statusEl) return;
  statusEl.textContent = message || "";
  statusEl.dataset.type = type;
}

function setBusy(isBusy) {
  if (submitBtn) {
    submitBtn.disabled = isBusy;
    submitBtn.dataset.label ??= submitBtn.textContent || "Sign in";
    submitBtn.textContent = isBusy ? "Signing in…" : submitBtn.dataset.label;
  }
  if (resetBtn) resetBtn.disabled = isBusy;
  if (userIdInput) userIdInput.disabled = isBusy;
  if (passwordInput) passwordInput.disabled = isBusy;
}

function normalizeAuthError(err) {
  const code = err?.code || "";
  if (code.includes("auth/wrong-password")) return "Incorrect password. Try again.";
  if (code.includes("auth/user-not-found")) return "We couldn’t find that account.";
  if (code.includes("auth/too-many-requests")) return "Too many attempts. Please wait and try again.";
  if (code.includes("invalid-argument")) return "Enter a valid User ID.";
  return err?.message || "Sign-in failed. Please try again.";
}

async function resolveIdentifier(identifier) {
  const id = String(identifier || "").trim();
  if (!id) throw new Error("Enter your User ID or email.");
  if (id.includes("@")) return id;
  const callable = httpsCallable(functions, "resolveUsername");
  const { data } = await callable({ identifier: id });
  const email = data?.email;
  if (!email) throw new Error("Account not found.");
  return String(email);
}

function hasRoleAccess(roleClaim) {
  if (!roleClaim) return false;
  if (roleClaim === desiredRole) return true;
  if (roleClaim === "admin") return true;
  return false;
}

function mismatchMessage(roleClaim) {
  const label = resolveRoleLabel(roleClaim);
  return `This account is set up for the ${label} portal. Please use a ${roleInfo.label} login.`;
}

function goToNext() {
  window.location.replace(nextPath);
}

let pendingNotice = null;

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    if (pendingNotice) {
      setStatus(pendingNotice.message, pendingNotice.type);
      pendingNotice = null;
    }
    setBusy(false);
    return;
  }

  try {
    const token = await getIdTokenResult(user, true);
    const roleClaim = token.claims?.role || null;
    if (hasRoleAccess(roleClaim)) {
      setStatus("Success! Redirecting…", "success");
      goToNext();
      return;
    }
    pendingNotice = { message: mismatchMessage(roleClaim), type: "error" };
    await signOut(auth);
  } catch (err) {
    pendingNotice = { message: normalizeAuthError(err), type: "error" };
    await signOut(auth);
  }
});

loginForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const identifier = userIdInput?.value || "";
  const password = passwordInput?.value || "";

  if (!identifier.trim()) {
    setStatus("Enter your User ID or email.", "error");
    userIdInput?.focus();
    return;
  }
  if (!password) {
    setStatus("Enter your password.", "error");
    passwordInput?.focus();
    return;
  }

  try {
    setBusy(true);
    setStatus("Signing in…");
    const email = await resolveIdentifier(identifier);
    await signInWithEmailAndPassword(auth, email, password);
    const token = await getIdTokenResult(auth.currentUser, true);
    const roleClaim = token.claims?.role || null;
    if (hasRoleAccess(roleClaim)) {
      setStatus("Success! Redirecting…", "success");
      goToNext();
    } else {
      pendingNotice = { message: mismatchMessage(roleClaim), type: "error" };
      await signOut(auth);
    }
  } catch (err) {
    setStatus(normalizeAuthError(err), "error");
  } finally {
    setBusy(false);
  }
});

resetBtn?.addEventListener("click", async () => {
  try {
    resetBtn.disabled = true;
    setStatus("Sending password reset email…");
    const email = await resolveIdentifier(userIdInput?.value || "");
    await sendPasswordResetEmail(auth, email);
    setStatus(`Password reset email sent to ${email}.`, "success");
  } catch (err) {
    setStatus(normalizeAuthError(err), "error");
  } finally {
    resetBtn.disabled = false;
  }
});

if (userIdInput && !userIdInput.value) {
  userIdInput.focus({ preventScroll: true });
}

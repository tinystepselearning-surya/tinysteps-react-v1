import { auth } from "/shared/firebase-init.js";
import { signOut } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { mountRoleGuard } from "/shared/guard.js";
import { initProfileMenu } from "/shared/profile-menu.js";

const $ = (s, r=document)=>r.querySelector(s);

let profileMenuHandle = null;

const handleSignOut = async () => {
  await signOut(auth);
  location.href = "/roles/login.html?role=kid&next=%2Froles%2Fkid%2F";
};

const welcome = $('#welcome');
const gamesList = $('#gamesList');
const badge = $('#badge');

function setList(el, items){ el.textContent=""; items.forEach(x=>{ const li=document.createElement('li'); li.textContent=x; el.appendChild(li);}); if(!items.length) el.textContent="Nothing yet."; }

mountRoleGuard({
  allow: ["kid", "admin"],
  onReady: ({ user, role }) => {
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
        roleLabel: role === "admin" ? "Admin" : "Kid",
        fallbackName: role === "admin" ? "Admin" : "Kid",
        onSignOut: handleSignOut
      });
    } else {
      profileMenuHandle.updateUser(user, { roleLabel: role === "admin" ? "Admin" : "Kid", fallbackName: role === "admin" ? "Admin" : "Kid" });
    }

    welcome.textContent = `Welcome ${user.displayName || user.email} (${role})`;
    setList(gamesList, ["Balloon Pop 🎈", "Treasure Hunt 🏴‍☠️", "Sound Match 🎧"]);
    badge.textContent = "Sunshine Starter ☀️";
  },
  onBlocked: () => {
    location.href = "/roles/login.html?role=kid&next=%2Froles%2Fkid%2F";
  }
});


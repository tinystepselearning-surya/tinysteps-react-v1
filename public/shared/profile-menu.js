const $ = (sel, root = document) => root.querySelector(sel);

function textInitials(displayName = "") {
  const trimmed = displayName.trim();
  if (!trimmed) return "T";
  const parts = trimmed.split(/\s+/).slice(0, 2);
  return parts.map(part => part.charAt(0).toUpperCase()).join("") || trimmed.charAt(0).toUpperCase();
}

export function initProfileMenu({
  menuSelector,
  triggerSelector,
  dropdownSelector,
  avatarSelector,
  nameSelector,
  displaySelector,
  emailSelector,
  roleSelector,
  signOutSelector,
  user = null,
  onSignOut,
  roleLabel,
  fallbackName,
  fallbackEmail
} = {}) {
  const menu = typeof menuSelector === "string" ? $(menuSelector) : menuSelector;
  const trigger = typeof triggerSelector === "string" ? $(triggerSelector) : triggerSelector;
  const dropdown = typeof dropdownSelector === "string" ? $(dropdownSelector) : dropdownSelector;
  const avatar = typeof avatarSelector === "string" ? $(avatarSelector) : avatarSelector;
  const nameEl = typeof nameSelector === "string" ? $(nameSelector) : nameSelector;
  const displayEl = typeof displaySelector === "string" ? $(displaySelector) : displaySelector;
  const emailEl = typeof emailSelector === "string" ? $(emailSelector) : emailSelector;
  const roleEl = typeof roleSelector === "string" ? $(roleSelector) : roleSelector;
  const signOutBtn = typeof signOutSelector === "string" ? $(signOutSelector) : signOutSelector;

  if (!menu || !trigger || !dropdown) {
    console.warn("Profile menu missing required elements");
    return {
      updateUser: () => {},
      destroy: () => {}
    };
  }

  let meta = { roleLabel, fallbackName, fallbackEmail };
  let currentUser = null;
  let isOpen = false;

  function setOpen(open) {
    isOpen = Boolean(open);
    menu.dataset.open = isOpen ? "true" : "false";
    trigger.setAttribute("aria-expanded", isOpen ? "true" : "false");
    dropdown.hidden = !isOpen;
  }

  function toggleOpen() {
    setOpen(!isOpen);
  }

  function closeOnOutside(event) {
    if (!menu.contains(event.target)) {
      setOpen(false);
    }
  }

  function onKeydown(event) {
    if (event.key === "Escape" && isOpen) {
      setOpen(false);
      trigger.focus();
    }
  }

  trigger.addEventListener("click", (event) => {
    event.preventDefault();
    toggleOpen();
  });

  document.addEventListener("click", closeOnOutside);
  document.addEventListener("keydown", onKeydown);

  if (signOutBtn && typeof onSignOut === "function") {
    signOutBtn.addEventListener("click", async (event) => {
      event.preventDefault();
      try {
        await onSignOut();
      } finally {
        setOpen(false);
      }
    });
  }

  function applyUser(u, extraMeta = {}) {
    currentUser = u || null;
    meta = { ...meta, ...extraMeta };

    const display = currentUser?.displayName?.trim() || meta.fallbackName || (currentUser?.email ? currentUser.email.split("@")[0] : "");
    const email = currentUser?.email || meta.fallbackEmail || "";
    const roleText = meta.roleLabel || "";

    const safeName = display || "My profile";
    if (nameEl) {
      nameEl.textContent = safeName;
    }
    if (displayEl) {
      displayEl.textContent = safeName;
    }
    if (trigger) {
      trigger.setAttribute("aria-label", `Profile menu for ${safeName}`);
    }
    if (avatar) {
      avatar.textContent = textInitials(display || email || "T");
    }
    if (emailEl) {
      emailEl.textContent = email;
      emailEl.style.display = email ? "block" : "none";
    }
    if (roleEl) {
      if (roleText) {
        roleEl.textContent = roleText;
        roleEl.style.display = "block";
      } else {
        roleEl.style.display = "none";
      }
    }
  }

  setOpen(false);
  applyUser(user);

  return {
    updateUser(nextUser, extraMeta = {}) {
      applyUser(nextUser, extraMeta);
    },
    destroy() {
      document.removeEventListener("click", closeOnOutside);
      document.removeEventListener("keydown", onKeydown);
    }
  };
}

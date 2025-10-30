(function () {
  "use strict";

  const COPY_DURATION = 2000;

  function handleCopy(event) {
    const trigger = event.currentTarget;
    const targetSelector = trigger.getAttribute("data-copy");
    if (!targetSelector) {
      return;
    }

    const target = document.querySelector(targetSelector);
    if (!target) {
      console.warn(`Copy target not found for selector: ${targetSelector}`);
      return;
    }

    const textToCopy = target.textContent.trim();
    if (!textToCopy) {
      return;
    }

    navigator.clipboard
      .writeText(textToCopy)
      .then(() => {
        indicateCopied(trigger);
      })
      .catch((error) => {
        console.error("Unable to copy text", error);
      });
  }

  function indicateCopied(button) {
    button.dataset.state = "copied";
    const originalText = button.textContent;
    button.textContent = "Copied!";

    window.setTimeout(() => {
      button.textContent = originalText;
      delete button.dataset.state;
    }, COPY_DURATION);
  }

  function initCopyButtons() {
    const copyButtons = document.querySelectorAll("button[data-copy]");
    copyButtons.forEach((button) => {
      button.addEventListener("click", handleCopy);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initCopyButtons);
  } else {
    initCopyButtons();
  }
})();

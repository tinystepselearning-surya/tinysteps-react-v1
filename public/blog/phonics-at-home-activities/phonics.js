(function () {
  "use strict";

  const COPY_DURATION = 2200;

  function removeNoJsClass() {
    document.documentElement.classList.remove("no-js");
  }

  function handleCopy(event) {
    const trigger = event.currentTarget;
    const selector = trigger.getAttribute("data-copy");
    if (!selector) {
      return;
    }

    const target = document.querySelector(selector);
    if (!target) {
      console.warn("Copy target not found", selector);
      return;
    }

    const text = target.textContent.trim();
    if (!text) {
      return;
    }

    navigator.clipboard
      .writeText(text)
      .then(() => indicateCopied(trigger))
      .catch((error) => {
        console.error("Unable to copy text", error);
      });
  }

  function indicateCopied(button) {
    const originalText = button.textContent;
    button.dataset.state = "copied";
    button.textContent = "Copied!";

    window.setTimeout(() => {
      button.textContent = originalText;
      delete button.dataset.state;
    }, COPY_DURATION);
  }

  function initCopyButtons() {
    const buttons = document.querySelectorAll("[data-copy]");
    buttons.forEach((button) => {
      button.addEventListener("click", handleCopy);
    });
  }

  function toggleFaq(button, answer, item) {
    const expanded = button.getAttribute("aria-expanded") === "true";
    const nextState = !expanded;
    button.setAttribute("aria-expanded", String(nextState));
    item.classList.toggle("is-open", nextState);

    if (nextState) {
      answer.hidden = false;
    } else {
      answer.hidden = true;
    }
  }

  function initFaq() {
    const faqItems = document.querySelectorAll(".faq-item");
    faqItems.forEach((item) => {
      const button = item.querySelector(".faq-question");
      const answer = item.querySelector(".faq-answer");
      if (!button || !answer) {
        return;
      }

      button.addEventListener("click", () => toggleFaq(button, answer, item));
    });
  }

  function init() {
    removeNoJsClass();
    initCopyButtons();
    initFaq();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

// Path: /public/blog/blog-cards.js
(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return;

  const cards = document.querySelectorAll('.blog-card');
  const clamp = (n, min, max) => Math.max(min, Math.min(n, max));

  window.addEventListener('mousemove', (e) => {
    const { innerWidth: w, innerHeight: h } = window;
    const tiltX = ((e.clientY / h) - 0.5) * -2; // -1..1
    const tiltY = ((e.clientX / w) - 0.5) *  2; // -1..1
    cards.forEach(card => {
      card.style.setProperty('--tx', clamp(tiltY*2, -2, 2) + 'px');
      card.style.setProperty('--ty', clamp(tiltX*2, -2, 2) + 'px');
      card.style.transform = `translateY(-2px) translate(var(--tx,0), var(--ty,0))`;
    });
  }, { passive: true });

  // reset on leave
  window.addEventListener('mouseleave', () => {
    cards.forEach(card => { card.style.transform = ''; });
  });
})();

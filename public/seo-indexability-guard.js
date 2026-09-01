(() => {
  const host = window.location.hostname.toLowerCase();
  const isProductionHost =
    host === 'tinystepslearning.com' || host === 'www.tinystepslearning.com';

  // Build/prerender previews must remain free to change robots metadata while rendering.
  if (!isProductionHost) return;

  const META_NAMES = ['robots', 'googlebot', 'bingbot'];
  const LOCK_MS = 15000;
  let baseline = null;
  let enforcing = false;

  const readSingleMeta = (name) => {
    const nodes = Array.from(document.head.querySelectorAll(`meta[name="${name}"]`));
    if (nodes.length !== 1) return null;
    const content = (nodes[0].getAttribute('content') || '').trim();
    return content ? { node: nodes[0], content } : null;
  };

  const captureBaseline = () => {
    const entries = META_NAMES.map((name) => [name, readSingleMeta(name)]);
    if (entries.some(([, value]) => !value)) return false;

    baseline = Object.fromEntries(
      entries.map(([name, value]) => [name, value.content]),
    );
    return true;
  };

  const enforceBaseline = () => {
    if (!baseline || enforcing) return;
    enforcing = true;

    try {
      for (const name of META_NAMES) {
        const nodes = Array.from(document.head.querySelectorAll(`meta[name="${name}"]`));
        let target = nodes[0] || null;

        if (!target) {
          target = document.createElement('meta');
          target.setAttribute('name', name);
          document.head.appendChild(target);
        }

        if (target.getAttribute('content') !== baseline[name]) {
          target.setAttribute('content', baseline[name]);
        }

        for (const duplicate of nodes.slice(1)) duplicate.remove();
      }
    } finally {
      enforcing = false;
    }
  };

  // The prerendered robots tags are server-sent and therefore the authority for
  // the initial crawl. Preserve them while the SPA hydrates so a transient route,
  // lazy boundary, error boundary, or stale effect cannot flip crawl intent.
  const observer = new MutationObserver(() => {
    if (!baseline) {
      if (captureBaseline()) enforceBaseline();
      return;
    }
    enforceBaseline();
  });

  observer.observe(document.head, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['name', 'content'],
  });

  if (captureBaseline()) enforceBaseline();

  window.setTimeout(() => {
    enforceBaseline();
    observer.disconnect();
  }, LOCK_MS);
})();

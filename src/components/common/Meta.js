// Lightweight meta + JSON-LD injector without extra deps
import { useEffect } from 'react';
const setTag = (name, content) => {
    if (!content)
        return;
    let el = document.querySelector(`meta[name="${name}"]`);
    if (!el) {
        el = document.createElement('meta');
        el.setAttribute('name', name);
        document.head.appendChild(el);
    }
    el.setAttribute('content', content);
};
const Meta = ({ title, description, keywords, canonical, jsonLd }) => {
    useEffect(() => {
        if (title)
            document.title = title;
        setTag('description', description);
        setTag('keywords', keywords);
        if (canonical) {
            let link = document.querySelector('link[rel="canonical"]');
            if (!link) {
                link = document.createElement('link');
                link.setAttribute('rel', 'canonical');
                document.head.appendChild(link);
            }
            link.setAttribute('href', canonical);
        }
        // JSON-LD
        const existing = Array.from(document.querySelectorAll('script[data-meta-jsonld="true"]'));
        existing.forEach((n) => { var _a; return (_a = n.parentElement) === null || _a === void 0 ? void 0 : _a.removeChild(n); });
        const blocks = Array.isArray(jsonLd) ? jsonLd : jsonLd ? [jsonLd] : [];
        for (const block of blocks) {
            const script = document.createElement('script');
            script.type = 'application/ld+json';
            script.setAttribute('data-meta-jsonld', 'true');
            script.text = JSON.stringify(block);
            document.head.appendChild(script);
        }
    }, [title, description, keywords, canonical, jsonLd]);
    return null;
};
export default Meta;

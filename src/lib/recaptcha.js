const siteKey = import.meta.env.VITE_APPCHECK_KEY ?? "";
/**
 * Executes reCAPTCHA Enterprise for the provided action.
 * Returns the token or null when the widget is unavailable.
 */
export async function executeRecaptcha(action) {
    if (!siteKey) {
        console.warn("GreCAPTCHA site key missing. Set VITE_APPCHECK_KEY.");
        return null;
    }
    if (typeof window === "undefined" || !window.grecaptcha?.enterprise) {
        console.warn("grecaptcha.enterprise is not available on window.");
        return null;
    }
    return new Promise((resolve) => {
        window.grecaptcha.enterprise.ready(async () => {
            try {
                const token = await window.grecaptcha.enterprise.execute(siteKey, { action });
                resolve(token);
            }
            catch (error) {
                console.error("reCAPTCHA execution failed", error);
                resolve(null);
            }
        });
    });
}
//# sourceMappingURL=recaptcha.js.map
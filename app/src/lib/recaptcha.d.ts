declare global {
    interface Window {
        grecaptcha?: {
            enterprise?: {
                ready(callback: () => void): void;
                execute(siteKey: string, options: {
                    action: string;
                }): Promise<string>;
            };
        };
    }
}
/**
 * Executes reCAPTCHA Enterprise for the provided action.
 * Returns the token or null when the widget is unavailable.
 */
export declare function executeRecaptcha(action: string): Promise<string | null>;
//# sourceMappingURL=recaptcha.d.ts.map
interface ImportMetaEnv {
  readonly DEV?: boolean;
  readonly VITE_USE_FIREBASE_EMULATORS?: string;
  readonly VITE_SENTRY_DSN?: string;
  readonly VITE_APP_VERSION?: string;
  readonly PROD?: boolean;
  readonly MODE?: string;
  // add other VITE env keys used across the repo as optional strings
  readonly [key: string]: string | boolean | undefined;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

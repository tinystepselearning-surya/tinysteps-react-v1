// public/shared/firebase-init.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { initializeAppCheck, ReCaptchaV3Provider } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app-check.js";

export const firebaseConfig = {
  apiKey: "AIzaSyBxLOnu1Se8w8bDzh4LytpFN6JLUh1CCTs",
  authDomain: "tinystepselearning-surya.firebaseapp.com",
  projectId: "tinystepselearning-surya",
  storageBucket: "tinystepselearning-surya.appspot.com",
  messagingSenderId: "449171623883",
  appId: "1:449171623883:web:2876854df8ec3f78b3704e"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// App Check (reCAPTCHA v3) – same site key you used on admin
initializeAppCheck(app, {
  provider: new ReCaptchaV3Provider("6LdTsPMrAAAAAP42m-LXFw80Jz4Ip8ut2Ta_TBwc"),
  isTokenAutoRefreshEnabled: true
});


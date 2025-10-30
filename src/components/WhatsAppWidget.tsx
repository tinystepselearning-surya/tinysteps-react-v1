import { useEffect, useState } from "react";

export default function WhatsAppWidget() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const dismissed = sessionStorage.getItem("waDismissed");
    if (!dismissed) {
      const t = setTimeout(() => setOpen(true), 3000);
      return () => clearTimeout(t);
    }
  }, []);

  return (
    <div className="fixed right-4 bottom-4 z-[70] flex flex-col items-end">
      {open && (
        <div className="mb-2 w-[min(86vw,320px)] rounded-xl bg-white shadow-xl border p-3">
          <button
            className="absolute right-2 top-1 text-gray-500 text-xl"
            aria-label="Close"
            onClick={() => {
              setOpen(false);
              sessionStorage.setItem("waDismissed", "1");
            }}
          >
            &times;
          </button>
          <p className="text-sm">
            <strong>👋 Welcome to TinySteps!</strong><br />
            Need help choosing a course or booking a free trial? We reply fastest on WhatsApp (9am–9pm).
          </p>
          <a
            href="https://wa.me/919666095553"
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-flex w-full justify-center rounded-xl px-3 py-2 font-extrabold text-white"
            style={{ backgroundImage: "linear-gradient(135deg,#25D366,#128C7E)" }}
          >
            Chat on WhatsApp
          </a>
        </div>
      )}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Open WhatsApp Chat"
        className="h-14 w-14 rounded-full shadow-xl text-white text-xl"
        style={{ backgroundImage: "linear-gradient(135deg,#25D366,#128C7E)" }}
      >
        💬
      </button>
    </div>
  );
}

export default function WhatsAppCard() {
  return (
    <aside className="fixed right-4 bottom-4 z-40">
      <div className="rounded-2xl shadow-lg border border-gray-100 bg-white p-4 w-[320px]">
        <p className="text-sm font-medium">👋 Welcome to TinySteps!</p>
        <p className="text-sm text-gray-600 mt-1">
          Need help choosing a course or booking a free trial? We reply fastest
          on WhatsApp (9am–9pm).
        </p>
        <a
          target="_blank"
          rel="noreferrer"
          href="https://wa.me/919666095553"
          className="mt-3 inline-flex items-center justify-center rounded-xl px-4 py-2 text-white w-full"
          style={{ backgroundImage: "linear-gradient(90deg,#25D366,#128C7E)" }}
        >
          Chat on WhatsApp
        </a>
      </div>
    </aside>
  );
}

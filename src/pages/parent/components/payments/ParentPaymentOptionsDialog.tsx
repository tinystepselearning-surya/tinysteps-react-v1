import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import type { ParentWalletDisplayState } from "./parentPaymentsPresentation";

type ParentPaymentOptionsDialogProps = {
  open: boolean;
  walletState: ParentWalletDisplayState;
  method: "UPI" | "Bank Transfer";
  amountInput: string;
  qrImagePath: string;
  qrImageLoadFailed: boolean;
  onOpenChange: (open: boolean) => void;
  onMethodChange: (method: "UPI" | "Bank Transfer") => void;
  onAmountInputChange: (value: string) => void;
  onQrImageError: () => void;
  onOpenWhatsAppVerification: () => void;
};

export default function ParentPaymentOptionsDialog({
  open,
  walletState,
  method,
  amountInput,
  qrImagePath,
  qrImageLoadFailed,
  onOpenChange,
  onMethodChange,
  onAmountInputChange,
  onQrImageError,
  onOpenWhatsAppVerification,
}: ParentPaymentOptionsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] max-w-md overflow-y-auto rounded-t-[24px] [-webkit-overflow-scrolling:touch] sm:rounded-[20px]">
        <DialogHeader>
          <DialogTitle>Payment options</DialogTitle>
          <DialogDescription>
            Payment happens outside the Tiny Steps app and is recorded after verification.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pb-[max(0px,env(safe-area-inset-bottom))]">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-200">
            <p className="font-semibold">{walletState.label}</p>
            {walletState.amountText ? <p className="mt-1 text-lg font-semibold">{walletState.amountText}</p> : null}
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{walletState.description}</p>
          </div>

          <fieldset>
            <legend className="text-sm font-medium text-slate-700 dark:text-slate-200">Payment method</legend>
            <div role="radiogroup" aria-label="Payment method" className="mt-2 grid grid-cols-2 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
              {(["UPI", "Bank Transfer"] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  role="radio"
                  aria-checked={method === option}
                  onClick={() => onMethodChange(option)}
                  className="min-h-11 rounded-lg px-3 text-sm font-semibold text-slate-600 outline-none focus-visible:ring-2 focus-visible:ring-slate-600 aria-checked:bg-white aria-checked:text-slate-950 aria-checked:shadow-sm dark:text-slate-300 dark:aria-checked:bg-slate-900 dark:aria-checked:text-slate-100"
                >
                  {option}
                </button>
              ))}
            </div>
          </fieldset>

          {method === "UPI" ? (
            !qrImageLoadFailed ? (
              <div className="flex flex-col items-center space-y-3">
                <img
                  src={qrImagePath}
                  alt="Tiny Steps UPI payment QR code"
                  className="h-auto max-h-[48vh] w-full max-w-64 rounded-xl border border-slate-200 object-contain dark:border-slate-700"
                  onError={onQrImageError}
                />
                <p className="select-text text-center text-sm leading-5 text-slate-600 dark:text-slate-300">
                  Scan with a UPI app. Opening or scanning this code does not confirm payment in Tiny Steps.
                </p>
              </div>
            ) : (
              <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/20 dark:text-red-200">
                The UPI QR code is unavailable. Use the bank-transfer details or contact Tiny Steps for help.
              </div>
            )
          ) : (
            <section aria-labelledby="parent-bank-transfer-title" className="rounded-xl border border-slate-200 bg-white p-3 text-sm dark:border-slate-700 dark:bg-slate-900/60">
              <h3 id="parent-bank-transfer-title" className="font-semibold text-slate-900 dark:text-slate-100">
                Bank transfer details
              </h3>
              <dl className="mt-3 select-text space-y-2 text-slate-700 dark:text-slate-200">
                <div><dt className="inline font-medium">Account type:</dt> <dd className="inline">Current</dd></div>
                <div><dt className="inline font-medium">Account number:</dt> <dd className="inline">50200108987663</dd></div>
                <div><dt className="inline font-medium">Bank:</dt> <dd className="inline">HDFC</dd></div>
                <div><dt className="inline font-medium">IFSC:</dt> <dd className="inline">HDFC0002352</dd></div>
                <div><dt className="inline font-medium">Account name:</dt> <dd className="inline">TINY STEPS</dd></div>
                <div><dt className="inline font-medium">UPI ID:</dt> <dd className="inline">tinystepslearning@ybl</dd></div>
              </dl>
            </section>
          )}

          <div className="space-y-1">
            <label htmlFor="parent-payment-amount" className="text-sm font-medium text-slate-700 dark:text-slate-200">
              Amount paid (optional)
            </label>
            <input
              id="parent-payment-amount"
              type="number"
              inputMode="numeric"
              min="0"
              step="1"
              value={amountInput}
              onChange={(event) => onAmountInputChange(event.target.value)}
              placeholder="Enter amount paid"
              className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus-visible:ring-2 focus-visible:ring-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
          </div>

          <p className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm leading-5 text-slate-600 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-300">
            Send the payment details on WhatsApp for verification. Opening WhatsApp does not confirm or record a payment.
          </p>

          <Button type="button" onClick={onOpenWhatsAppVerification} className="min-h-11 w-full bg-slate-950 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-950">
            Send details for verification
          </Button>
          <Button type="button" onClick={() => onOpenChange(false)} variant="outline" className="min-h-11 w-full">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

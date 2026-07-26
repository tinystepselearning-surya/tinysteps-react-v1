import { fireEvent, render, screen, within } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";

import ParentPaymentOptionsDialog from "../../../pages/parent/components/payments/ParentPaymentOptionsDialog";
import ParentPaymentsView from "../../../pages/parent/components/payments/ParentPaymentsView";
import ParentProfilePaymentsPanel from "../../../pages/parent/components/payments/ParentProfilePaymentsPanel";
import {
  filterParentClassCharges,
  formatParentPaymentMonth,
  getParentWalletDisplayState,
  resolveVerifiedParentRate,
  type ParentClassChargeDisplay,
} from "../../../pages/parent/components/payments/parentPaymentsPresentation";

const chargeRows: ParentClassChargeDisplay[] = [
  {
    id: "charge-unsettled",
    date: new Date("2026-07-10T10:00:00.000Z"),
    childName: "Asha",
    courseName: "Phonics Foundation",
    amount: 600,
    paidAmount: 200,
    unsettledAmount: 400,
    status: "unsettled",
    note: "Class deduction",
  },
  {
    id: "charge-settled",
    date: new Date("2026-07-04T10:00:00.000Z"),
    childName: "Asha",
    courseName: "Phonics Foundation",
    amount: 600,
    paidAmount: 600,
    unsettledAmount: 0,
    status: "settled",
  },
];

const commonProps = {
  isNativeIOSApp: false,
  childName: "Asha",
  walletState: getParentWalletDisplayState({ balance: -1200 }),
  walletLastUpdatedLabel: "26/07/2026, 10:30:00",
  paymentOptionsAvailable: true,
  paymentAssistanceText: "Contact support for billing assistance.",
  selectedMonth: "2026-07",
  summary: {
    classDeductions: 1200,
    paymentsRecorded: 600,
    billedClassCount: 2,
    settledClassCount: 1,
    unsettledClassCount: 1,
  },
  summaryLoading: false,
  activityLoading: false,
  activityError: false,
  activityMode: "charges" as const,
  chargeFilter: "all_classes" as const,
  chargeRows,
  chargeCounts: { all: 2, unsettled: 1, settled: 1 },
  paymentRows: [
    {
      id: "payment-1",
      date: new Date("2026-07-12T10:00:00.000Z"),
      amount: 600,
      method: "UPI",
      status: "received",
      reference: "reference-that-remains-selectable",
    },
  ],
  membership: {
    active: true,
    enrollmentDateLabel: "01/06/2026",
    startDateLabel: "05/06/2026",
    endDateLabel: null,
  },
  onOpenPaymentOptions: vi.fn(),
  onViewClasses: vi.fn(),
  onMonthChange: vi.fn(),
  onActivityModeChange: vi.fn(),
  onChargeFilterChange: vi.fn(),
};

describe("parent payment presentation helpers", () => {
  it("maps a verified negative wallet balance to amount due without exposing the sign", () => {
    expect(getParentWalletDisplayState({ balance: -1800 })).toEqual({
      kind: "due",
      label: "Amount due",
      amount: 1800,
      amountText: "₹1,800",
      description: "This is the current amount to add to the wallet.",
    });
  });

  it("maps a verified positive wallet balance to advance", () => {
    expect(getParentWalletDisplayState({ balance: 2500 })).toMatchObject({
      kind: "advance",
      label: "Advance balance",
      amountText: "₹2,500",
    });
  });

  it("keeps genuine zero distinct from missing", () => {
    expect(getParentWalletDisplayState({ balance: 0 })).toMatchObject({
      kind: "settled",
      label: "No amount due",
      amountText: "₹0",
    });
    expect(getParentWalletDisplayState({ balance: null })).toMatchObject({
      kind: "unavailable",
      amountText: null,
    });
  });

  it("keeps loading and error distinct from settled", () => {
    expect(getParentWalletDisplayState({ balance: 0, loading: true }).kind).toBe("loading");
    expect(getParentWalletDisplayState({ balance: 0, error: true }).kind).toBe("error");
  });

  it("formats a parent-friendly month and preserves invalid fallback text", () => {
    expect(formatParentPaymentMonth("2026-07")).toBe("July 2026");
    expect(formatParentPaymentMonth("not-a-month")).toBe("not-a-month");
  });

  it("filters supplied class rows without changing order", () => {
    expect(filterParentClassCharges(chargeRows, "all_classes").map((row) => row.id)).toEqual([
      "charge-unsettled",
      "charge-settled",
    ]);
    expect(filterParentClassCharges(chargeRows, "pending_payment").map((row) => row.id)).toEqual([
      "charge-unsettled",
    ]);
    expect(filterParentClassCharges(chargeRows, "paid_classes").map((row) => row.id)).toEqual([
      "charge-settled",
    ]);
  });

  it("accepts only explicit parent-rate fields and rejects generic or teacher rates", () => {
    expect(resolveVerifiedParentRate({ ratePerSession: 600, teacherPayPerSession: 300 })).toBe(600);
    expect(resolveVerifiedParentRate({ feePerClass: 650 })).toBe(650);
    expect(resolveVerifiedParentRate({ rate: 700 })).toBeNull();
    expect(resolveVerifiedParentRate({ teacherPayPerSession: 300, teacherRatePerSession: 350 })).toBeNull();
  });
});

describe("ParentPaymentsView", () => {
  it("renders wallet status first with exact amount and a textual state", () => {
    render(<ParentPaymentsView {...commonProps} />);
    const view = screen.getByTestId("parent-payments-view");
    const firstSection = view.querySelector("section");
    expect(firstSection).toHaveAttribute("data-wallet-state", "due");
    expect(within(firstSection as HTMLElement).getByText("Amount due")).toBeInTheDocument();
    expect(within(firstSection as HTMLElement).getByText("₹1,200")).toBeInTheDocument();
    expect(within(firstSection as HTMLElement).queryByText("-₹1,200")).not.toBeInTheDocument();
  });

  it("keeps the native heading logical without repeating it visually", () => {
    render(<ParentPaymentsView {...commonProps} isNativeIOSApp />);
    expect(screen.getByRole("heading", { level: 1, name: "Payments" }).parentElement).toHaveClass("sr-only");
    expect(screen.getByTestId("parent-payments-view")).toHaveClass("overflow-x-hidden");
  });

  it("opens payment options through the existing callback", () => {
    const onOpenPaymentOptions = vi.fn();
    render(<ParentPaymentsView {...commonProps} onOpenPaymentOptions={onOpenPaymentOptions} />);
    fireEvent.click(screen.getByRole("button", { name: "View payment options" }));
    expect(onOpenPaymentOptions).toHaveBeenCalledOnce();
  });

  it("shows native billing assistance instead of unsupported checkout controls", () => {
    render(<ParentPaymentsView {...commonProps} paymentOptionsAvailable={false} />);
    expect(screen.getByText("Contact support for billing assistance.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "View payment options" })).not.toBeInTheDocument();
  });

  it("preserves exact monthly summary values and genuine zero", () => {
    render(
      <ParentPaymentsView
        {...commonProps}
        summary={{
          classDeductions: 1200,
          paymentsRecorded: 0,
          billedClassCount: 2,
          settledClassCount: 1,
          unsettledClassCount: 1,
        }}
      />,
    );
    expect(screen.getByText("Recent activity · July 2026")).toBeInTheDocument();
    expect(screen.getAllByText("₹1,200")).toHaveLength(2);
    expect(screen.getByText("₹0")).toBeInTheDocument();
  });

  it("shows unavailable summary values without replacing them with zero", () => {
    render(
      <ParentPaymentsView
        {...commonProps}
        summary={{
          classDeductions: null,
          paymentsRecorded: null,
          billedClassCount: null,
          settledClassCount: null,
          unsettledClassCount: null,
        }}
      />,
    );
    expect(screen.getAllByText("Unavailable").length).toBeGreaterThanOrEqual(3);
    expect(screen.queryByText("₹0")).not.toBeInTheDocument();
  });

  it("uses skeletons instead of zero or empty copy while loading", () => {
    render(<ParentPaymentsView {...commonProps} summaryLoading activityLoading chargeCounts={null} />);
    expect(screen.getByRole("status", { name: "Loading payment period summary" })).toBeInTheDocument();
    expect(screen.getByRole("status", { name: "Loading class charges" })).toBeInTheDocument();
    expect(screen.queryByText(/No class charges/)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /All 0/ })).not.toBeInTheDocument();
  });

  it("changes month through the compact period control without invoking tab callbacks", () => {
    const onMonthChange = vi.fn();
    const onActivityModeChange = vi.fn();
    const { rerender } = render(
      <ParentPaymentsView
        {...commonProps}
        onMonthChange={onMonthChange}
        onActivityModeChange={onActivityModeChange}
      />,
    );
    const control = screen.getByTestId("parent-payment-month-control");
    expect(within(control).getAllByText("July 2026")).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: "Previous month" }));
    expect(onMonthChange).toHaveBeenCalledWith("2026-06");
    expect(onActivityModeChange).not.toHaveBeenCalled();

    rerender(
      <ParentPaymentsView
        {...commonProps}
        selectedMonth="2026-06"
        onMonthChange={onMonthChange}
        onActivityModeChange={onActivityModeChange}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Next month" }));
    expect(onMonthChange).toHaveBeenLastCalledWith("2026-07");
  });

  it("keeps activity types distinct and exposes selected tab state", () => {
    const onActivityModeChange = vi.fn();
    const { rerender } = render(
      <ParentPaymentsView {...commonProps} onActivityModeChange={onActivityModeChange} />,
    );
    expect(screen.getByRole("tab", { name: "Class charges" })).toHaveAttribute("aria-selected", "true");
    fireEvent.click(screen.getByRole("tab", { name: "Payments" }));
    expect(onActivityModeChange).toHaveBeenCalledWith("payments");

    rerender(
      <ParentPaymentsView
        {...commonProps}
        activityMode="payments"
        onActivityModeChange={onActivityModeChange}
      />,
    );
    expect(screen.getByRole("tab", { name: "Payments" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText(/Recorded 12\/0?7\/2026/)).toBeInTheDocument();
    expect(screen.getByText("UPI")).toBeInTheDocument();
    expect(screen.getByText("Reference: reference-that-remains-selectable")).toHaveClass("break-all");
  });

  it("renders compact charge rows with stable IDs and no internal or class actions", () => {
    render(<ParentPaymentsView {...commonProps} />);
    expect(document.querySelector("[data-charge-id='charge-unsettled']")).toBeInTheDocument();
    expect(document.querySelector("[data-charge-id='charge-settled']")).toBeInTheDocument();
    expect(screen.getByText("Unsettled amount ₹400 · ₹200 applied")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Join/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/teacher payout|teacher earning|billing event/i)).not.toBeInTheDocument();
  });

  it("labels a reversed charge accurately without presenting an active unsettled amount", () => {
    render(
      <ParentPaymentsView
        {...commonProps}
        chargeRows={[
          {
            id: "charge-reversed",
            date: new Date("2026-07-14T10:00:00.000Z"),
            childName: "Asha",
            amount: 600,
            paidAmount: 0,
            unsettledAmount: 0,
            status: "reversed",
          },
        ]}
      />,
    );
    const row = document.querySelector("[data-charge-id='charge-reversed']") as HTMLElement;
    expect(within(row).getByText("Reversed")).toBeInTheDocument();
    expect(within(row).queryByText(/Unsettled amount/)).not.toBeInTheDocument();
  });

  it("keeps distinct empty and error states", () => {
    const { rerender } = render(
      <ParentPaymentsView {...commonProps} chargeFilter="pending_payment" chargeRows={[]} />,
    );
    expect(screen.getByText("No unsettled class charges in July 2026.")).toBeInTheDocument();

    rerender(<ParentPaymentsView {...commonProps} activityError chargeRows={[]} />);
    expect(screen.getByRole("alert")).toHaveTextContent("Class charges could not be loaded.");
  });
});

describe("ParentPaymentOptionsDialog", () => {
  const dialogProps = {
    open: true,
    walletState: getParentWalletDisplayState({ balance: -1200 }),
    method: "UPI" as const,
    amountInput: "",
    qrImagePath: "/payments/tinysteps-upi-qr.webp",
    qrImageLoadFailed: false,
    onOpenChange: vi.fn(),
    onMethodChange: vi.fn(),
    onAmountInputChange: vi.fn(),
    onQrImageError: vi.fn(),
    onOpenWhatsAppVerification: vi.fn(),
  };

  it("uses the existing QR asset and explains external verification", () => {
    render(<ParentPaymentOptionsDialog {...dialogProps} />);
    expect(screen.getByRole("img", { name: "Tiny Steps UPI payment QR code" })).toHaveAttribute(
      "src",
      "/payments/tinysteps-upi-qr.webp",
    );
    expect(screen.getByText(/does not confirm payment in Tiny Steps/i)).toBeInTheDocument();
    expect(screen.getByText(/Opening WhatsApp does not confirm or record a payment/i)).toBeInTheDocument();
    expect(screen.queryByText(/Payment successful/i)).not.toBeInTheDocument();
  });

  it("preserves method and optional amount callbacks", () => {
    const onMethodChange = vi.fn();
    const onAmountInputChange = vi.fn();
    render(
      <ParentPaymentOptionsDialog
        {...dialogProps}
        onMethodChange={onMethodChange}
        onAmountInputChange={onAmountInputChange}
      />,
    );
    fireEvent.click(screen.getByRole("radio", { name: "Bank Transfer" }));
    expect(onMethodChange).toHaveBeenCalledWith("Bank Transfer");
    fireEvent.change(screen.getByLabelText("Amount paid (optional)"), {
      target: { value: "800" },
    });
    expect(onAmountInputChange).toHaveBeenCalledWith("800");
  });

  it("renders bank details as selectable instructions", () => {
    render(<ParentPaymentOptionsDialog {...dialogProps} method="Bank Transfer" />);
    expect(screen.getByRole("heading", { name: "Bank transfer details" })).toBeInTheDocument();
    expect(screen.getByText("50200108987663")).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("reports QR failure without clearing amount or claiming success", () => {
    render(
      <ParentPaymentOptionsDialog
        {...dialogProps}
        amountInput="800"
        qrImageLoadFailed
      />,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("UPI QR code is unavailable");
    expect(screen.getByLabelText("Amount paid (optional)")).toHaveValue(800);
    expect(screen.queryByText(/successful/i)).not.toBeInTheDocument();
  });

  it("opens verification and closes through supplied callbacks", () => {
    const onOpenWhatsAppVerification = vi.fn();
    const onOpenChange = vi.fn();
    render(
      <ParentPaymentOptionsDialog
        {...dialogProps}
        onOpenWhatsAppVerification={onOpenWhatsAppVerification}
        onOpenChange={onOpenChange}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Send details for verification" }));
    expect(onOpenWhatsAppVerification).toHaveBeenCalledOnce();
    fireEvent.click(screen.getAllByRole("button", { name: "Close" })[0]);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});

describe("ParentProfilePaymentsPanel", () => {
  it("renders only explicitly verified parent rates and opens Payments", () => {
    const onOpenPayments = vi.fn();
    render(
      <ParentProfilePaymentsPanel
        walletState={getParentWalletDisplayState({ balance: 400 })}
        paymentsTotal={1200}
        paymentsScopeLabel="Payments recorded this month"
        loading={false}
        lastUpdatedLabel="26/07/2026"
        verifiedParentRates={[
          {
            enrollmentId: "enrolment-1",
            courseLabel: "Phonics Foundation",
            amount: 600,
            verified: true,
          },
        ]}
        onOpenPayments={onOpenPayments}
      />,
    );
    expect(screen.getByText("₹600 per class")).toBeInTheDocument();
    expect(screen.queryByText(/Fee per class|teacher rate|teacher earning|teacher payout|margin/i)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Open Payments" }));
    expect(onOpenPayments).toHaveBeenCalledOnce();
  });

  it("omits rates completely when none are verified", () => {
    render(
      <ParentProfilePaymentsPanel
        walletState={getParentWalletDisplayState({ balance: null })}
        paymentsTotal={null}
        paymentsScopeLabel="All recorded payments"
        loading={false}
        lastUpdatedLabel={null}
        verifiedParentRates={[]}
        onOpenPayments={vi.fn()}
      />,
    );
    expect(screen.getAllByText("Unavailable")).toHaveLength(2);
    expect(screen.queryByText("Parent class rates")).not.toBeInTheDocument();
  });
});

describe("payment presentation source safety", () => {
  it("keeps Firebase imports out of new payment presentation files", () => {
    const files = [
      "src/pages/parent/components/payments/parentPaymentsPresentation.ts",
      "src/pages/parent/components/payments/ParentPaymentsView.tsx",
      "src/pages/parent/components/payments/ParentPaymentOptionsDialog.tsx",
      "src/pages/parent/components/payments/ParentProfilePaymentsPanel.tsx",
    ];
    files.forEach((file) => {
      expect(readFileSync(resolve(process.cwd(), file), "utf8")).not.toMatch(
        /firebase\/|firebaseConfig|from\s+["']firebase/,
      );
    });
  });
});

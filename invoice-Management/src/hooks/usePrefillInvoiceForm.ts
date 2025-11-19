import { useEffect } from "react";
import type { Invoice } from "@/interface/Invoice";

type PrefillProps = {
  initialValues?: Invoice;
  setters: {
    setInvoiceNumber: (v: string) => void;
    setInvoiceDate: (v: Date | null) => void;
    setSubmissionDate: (v: Date | null) => void;
    setBasicAmount: (v: number | "") => void;
    setGstPercentage: (v: string | null) => void;
    setTotalAmount: (v: number) => void;
    setPassedAmount: (v: number | "") => void;
    setRetention: (v: number | "") => void;
    setGstWithheld: (v: number | "") => void;
    setTds: (v: number | "") => void;
    setGstTds: (v: number | "") => void;
    setBocw: (v: number | "") => void;
    setLowDepth: (v: number | "") => void;
    setLd: (v: number | "") => void;
    setSlaPenalty: (v: number | "") => void;
    setPenalty: (v: number | "") => void;
    setOtherDeduction: (v: number | "") => void;
    setStatus: (v: string | null) => void;
    setAmountPaid: (v: number | "") => void;
    setPaymentDate: (v: Date | null) => void;
    setRemarks: (v: string) => void;
    setProject: (v: string | null) => void;
    setMode: (v: string | null) => void;
    setState: (v: string | null) => void;
    setBillCategory: (v: string | null) => void;
    setMilestone: (v: string | null) => void;
  };
};

export function usePrefillInvoiceForm({ initialValues, setters }: PrefillProps) {
  useEffect(() => {
    if (!initialValues) return;

    const {
      setInvoiceNumber,
      setInvoiceDate,
      setSubmissionDate,
      setBasicAmount,
      setGstPercentage,
      setTotalAmount,
      setPassedAmount,
      setRetention,
      setGstWithheld,
      setTds,
      setGstTds,
      setBocw,
      setLowDepth,
      setLd,
      setSlaPenalty,
      setPenalty,
      setOtherDeduction,
      setStatus,
      setAmountPaid,
      setPaymentDate,
      setRemarks,
      setProject,
      setMode,
      setState,
      setBillCategory,
      setMilestone,
    } = setters;

    // strings
    setInvoiceNumber(initialValues.invoiceNumber ?? "");
    setRemarks(initialValues.remarks ?? "");

    // dates → always Date | null
    setInvoiceDate(
      initialValues.invoiceDate ? new Date(initialValues.invoiceDate) : null
    );
    setSubmissionDate(
      initialValues.submissionDate ? new Date(initialValues.submissionDate) : null
    );
    setPaymentDate(
      initialValues.paymentDate ? new Date(initialValues.paymentDate) : null
    );

    // numbers → number | "" so Mantine <NumberInput> doesn’t break
    setBasicAmount(
      initialValues.invoiceBasicAmount != null
        ? Number(initialValues.invoiceBasicAmount)
        : ""
    );
    setTotalAmount(initialValues.totalAmount ?? 0);
    setPassedAmount(
      initialValues.passedAmountByClient != null
        ? Number(initialValues.passedAmountByClient)
        : ""
    );
    setRetention(
      initialValues.retention != null ? Number(initialValues.retention) : ""
    );
    setGstWithheld(
      initialValues.gstWithheld != null ? Number(initialValues.gstWithheld) : ""
    );
    setTds(initialValues.tds != null ? Number(initialValues.tds) : "");
    setGstTds(initialValues.gstTds != null ? Number(initialValues.gstTds) : "");
    setBocw(initialValues.bocw != null ? Number(initialValues.bocw) : "");
    setLowDepth(
      initialValues.lowDepthDeduction != null
        ? Number(initialValues.lowDepthDeduction)
        : ""
    );
    setLd(initialValues.ld != null ? Number(initialValues.ld) : "");
    setSlaPenalty(
      initialValues.slaPenalty != null ? Number(initialValues.slaPenalty) : ""
    );
    setPenalty(initialValues.penalty != null ? Number(initialValues.penalty) : "");
    setOtherDeduction(
      initialValues.otherDeduction != null
        ? Number(initialValues.otherDeduction)
        : ""
    );
    setAmountPaid(
      initialValues.amountPaidByClient != null
        ? Number(initialValues.amountPaidByClient)
        : ""
    );

    // selects → string | null
    setGstPercentage(
      initialValues.gstPercentage != null
        ? String(initialValues.gstPercentage)
        : null
    );
    setStatus(initialValues.status ?? null);
    setProject(
      Array.isArray(initialValues.project)
        ? initialValues.project.length > 0
          ? initialValues.project[0]
          : null
        : initialValues.project ?? null
    );
    setMode(initialValues.modeOfProject ?? null);
    setState(initialValues.state ?? null);
    setBillCategory(initialValues.mybillCategory ?? null);
    setMilestone(initialValues.milestone ?? null);
  }, [initialValues]);
}

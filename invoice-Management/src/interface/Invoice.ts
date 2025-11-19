import type { ReactNode } from "react";

export type Invoice = {
  items: string;
  netPayable: ReactNode;
  totalDeductions: ReactNode;
  bocw: string;
  ld: string;
  slaPenalty: string;
  penalty: string;
  otherDeduction: string;
  mybillCategory: null;
  lowDepthDeduction: string;
  gstTds: string;
  tds: string;
  gstWithheld: string;
  remarks: string;
  paymentDate:  Date| null;
  retention: string;
  passedAmountByClient: string;
  gstPercentage: string;
  invoiceBasicAmount: string;
  submissionDate:  Date| null;
  milestone: string;
  state: null;
  modeOfProject: null;
  // project can be a single string, an array of project strings, or null
  project: string | string[] | null;
  id: string;
  invoiceNumber: string;
  invoiceDate: Date|null; // API gives string, we’ll convert
  totalAmount: number;
  amountPaidByClient: number;
  balance: number;
  status: string;
};

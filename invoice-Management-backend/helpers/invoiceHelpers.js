import { v4 as uuidv4 } from "uuid";

export function buildInvoicePayload(req) {
  const id = uuidv4();
  return {
    id,
    project: req.body.project,
    modeOfProject: req.body.modeOfProject,
    state: req.body.state,
    mybillCategory: req.body.mybillCategory,
    milestone: req.body.milestone,
    invoiceNumber: req.body.invoiceNumber,
    invoiceDate: req.body.invoiceDate,
    submissionDate: req.body.submissionDate,
    invoiceBasicAmount: req.body.invoiceBasicAmount,
    gstPercentage: req.body.gstPercentage,
    invoiceGstAmount: req.body.invoiceGstAmount || 0,
    totalAmount: req.body.totalAmount || 0,
    passedAmountByClient: req.body.passedAmountByClient,
    retention: req.body.retention,
    gstWithheld: req.body.gstWithheld,
    tds: req.body.tds,
    gstTds: req.body.gstTds,
    bocw: req.body.bocw,
    lowDepthDeduction: req.body.lowDepthDeduction,
    ld: req.body.ld,
    slaPenalty: req.body.slaPenalty,
    penalty: req.body.penalty,
    otherDeduction: req.body.otherDeduction,
    totalDeduction: req.body.totalDeduction || 0,
    netPayable: req.body.netPayable || 0,
    status: req.body.status,
    amountPaidByClient: req.body.amountPaidByClient,
    paymentDate: req.body.paymentDate,
    balance: req.body.balance || 0,
    remarks: req.body.remarks,
  };
}

export function calculateInvoiceTotals(invoiceData) {
  const basicAmount = Number(invoiceData.invoiceBasicAmount || 0);
  const gstPercent = Number(invoiceData.gstPercentage?.replace("%", "") || 0);
  const amountPaid = Number(invoiceData.amountPaidByClient || 0);

  invoiceData.invoiceGstAmount = (basicAmount * gstPercent) / 100;
  invoiceData.totalAmount = basicAmount + invoiceData.invoiceGstAmount;

  invoiceData.totalDeduction =
    Number(invoiceData.retention || 0) +
    Number(invoiceData.tds || 0) +
    Number(invoiceData.gstTds || 0) +
    Number(invoiceData.bocw || 0) +
    Number(invoiceData.lowDepthDeduction || 0) +
    Number(invoiceData.ld || 0) +
    Number(invoiceData.slaPenalty || 0) +
    Number(invoiceData.penalty || 0) +
    Number(invoiceData.otherDeduction || 0);

  invoiceData.netPayable =
    invoiceData.totalAmount - invoiceData.totalDeduction;

  invoiceData.balance = invoiceData.netPayable - amountPaid;

  return invoiceData;
}

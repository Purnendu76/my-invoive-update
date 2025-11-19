import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Stack, Title, Text, Loader, Badge, Group, Paper } from "@mantine/core";
import axios from "axios";
import Cookies from "js-cookie";
import type { Invoice } from "@/interface/Invoice";

export default function InvoiceDetails() {
  const { invoiceNumber } = useParams<{ invoiceNumber: string }>();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);

   const fetchInvoice = async () => {
    try {
      const token = Cookies.get("token");
      const isUserRoute = location.pathname.startsWith("/user-invoice");

      const endpoint = isUserRoute
        ? `/api/v1/user-invoices/${invoiceNumber}`
        : `/api/v1/invoices/${invoiceNumber}`;

      const res = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setInvoice(res.data);
    } catch (error) {
      console.error("Error fetching invoice:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoice();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoiceNumber]);

  if (loading) return <Loader />;

  if (!invoice) return <Text>No invoice found</Text>;

  return (
    <Stack>
      <Title order={2}>Invoice #{invoice.invoiceNumber}</Title>

      <Paper p="md" shadow="xs" withBorder>
        <Group>
          <Text fw={500}>Status:</Text>
          <Badge
            color={
              invoice.status === "Paid"
                ? "green"
                : invoice.status === "Under process"
                ? "yellow"
                : invoice.status === "Cancelled"
                ? "red"
                : "blue"
            }
          >
            {invoice.status}
          </Badge>
        </Group>

        <Text>
          <strong>Invoice Date:</strong>{" "}
          {invoice.invoiceDate
            ? new Date(invoice.invoiceDate).toLocaleDateString()
            : "-"}
        </Text>

        <Text>
          <strong>Total Amount:</strong> ₹{invoice.totalAmount}
        </Text>

        <Text>
          <strong>Amount Paid:</strong> ₹{invoice.amountPaidByClient}
        </Text>

        <Text>
          <strong>Balance:</strong> ₹{invoice.balance}
        </Text>

        <Text>
          <strong>Projects:</strong>{" "}
          {Array.isArray(invoice.project)
            ? invoice.project.join(", ")
            : invoice.project || "-"}
        </Text>
      </Paper>
    </Stack>
  );
}

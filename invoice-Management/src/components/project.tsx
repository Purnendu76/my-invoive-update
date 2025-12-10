import { useEffect, useState } from "react";
import {
  Stack,
  Title,
  Text,
  Table,
  Group,
  Badge,
  Loader,
  Button,
} from "@mantine/core";
import axios from "axios";
import Cookies from "js-cookie";
import { useParams, Link } from "react-router-dom";
import type { Invoice } from "@/interface/Invoice";
import { notifyError } from "../lib/utils/notify";
import { IconArrowLeft } from "@tabler/icons-react";

// Utility function to format date as '12 April 2025'
function formatDateToLong(dateInput: Date | string | null | undefined): string {
  if (!dateInput) return "-";
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return "-";
  const day = date.getDate();
  const month = date.toLocaleString("en-US", { month: "long" });
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
}

// Format rupee values
const formatMoney = (val: number | null | undefined): string => {
  const n = Number(val ?? 0);
  if (isNaN(n) || n <= 0) return "0.00";
  return n.toFixed(2);
};

export  function Project() {
  const { projectName } = useParams<{ projectName: string }>();
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const token = Cookies.get("token");
      const res = await axios.get("/api/v1/invoices", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const normalized: Invoice[] = (res.data || []).map((inv: Invoice) => ({
        ...inv,
        invoiceDate: inv.invoiceDate ? new Date(inv.invoiceDate) : null,
        submissionDate: inv.submissionDate ? new Date(inv.submissionDate) : null,
        paymentDate: inv.paymentDate ? new Date(inv.paymentDate) : null,
      }));

      const target = decodeURIComponent(projectName || "").toLowerCase();

      const filtered = normalized.filter((inv) => {
        if (Array.isArray(inv.project)) {
          return inv.project.some(
            (p) => String(p).toLowerCase() === target
          );
        }
        return String(inv.project || "").toLowerCase() === target;
      });

      setInvoices(filtered);
    } catch (error) {
      console.error("Error fetching project invoices:", error);
      notifyError("Failed to fetch invoices for this project.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectName]);

  const titleProject = decodeURIComponent(projectName || "");

  return (
    <Stack>
      <Group justify="space-between" mb="sm">
        <Stack gap={0}>
          <Title order={2}>Project: {titleProject}</Title>
          <Text c="dimmed" size="sm">
            Showing all invoices for this project.
          </Text>
        </Stack>

        <Button
          component={Link}
          to="/projects"
          variant="light"
          leftSection={<IconArrowLeft size={16} />}
        >
          Back to Projects
        </Button>
      </Group>

      {loading ? (
        <Loader mt="lg" />
      ) : invoices.length === 0 ? (
        <Text ta="center" mt="lg" c="dimmed">
          No invoices found for this project.
        </Text>
      ) : (
        <Table striped highlightOnHover withTableBorder>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Invoice</Table.Th>
              <Table.Th>Invoice Date</Table.Th>
              <Table.Th>Total Amount (₹)</Table.Th>
              <Table.Th>Amount Paid (₹)</Table.Th>
              <Table.Th>Balance (₹)</Table.Th>
              <Table.Th>Status</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {invoices.map((invoice) => (
              <Table.Tr key={invoice.id}>
                <Table.Td>{invoice.invoiceNumber || "-"}</Table.Td>
                <Table.Td>{formatDateToLong(invoice.invoiceDate)}</Table.Td>
                <Table.Td>₹{formatMoney(invoice.totalAmount)}</Table.Td>
                <Table.Td>
                  ₹{formatMoney(invoice.amountPaidByClient)}
                </Table.Td>
                <Table.Td>₹{formatMoney(invoice.balance)}</Table.Td>
                <Table.Td>
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
                    {invoice.status || "-"}
                  </Badge>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}
    </Stack>
  );
}

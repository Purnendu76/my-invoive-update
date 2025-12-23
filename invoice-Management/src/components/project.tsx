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
  TextInput,
  Select,
} from "@mantine/core";
import { DatePickerInput } from '@mantine/dates';
import { IconSearch } from "@tabler/icons-react";
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
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]);

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


  // Status options
  const statusOptions = [
    { value: "Paid", label: "Paid" },
    { value: "Under process", label: "Under Process" },
    { value: "Credit Note Issued", label: "Credit Note Issued" },
    { value: "Cancelled", label: "Cancelled" },
  ];

  // Filtered invoices (search, status, date)
  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      inv.invoiceNumber?.toLowerCase().includes(search.toLowerCase()) ||
      inv.status?.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = !statusFilter || inv.status?.toLowerCase() === statusFilter.toLowerCase();

    // Date range filter
    let matchesDate = true;
    if (dateRange[0] && dateRange[1]) {
      const invDate = inv.invoiceDate instanceof Date ? inv.invoiceDate : inv.invoiceDate ? new Date(inv.invoiceDate) : null;
      if (!invDate || isNaN(invDate)) return false;
      const start = new Date(dateRange[0]);
      start.setHours(0,0,0,0);
      const end = new Date(dateRange[1]);
      end.setHours(23,59,59,999);
      if (invDate < start || invDate > end) matchesDate = false;
    }

    return matchesSearch && matchesStatus && matchesDate;
  });

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
          to="/dashboard-2"
          variant="light"
          leftSection={<IconArrowLeft size={16} />}
        >
          Back to Dashboard
        </Button>
      </Group>

      {/* Filters */}
      <Group gap="sm" mb="md">
        <TextInput
          placeholder="Search invoices..."
          leftSection={<IconSearch size={16} />}
          value={search}
          onChange={(e) => setSearch(e.currentTarget.value)}
          style={{ width: "220px" }}
        />
        <Select
          placeholder="Filter by status"
          value={statusFilter}
          onChange={setStatusFilter}
          data={statusOptions}
          style={{ width: 180 }}
          clearable
        />
        <DatePickerInput
          type="range"
          value={dateRange}
          onChange={setDateRange}
          placeholder="Date range"
          radius="md"
          style={{ minWidth: 220 }}
          mx={2}
          clearable
          dropdownType="modal"
          size="sm"
          allowSingleDateInRange
          maxDate={new Date(2100, 11, 31)}
          minDate={new Date(2000, 0, 1)}
          label={null}
        />
      </Group>

      {loading ? (
        <Loader mt="lg" />
      ) : filteredInvoices.length === 0 ? (
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
            {filteredInvoices.map((invoice) => (
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
                          ? "#20c997"
                          : invoice.status === "Under process"
                          ? "#228be6"
                          : invoice.status === "Cancelled"
                          ? "#fa5252"
                          : "#FFBF00"
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

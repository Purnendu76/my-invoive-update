import { useEffect, useState } from "react";
import {
  Table,
  TextInput,
  Group,
  Button,
  Modal,
  Text,
  Badge,
  Stack,
  ActionIcon,
  Loader,
  Title,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconSearch, IconPlus, IconEdit, IconTrash } from "@tabler/icons-react";
import { IconEye } from "@tabler/icons-react";
import axios from "axios";
import InvoiceForm from "../components/InvoiceForm";
import InvoicePopup from "./InvoicePopup";
import type { Invoice } from "@/interface/Invoice";
import { modals } from "@mantine/modals";
import { notifySuccess, notifyError } from "../lib/utils/notify";
import { Link } from "react-router-dom";

export default function User_invoice() {
  const [search, setSearch] = useState("");
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [opened, { open, close }] = useDisclosure(false);

  // ✅ Fetch only invoices for logged-in user
  const fetchInvoices = async () => {
    try {
      setLoading(true);
      // Get token from cookies instead of sessionStorage
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("token="))
        ?.split("=")[1];
      if (!token) {
        notifyError("No authentication token found. Please log in again.");
        setInvoices([]);
        setLoading(false);
        return;
      }
      const res = await axios.get("/api/v1/user-invoices/project", {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("Fetched user invoices:", res.data);

      if (!Array.isArray(res.data) || res.data.length === 0) {
        // notifyError("No invoices found for your account. If you believe this is an error, please contact support.");
      }

      const normalized = res.data.map((inv: Invoice) => ({
        ...inv,
        invoiceDate: inv.invoiceDate ? new Date(inv.invoiceDate) : null,
        submissionDate: inv.submissionDate ? new Date(inv.submissionDate) : null,
        paymentDate: inv.paymentDate ? new Date(inv.paymentDate) : null,
      }));

      setInvoices(normalized);
    } catch (error) {
      console.error("Error fetching invoices:", error);
      notifyError("Failed to fetch invoices");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  // ✅ Delete invoice
  const handleDelete = (id: string) => {
    modals.openConfirmModal({
      title: "Delete invoice",
      centered: true,
      children: <Text size="sm">Are you sure you want to delete this invoice?</Text>,
      labels: { confirm: "Delete", cancel: "Cancel" },
      confirmProps: { color: "red" },
      onConfirm: async () => {
        try {
          // Get token from cookies instead of sessionStorage
          const token = document.cookie
            .split("; ")
            .find((row) => row.startsWith("token="))
            ?.split("=")[1];
          await axios.delete(`/api/v1/user-invoices/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setInvoices((prev) => prev.filter((inv) => inv.id !== id));
          notifySuccess("Invoice deleted successfully");
        } catch (error) {
          console.error("Error deleting invoice:", error);
          notifyError("Failed to delete invoice");
        }
      },
    });
  };

  // ✅ Edit invoice
  const handleEdit = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    open();
  };

  // ✅ Add new invoice
  const handleNew = () => {
    setSelectedInvoice(null);
    open();
  };

  const filteredInvoices = invoices.filter(
    (inv) =>
      (inv.invoiceNumber?.toLowerCase() || "").includes(search.toLowerCase()) ||
      (inv.status?.toLowerCase() || "").includes(search.toLowerCase())
  );

  const formatMoney = (val: number | null | undefined): string => {
    const n = Number(val ?? 0);
    if (isNaN(n) || n <= 0) return "0.00";
    return n.toFixed(2);
  };

  return (
    <Stack>
      <Stack gap="xs" mb="md">
        <Title order={2}>My Invoices</Title>
        <Text c="dimmed" size="sm">
          View and manage only your invoices here.
        </Text>
      </Stack>

      {/* Search + Add */}
      <Group justify="space-between">
        <TextInput
          placeholder="Search invoices..."
          leftSection={<IconSearch size={16} />}
          value={search}
          onChange={(e) => setSearch(e.currentTarget.value)}
          style={{ width: "300px" }}
        />
        <Button leftSection={<IconPlus size={16} />} onClick={handleNew}>
          New Invoice
        </Button>
      </Group>

      {/* Table or message below search/add group */}
      {loading ? (
        <Loader mt="lg" />
      ) : filteredInvoices.length === 0 ? (
        <Text ta="center" c="red" mt="lg">
          No invoices found for your account.<br />
          If you believe this is an error, please contact support or try refreshing the page.
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
              <Table.Th>Action</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {filteredInvoices.map((invoice) => (
              <Table.Tr key={invoice.id}>
                <Table.Td>
                  <Link
                    to={`/user-invoice/${invoice.invoiceNumber}`}
                    style={{ color: "#1c7ed6", textDecoration: "none", cursor: "pointer" }}
                  >
                    {invoice.invoiceNumber}
                  </Link>
                </Table.Td>
                <Table.Td>
                  {invoice.invoiceDate
                    ? invoice.invoiceDate.toLocaleDateString()
                    : "-"}
                </Table.Td>
                <Table.Td>₹{formatMoney(invoice.totalAmount)}</Table.Td>
                <Table.Td>₹{formatMoney(invoice.amountPaidByClient)}</Table.Td>
                <Table.Td>₹{formatMoney(invoice.balance)}</Table.Td>
                <Table.Td>
                  <Badge
                    color={
                      invoice.status === "Paid"
                        ? "green"
                        : invoice.status === "Under process"
                        ? "yellow"
                        : "red"
                    }
                  >
                    {invoice.status}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  <Group gap="xs">
                    <ActionIcon
                      color="blue"
                      variant="light"
                      onClick={() => handleEdit(invoice)}
                      disabled={invoice.status === "Paid"}
                      style={invoice.status === "Paid" ? { opacity: 0.5, pointerEvents: "none" } : {}}
                    >
                      <IconEdit size={16} />
                    </ActionIcon>
                    <ActionIcon
                      color="red"
                      variant="light"
                      onClick={() => handleDelete(invoice.id)}
                    >
                      <IconTrash size={16} />
                    </ActionIcon>
                    <ActionIcon color="gray" variant="light" onClick={() => { setSelectedInvoice(invoice); setViewModalOpen(true); }}>
                      <IconEye size={16} />
                    </ActionIcon>
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}

      {/* Modal for new/edit invoice */}
    <Modal
      size="55rem"
      opened={opened}
      onClose={close}
      title={selectedInvoice ? "Edit Invoice" : "Add New Invoice"}
      centered
      withCloseButton={false}
      closeOnClickOutside={false}
    >
      <InvoiceForm
        onSubmit={async () => {
          await fetchInvoices();
          close();
        }}
        onClose={close}
        initialValues={selectedInvoice ?? undefined}
      />
    </Modal>
    <InvoicePopup
      opened={viewModalOpen}
      onClose={() => setViewModalOpen(false)}
      invoice={selectedInvoice}
    />
    </Stack>
  );
}

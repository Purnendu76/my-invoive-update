import { useEffect, useState } from "react";
import {
  Table,
  Stack,
  Title,
  Text,
  Group,
  Loader,
  Badge,
  Button,
} from "@mantine/core";
import axios from "axios";
import Cookies from "js-cookie";
import { useNavigate, Link } from "react-router-dom";
import type { Invoice } from "@/interface/Invoice";
import { notifyError } from "../lib/utils/notify";

// Format rupee values
const formatMoney = (val: number | null | undefined): string => {
  const n = Number(val ?? 0);
  if (isNaN(n) || n <= 0) return "0.00";
  return n.toFixed(2);
};

type ProjectSummary = {
  project: string;
  invoiceCount: number;
  totalAmount: number;
  paidAmount: number;
  balance: number;
};

export  function AddProject() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<ProjectSummary[]>([]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const token = Cookies.get("token");
      const res = await axios.get("/api/v1/invoices", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const invoices: Invoice[] = res.data || [];

      // Build project summaries
      const projectMap = new Map<string, ProjectSummary>();

      invoices.forEach((inv) => {
        const proj = Array.isArray(inv.project)
          ? String(inv.project[0] ?? "Unknown")
          : String(inv.project ?? "Unknown");

        const existing = projectMap.get(proj) || {
          project: proj,
          invoiceCount: 0,
          totalAmount: 0,
          paidAmount: 0,
          balance: 0,
        };

        existing.invoiceCount += 1;
        existing.totalAmount += Number(inv.totalAmount ?? 0);
        existing.paidAmount += Number(inv.amountPaidByClient ?? 0);
        existing.balance += Number(inv.balance ?? 0);

        projectMap.set(proj, existing);
      });

      setProjects(Array.from(projectMap.values()));
    } catch (error) {
      console.error("Error fetching invoices/projects:", error);
      notifyError("Failed to fetch projects data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  return (
    <Stack>
      <Stack gap="xs" mb="md">
        <Title order={2}>Projects</Title>
        <Text c="dimmed" size="sm">
          View all projects and open their invoices.
        </Text>
      </Stack>

      {loading ? (
        <Loader mt="lg" />
      ) : projects.length === 0 ? (
        <Text ta="center" mt="lg" c="dimmed">
          No projects found.
        </Text>
      ) : (
        <Table striped highlightOnHover withTableBorder>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Project</Table.Th>
              <Table.Th>Invoices</Table.Th>
              <Table.Th>Total Amount (₹)</Table.Th>
              <Table.Th>Paid (₹)</Table.Th>
              <Table.Th>Balance (₹)</Table.Th>
              <Table.Th>Action</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {projects.map((proj) => (
              <Table.Tr key={proj.project}>
                <Table.Td>
                  <Group gap="xs">
                    <Badge color="blue" variant="light" component={Link} to={`/project/${encodeURIComponent(proj.project)}`} style={{ cursor: "pointer", textDecoration: "none" }}>
                      {proj.project}
                    </Badge>
                  </Group>
                </Table.Td>
                <Table.Td>{proj.invoiceCount}</Table.Td>
                <Table.Td>₹{formatMoney(proj.totalAmount)}</Table.Td>
                <Table.Td>₹{formatMoney(proj.paidAmount)}</Table.Td>
                <Table.Td>₹{formatMoney(proj.balance)}</Table.Td>
                <Table.Td>
                  <Button
                    size="xs"
                    variant="light"
                    onClick={() => navigate(`/project/${encodeURIComponent(proj.project)}`)}
                  >
                    View Invoices
                  </Button>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}
    </Stack>
  );
}

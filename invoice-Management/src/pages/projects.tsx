  // Project to mode mapping
  const projectModeMap: Record<string, string> = {
    "NFS": "Back To Back",
    "GAIL": "Direct",
    "BGCL": "Direct",
    "STP": "Direct",
    "BHARAT NET": "Direct",
    "NFS AMC": "Back To Back",
  };
import { useEffect, useState, useMemo } from "react";
import {
  Table,
  Stack,
  Title,
  Text,
  Group,
  Loader,
  Badge,
  Button,
  Modal,
  TextInput,
  Select,
  
} from "@mantine/core";
import { IconSearch, IconPlus } from "@tabler/icons-react";
import axios from "axios";
import Cookies from "js-cookie";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "@mantine/form";
import { notifyError, notifySuccess } from "../lib/utils/notify";
import type { Invoice } from "@/interface/Invoice";

type ProjectSummary = {
  project: string;
  invoiceCount: number;
  totalAmount: number;
  paidAmount: number;
  balance: number;
};

const formatMoney = (val: number | null | undefined): string => {
  const n = Number(val ?? 0);
  if (isNaN(n) || n <= 0) return "0.00";
  return n.toFixed(2);
};

export function AddProject() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  const token = Cookies.get("token");

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/api/v1/invoices", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const invoices: Invoice[] = Array.isArray(res.data) ? res.data : [];

      const projectMap = new Map<string, ProjectSummary>();

      invoices.forEach((inv) => {
        // get canonical project name (if array take first)
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
    void fetchInvoices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Add Project form
  const addProjectForm = useForm({
    initialValues: {
      projectName: "",
      workOrderNumber: "",
      billCategory: "",
      modeOfProject: "",
      state: "",
    },
    validate: {
      projectName: (v) =>
        v.trim().length < 2 ? "Project name must be at least 2 characters" : null,
      modeOfProject: (v) => !v ? "Mode of Project is required" : null,
    },
  });

  const handleAddProject = async (values: typeof addProjectForm.values) => {
    const name = values.projectName.trim();
    if (!name) return;
    if (!values.modeOfProject) {
      notifyError("Mode of Project is required");
      return;
    }

    // optimistic UI: add to local list
    const newProj: ProjectSummary = {
      project: name,
      invoiceCount: 0,
      totalAmount: 0,
      paidAmount: 0,
      balance: 0,
    };

    setProjects((prev) => [newProj, ...prev]);
    addProjectForm.reset();
    setModalOpen(false);

    try {
      notifySuccess("Project added successfully");
    } catch (err) {
      console.error("Failed to persist project to server:", err);
      notifyError("Failed to persist project to server (local add succeeded)");
    }
  };

  const filtered = useMemo(() => {
    if (!search.trim()) return projects;
    const q = search.toLowerCase();
    return projects.filter(
      (p) =>
        p.project.toLowerCase().includes(q) ||
        String(p.invoiceCount).includes(q) ||
        String(p.totalAmount).includes(q)
    );
  }, [projects, search]);

  return (
    <Stack>
      {/* Header + action (search left, Add button right) */}
      <Group justify="space-between" mb="md">
        <Stack gap="xs">
          <Title order={2}>Projects</Title>
          <Text c="dimmed" size="sm">
            View all projects and open their invoices.
          </Text>
        </Stack>   
      </Group>

     <Group justify="space-between" mb="md">

  {/* LEFT SIDE → Search Box */}
  <Group gap="xs">
    <TextInput
      placeholder="Search by project"
      leftSection={<IconSearch size={16} />}
      value={search}
      onChange={(e) => setSearch(e.currentTarget.value)}
      style={{ width: 200 }}
    />
  </Group>

  <Button
    leftSection={<IconPlus size={16} />}
    onClick={() => setModalOpen(true)}
  >
    Add New Project
  </Button>

</Group>
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
              <Table.Th>Mode of Project</Table.Th>
              <Table.Th>Invoices</Table.Th>
              <Table.Th>Total Amount (₹)</Table.Th>
              <Table.Th>Paid (₹)</Table.Th>
              <Table.Th>Balance (₹)</Table.Th>
              <Table.Th>Action</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {filtered.map((proj) => (
              <Table.Tr key={proj.project}>
                <Table.Td>
                  <Badge
                    color="blue"
                    variant="light"
                    component={Link}
                    to={`/project/${encodeURIComponent(proj.project)}`}
                    style={{ cursor: "pointer", textDecoration: "none" }}
                  >
                    {proj.project}
                  </Badge>
                </Table.Td>
                <Table.Td>{projectModeMap[proj.project] || "-"}</Table.Td>
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

      {/* Add Project Modal (same pattern as Users page modal) */}
      <Modal opened={modalOpen} onClose={() => setModalOpen(false)} title="Add New Project" centered>
        <form onSubmit={addProjectForm.onSubmit(handleAddProject)}>
          <Stack>
            <TextInput
              label="Project Name"
              placeholder="e.g. NFS"
              {...addProjectForm.getInputProps("projectName")}
            />
            <TextInput
              label="Work Order Number"
              placeholder="Enter work order number"
              type="number"
              {...addProjectForm.getInputProps("workOrderNumber")}
            />
            <Select
              label="Bill Category"
              placeholder="Select bill category"
              data={["Service","Supply","ROW","AMC","Restoration Service","Restoration Supply","Restoration Row","Spares","Training"]}
              clearable
              {...addProjectForm.getInputProps("billCategory")}
            />
            <Select
              label="Mode of Project"
              placeholder="Select mode"
              data={["Back To Back","Direct"]}
              required
              error={addProjectForm.errors.modeOfProject}
              {...addProjectForm.getInputProps("modeOfProject")}
            />
            <Select
              label="State"
              placeholder="Select state"
              data={["West Bengal","Delhi","Bihar","MP","Kerala","Sikkim","Jharkhand","Andaman"]}
              clearable
              {...addProjectForm.getInputProps("state")}
            />
            <Group mt="md">
              <Button type="submit">Create</Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </Stack>
  );
}

export default AddProject;

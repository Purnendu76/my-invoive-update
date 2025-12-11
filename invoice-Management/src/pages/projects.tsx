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
  states?: { id: string; name: string }[];
};

const formatMoney = (val: number | null | undefined): string => {
  const n = Number(val ?? 0);
  if (isNaN(n) || n <= 0) return "0.00";
  return n.toFixed(2);
};


import { Select, MultiSelect } from "@mantine/core";

export function AddProject() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [modes, setModes] = useState([]);
  const [states, setStates] = useState([]);
  const token = Cookies.get("token");

  // Fetch projects from backend
  const fetchProjects = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/api/v1/projects", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const backendProjects = Array.isArray(res.data) ? res.data : [];
      setProjects(
        backendProjects.map((proj) => ({
          project: proj.name,
          invoiceCount: 0,
          totalAmount: 0,
          paidAmount: 0,
          balance: 0,
          states: proj.states || [],
        }))
      );
    } catch (error) {
      console.error("Error fetching projects:", error);
      notifyError("Failed to fetch projects data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch modes and states for modal
  const fetchModesAndStates = async () => {
    try {
      const [modeRes, stateRes] = await Promise.all([
        axios.get("/api/v1/project-modes", { headers: token ? { Authorization: `Bearer ${token}` } : {} }),
        axios.get("/api/v1/states", { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      ]);
      setModes(Array.isArray(modeRes.data) ? modeRes.data : []);
      setStates(Array.isArray(stateRes.data) ? stateRes.data : []);
    } catch (err) {
      setModes([]);
      setStates([]);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  // When modal opens, fetch modes/states
  useEffect(() => {
    if (modalOpen) fetchModesAndStates();
  }, [modalOpen]);

  // Add Project form
  const addProjectForm = useForm({
    initialValues: { projectName: "", mode_id: "", state_ids: [] },
    validate: {
      projectName: (v) => v.trim().length < 2 ? "Project name must be at least 2 characters" : null,
      mode_id: (v) => !v ? "Select a mode" : null,
      state_ids: (v) => !v || v.length === 0 ? "Select at least one state" : null,
    },
  });

  const handleAddProject = async (values) => {
    const name = values.projectName.trim();
    const mode_id = values.mode_id;
    const state_ids = values.state_ids;
    if (!name || !mode_id || !state_ids || state_ids.length === 0) return;
    try {
      await axios.post(
        "/api/v1/projects",
        { name, mode_id, state_ids },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      notifySuccess("Project added successfully");
      setModalOpen(false);
      addProjectForm.reset();
      fetchProjects();
    } catch (err) {
      console.error("Failed to persist project to server:", err);
      notifyError("Failed to persist project to server");
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
        <Button leftSection={<IconPlus size={16} />} onClick={() => setModalOpen(true)}>
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
              <Table.Th>States</Table.Th>
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
                <Table.Td>
                  {proj.states && proj.states.length > 0
                    ? proj.states.map((s) => (
                        <Badge key={s.id} color="gray" variant="light" mr={4}>{s.name}</Badge>
                      ))
                    : <Text c="dimmed" size="xs">No states</Text>}
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

      {/* Add Project Modal (with mode/state selection) */}
      <Modal opened={modalOpen} onClose={() => setModalOpen(false)} title="Add New Project" centered>
        <form onSubmit={addProjectForm.onSubmit(handleAddProject)}>
          <Stack>
            <TextInput
              label="Project Name"
              placeholder="e.g. NFS"
              {...addProjectForm.getInputProps("projectName")}
            />
            <Select
              label="Project Mode"
              placeholder="Select mode"
              data={modes.map((m) => ({ value: m.id?.toString(), label: m.name }))}
              {...addProjectForm.getInputProps("mode_id")}
            />
            <MultiSelect
              label="Project State"
              placeholder="Select state(s)"
              data={states.map((s) => ({ value: s.id?.toString(), label: s.name }))}
              {...addProjectForm.getInputProps("state_ids")}
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

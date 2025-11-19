/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useState } from "react";
import {
  Table,
  TextInput,
  Group,
  ActionIcon,
  Loader,
  Stack,
  Title,
  Text,
  Select,
  Button,
  Modal,
} from "@mantine/core";
import { IconTrash, IconSearch, IconPlus } from "@tabler/icons-react";
import axios from "axios";
import { modals } from "@mantine/modals";
import { notifySuccess, notifyError } from "../lib/utils/notify";
import Cookies from "js-cookie";
import { useForm } from "@mantine/form";

type User = {
  id: string;
  user_name: string;
  email: string;
  projectRole?: string;
  role?: string;
};

const projectRoles = ["NFS", "GAIL", "BGCL", "STP", "BHARAT NET", "NFS AMC"];

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);

  const token = Cookies.get("token");

  // Fetch users
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get("/api/v1/auth/register", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const mappedUsers = res.data.map((u: any) => ({
        ...u,
        projectRole: u.project_role || "",
        // Backend might use different property names for role; normalize to 'admin' or 'user'
        role:
          (u.role && String(u.role)) ||
          (u.user_role && String(u.user_role)) ||
          (u.is_admin || u.isAdmin ? "admin" : undefined) ||
          (u.admin ? "admin" : undefined) ||
          undefined,
      }));

      setUsers(mappedUsers);
    } catch (error) {
      console.error(error);
      notifyError("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Delete user
  const handleDelete = (id: string) => {
    modals.openConfirmModal({
      title: "Delete user",
      centered: true,
      children: <Text size="sm">Are you sure you want to delete this user?</Text>,
      labels: { confirm: "Delete", cancel: "Cancel" },
      confirmProps: { color: "red" },
      onConfirm: async () => {
        try {
          await axios.delete(`/api/v1/auth/register/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setUsers((prev) => prev.filter((u) => u.id !== id));
          notifySuccess("User deleted successfully");
        } catch (error) {
          console.error(error);
          notifyError("Failed to delete user");
        }
      },
    });
  };

  // Update project role
  const handleProjectRoleChange = async (userId: string, projectRole: string) => {
    try {
      if (!projectRoles.includes(projectRole)) {
        notifyError("Invalid project role");
        return;
      }

      await axios.put(
        `/api/v1/auth/register/${userId}`,
        { project_role: projectRole },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, projectRole } : u))
      );

      notifySuccess("Project role updated successfully");
      setDropdownOpen(null);
    } catch (error) {
      console.error("Update project role error:", error);
      notifyError("Failed to update project role");
    }
  };

  // Add user form
  const addUserForm = useForm({
    initialValues: { name: "", email: "", password: "" },
    validate: {
      name: (v) => (v.trim().length < 2 ? "Name too short" : null),
      email: (v) => (/^\S+@\S+$/.test(v) ? null : "Invalid email"),
      password: (v) => (v.length < 6 ? "Password must be at least 6 chars" : null),
    },
  });

  const handleAddUser = async (values: typeof addUserForm.values) => {
    try {
    await axios.post("/api/v1/auth/register", {
  name: values.name,
  email: values.email,
  password: values.password,
}, { headers: { Authorization: `Bearer ${token}` } });

await fetchUsers(); // refresh with consistent data
notifySuccess("User added successfully");
addUserForm.reset();
setAddModalOpen(false);
    } catch (error) {
      console.error(error);
      notifyError("Failed to add user");
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filteredUsers = users.filter(
    (u) =>
      u.user_name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Stack>
      {/* Header */}
      <Group justify="space-between">
        <Stack gap="xs">
          <Title order={2}>Users</Title>
          <Text c="dimmed" size="sm">
            View and manage all users here.
          </Text>
        </Stack>

       
      </Group>

      {/* Search */}
     <Group justify="space-between">

       <TextInput
        placeholder="Search by name or email..."
        leftSection={<IconSearch size={16} />}
        value={search}
        onChange={(e) => setSearch(e.currentTarget.value)}
        style={{ width: "300px", marginBottom: 16 }}
      />
       <Button
          leftSection={<IconPlus size={16} />}
          onClick={() => setAddModalOpen(true)}
          
        >
          Add User
        </Button>
     </Group>

      {/* Table */}
      {loading ? (
        <Loader mt="lg" />
      ) : (
        <Table striped highlightOnHover withTableBorder>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Name</Table.Th>
              <Table.Th>Email</Table.Th>
              <Table.Th>Role</Table.Th>
              <Table.Th>Project Role</Table.Th>
              <Table.Th>Action</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <Table.Tr key={user.id}>
                  <Table.Td>{user.user_name}</Table.Td>
                  <Table.Td>{user.email}</Table.Td>
                  <Table.Td>{(user.role ? String(user.role) : "user")}</Table.Td>
                  <Table.Td>{user.projectRole || "-"}</Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      <ActionIcon
                        color="red"
                        variant="light"
                        onClick={() => handleDelete(user.id)}
                        size="sm"
                      >
                        <IconTrash size={16} />
                      </ActionIcon>

                      <Button
                        size="xs"
                        variant="light"
                        onClick={() =>
                          setDropdownOpen(dropdownOpen === user.id ? null : user.id)
                        }
                      >
                        Assign
                      </Button>

                      {dropdownOpen === user.id && (
                        <Select
                          autoFocus
                          data={projectRoles.map((p) => ({
                            value: p,
                            label: p.replace("_", " "),
                          }))}
                          value={user.projectRole || ""}
                          onChange={(val) => val && handleProjectRoleChange(user.id, val)}
                          style={{ width: 150 }}
                        />
                      )}
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))
            ) : (
              <Table.Tr>
                <Table.Td colSpan={4}>
                  <Text ta="center" c="dimmed">
                    No users found
                  </Text>
                </Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      )}

      {/* Add User Modal */}
      <Modal
        opened={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Add New User"
        centered
      >
        <form onSubmit={addUserForm.onSubmit(handleAddUser)}>
          <Stack>
            <TextInput
              label="Full Name"
              placeholder="John Doe"
              {...addUserForm.getInputProps("name")}
            />
            <TextInput
              label="Email"
              placeholder="hello@example.com"
              {...addUserForm.getInputProps("email")}
            />
            <TextInput
              label="Password"
              placeholder="Enter password"
              type="password"
              {...addUserForm.getInputProps("password")}
            />

            <Group justify="flex-end" mt="md">
              <Button type="submit">Save</Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </Stack>
  );
}

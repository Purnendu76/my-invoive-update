import { useForm } from "@mantine/form";
import {
  TextInput,
  PasswordInput,
  Title,
  Button,
  Text,
  Box,
  Flex,
  Image,
  Center,
  Stack,
  Divider,
  Group,
} from "@mantine/core";
import { IconBrandGoogle, IconBrandGithub } from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";
import { notifySuccess, notifyError } from "../lib/utils/notify";
import axios, { AxiosError } from "axios";

export default function Register() {
  const navigate = useNavigate();

  const form = useForm({
    initialValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
    validate: {
      name: (value) =>
        value.trim().length < 2 ? "Name should have at least 2 characters" : null,
      email: (value) =>
        /^\S+@\S+$/.test(value) ? null : "Invalid email",
      password: (value) =>
        value.length < 6 ? "Password must be at least 6 characters" : null,
      confirmPassword: (value, values) =>
        value !== values.password ? "Passwords do not match" : null,
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    try {
      const response = await axios.post("/api/v1/auth/register", {
        name: values.name,
        email: values.email,
        password: values.password,
      });

      // ✅ Save token and user data
      document.cookie = `token=${response.data.token}; path=/;`;
      document.cookie = `user=${encodeURIComponent(JSON.stringify(response.data.user))}; path=/;`;

      notifySuccess("Registration successful!");
      navigate("/dashboard");
    } catch (err) {
      const error = err as AxiosError<{ message?: string }>;
      console.error("Register error:", error);

      const msg = error.response?.data?.message || "Registration failed";
      notifyError(msg);
    }
  };

  return (
    <Box bg="gray.1" h="100vh">
      <Flex h="100%" style={{ overflow: "hidden" }}>
        {/* Left side - Image */}
        <Box
          w="75%"
          pos="relative"
          style={{ borderRadius: "0 20px 20px 0", overflow: "hidden" }}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background:
                "linear-gradient(45deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 100%)",
              zIndex: 1,
            }}
          />
          <Image
            src="/12.jpg" 
            alt="Register background"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
          <Stack pos="absolute" bottom={60} left={60} c="white" style={{ zIndex: 2 }} gap="xs">
            <Title order={1} size={42}>Join Us Today!</Title>
            <Text size="lg" maw={450} style={{ lineHeight: 1.6 }}>
              Create your account and start managing your tasks with ease.
            </Text>
          </Stack>
        </Box>

        {/* Right side - Register Form */}
        <Box w="25%" bg="white" p={40}>
          <Center h="100%">
            <Stack w="100%" gap="lg">
              <Stack gap={0} mb={10}>
                <Title order={2} size={28}>Create Account</Title>
                <Text c="dimmed" size="sm">Fill in the details to register</Text>
              </Stack>

              <form onSubmit={form.onSubmit(handleSubmit)}>
                <Stack gap="md">
                  <TextInput
                    label="Full Name"
                    placeholder="John Doe"
                    size="md"
                    {...form.getInputProps("name")}
                  />

                  <TextInput
                    label="Email address"
                    placeholder="hello@example.com"
                    size="md"
                    {...form.getInputProps("email")}
                  />

                  <PasswordInput
                    label="Password"
                    placeholder="Your password"
                    size="md"
                    {...form.getInputProps("password")}
                  />

                  <PasswordInput
                    label="Confirm Password"
                    placeholder="Re-enter password"
                    size="md"
                    {...form.getInputProps("confirmPassword")}
                  />

                  <Button
                    type="submit"
                    size="md"
                    style={{
                      background: "linear-gradient(45deg, #22c55e 0%, #16a34a 100%)",
                      transition: "transform 0.2s",
                    }}
                  >
                    Sign up
                  </Button>
                </Stack>
              </form>

              {/* Back to login */}
              <Button
                variant="outline"
                color="blue"
                size="md"
                onClick={() => navigate("/")}
              >
                Already have an account? Sign in
              </Button>

              <Divider label="or continue with" labelPosition="center" />

              <Group grow>
                <Button variant="light" leftSection={<IconBrandGoogle size={20} />}>
                  Google
                </Button>
                <Button variant="light" leftSection={<IconBrandGithub size={20} />}>
                  GitHub
                </Button>
              </Group>
            </Stack>
          </Center>
        </Box>
      </Flex>
    </Box>
  );
}

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
import axios, { AxiosError } from "axios";
import { notifySuccess, notifyError } from "../lib/utils/notify";

// ✅ Strongly typed form values
interface LoginFormValues {
  email: string;
  password: string;
}

export default function Auth() {
  const navigate = useNavigate();

  const form = useForm<LoginFormValues>({
    initialValues: {
      email: "",
      password: "",
    },
    validate: {
      email: (value) =>
        /^\S+@\S+$/.test(value) ? null : "Invalid email",
      password: (value) =>
        value.length < 6
          ? "Password should include at least 6 characters"
          : null,
    },
  });

  const handleSubmit = async (values: LoginFormValues) => {
    try {
      // ✅ Call backend login
      const res = await axios.post("/api/v1/auth/login", {
        email: values.email,
        password: values.password,
      });

      // ✅ Save token & user data in sessionStorage
      document.cookie = `token=${res.data.token}; path=/;`;
      document.cookie = `user=${encodeURIComponent(JSON.stringify(res.data.user))}; path=/;`;

      notifySuccess("Login successful!");
      console.log("Logged in:", res.data);

      // ✅ Redirect to dashboard
      navigate("/dashboard");
    } catch (err) {
      const error = err as AxiosError<{ message?: string }>;
      console.error("Login error:", error);
      notifyError(error.response?.data?.message || "Login failed");
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
            alt="Login background"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
          <Stack
            pos="absolute"
            bottom={60}
            left={60}
            c="white"
            style={{ zIndex: 2 }}
            gap="xs"
          >
            <Title order={1} size={42}>
              Welcome Back!
            </Title>
            <Text size="lg" maw={450} style={{ lineHeight: 1.6 }}>
              Login to access your workspace and manage your tasks efficiently.
            </Text>
          </Stack>
        </Box>

        {/* Right side - Login Form */}
        <Box w="25%" bg="white" p={40}>
          <Center h="100%">
            <Stack w="100%" gap="lg">
              <Stack gap={0} mb={10}>
                <Title order={2} size={28}>
                  Sign In
                </Title>
                <Text c="dimmed" size="sm">
                  Please enter your credentials to continue
                </Text>
              </Stack>

              <form onSubmit={form.onSubmit(handleSubmit)}>
                <Stack gap="md">
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

                  <Button
                    type="submit"
                    size="md"
                    style={{
                      background:
                        "linear-gradient(45deg, #3b82f6 0%, #2563eb 100%)",
                      transition: "transform 0.2s",
                    }}
                  >
                    Sign in
                  </Button>
                </Stack>
              </form>

              {/* Register button */}
              <Button
                variant="outline"
                color="blue"
                size="md"
                onClick={() => navigate("/register")}
              >
                Create an account
              </Button>

              <Divider label="or continue with" labelPosition="center" />

              <Group grow>
                <Button
                  variant="light"
                  leftSection={<IconBrandGoogle size={20} />}
                >
                  Google
                </Button>
                <Button
                  variant="light"
                  leftSection={<IconBrandGithub size={20} />}
                >
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

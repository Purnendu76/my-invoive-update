import {
  IconDeviceDesktopAnalytics,
  IconGauge,
  IconHome2,
  IconLogout,
} from "@tabler/icons-react";
import { Title, Tooltip, UnstyledButton, Button, Text, Stack } from "@mantine/core";
import { MantineLogo } from "@mantinex/mantine-logo";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import classes from "./DoubleNavbar.module.css";
import { getUserRole } from "../../lib/utils/getUserRole";
import Cookies from "js-cookie";

// ✅ Utility to decode JWT
function parseJwt(token: string | undefined) {
  if (!token) return null;
  try {
    return JSON.parse(atob(token.split(".")[1]));
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    return null;
  }
}

export default function NavbarNested() {
  const location = useLocation();
  const navigate = useNavigate();
  const role = getUserRole();

  const token = Cookies.get("token");
  const user = parseJwt(token); // ✅ Decode token
  const userName = user?.name || "User";
  const userRole = user?.role || "Guest";

  // ✅ Logout function
const handleLogout = () => {
  Cookies.remove("token", { path: "/" });
  Cookies.remove("role", { path: "/" });
  Cookies.remove("name", { path: "/" });
  navigate("/", { replace: true });
  window.location.reload(); // 🔑 clears all in-memory state
};

  // ✅ Filter links based on role
  const mainLinksData = [
    { icon: IconGauge, label: "Dashboard", path: "/dashboard" },
    ...(role === "Admin"
      ? [
          { icon: IconHome2, label: "Admin-Invoice", path: "/admin-invoice" },
          { icon: IconHome2, label: "Users", path: "/users" },
        ]
      : [
          {
            icon: IconDeviceDesktopAnalytics,
            label: "User-Invoice",
            path: "/user-invoice",
          },
        ]),
  ];

  const active = mainLinksData.find(
    (link) => link.path === location.pathname
  )?.label;

  const mainLinks = mainLinksData.map((link) => {
    const Icon = link.icon;
    return (
      <Tooltip
        label={link.label}
        position="right"
        withArrow
        transitionProps={{ duration: 0 }}
        key={link.label}
      >
        <NavLink
          to={link.path}
          className={({ isActive }) =>
            `${classes.mainLink} ${isActive ? classes.mainLinkActive : ""}`
          }
        >
          <UnstyledButton>
            <Icon size={22} stroke={1.5} />
          </UnstyledButton>
        </NavLink>
      </Tooltip>
    );
  });

  const links = mainLinksData.map((link) => (
    <NavLink
      to={link.path}
      className={({ isActive }) =>
        `${classes.link} ${isActive ? classes.linkActive : ""}`
      }
      key={link.label}
    >
      {link.label}
    </NavLink>
  ));

  return (
    <nav className={classes.navbar}>
      <div className={classes.wrapper}>
        <div className={classes.aside}>
          <div className={classes.logo}>
            <MantineLogo type="mark" size={30} />
          </div>
          {mainLinks}
        </div>

        <div className={classes.main} style={{ display: "flex", flexDirection: "column", height: "100%" }}>
          <div>
            <Title order={4} className={classes.title}>
              {active}
            </Title>
            {links}
          </div>

          {/* ✅ Username + Logout at the bottom */}
          <Stack mt="60vh" gap="xs">
            <Text ta="center" fw={500} >
              Welcome {userName}
              <p style={{ fontSize: "12px", color:'#91ADC8'}}>{userRole}</p>
            </Text>
            
            <Button
              variant="outline"
              color="red"
              fullWidth
              onClick={handleLogout}
              leftSection={<IconLogout size={16} />}
            >
              Logout
            </Button>
          </Stack>
        </div>
      </div>
    </nav>
  );
}

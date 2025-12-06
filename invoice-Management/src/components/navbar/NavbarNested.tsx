import {
  IconDeviceDesktopAnalytics,
  IconGauge,
  IconHome2,
  IconLogout,
} from "@tabler/icons-react";
import { Title, Tooltip, UnstyledButton, Button,  } from "@mantine/core";
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

  // Set to true to hide the entire left aside (logo + icon bar)
  const hideAside = true;

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

  // Sidebar links: icon only
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
            <Icon size={24} stroke={2} />
          </UnstyledButton>
        </NavLink>
      </Tooltip>
    );
  });

  // Title links: icon + label
  const links = mainLinksData.map((link) => {
    const Icon = link.icon;
    return (
      <NavLink
        to={link.path}
        className={({ isActive }) =>
          `${classes.link} ${isActive ? classes.linkActive : ""}`
        }
        key={link.label}
        style={{ display: "flex", alignItems: "center", gap: 8 }}
      >
        <Icon size={18} style={{ marginRight: 4 }} />
        {link.label}
      </NavLink>
    );
  });

  return (
    <nav className={classes.navbar}>
      <div className={classes.wrapper}>
        {!hideAside && (
          <div className={classes.aside}>
            <div className={classes.logo}>
              <MantineLogo type="mark" size={30} />
            </div>
            {mainLinks}
          </div>
        )}

        <div className={classes.main} style={{ display: "flex", flexDirection: "column", height: "100%" }}>
          <div>
            <Title order={4} className={classes.title} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <MantineLogo type="mark" size={24} style={{ marginRight: 6 }} />
              {active}
            </Title>
            {links}
          </div>

          {/* Beautiful bottom section: logo, username, role, logout with icon */}
          <div style={{ marginTop: "auto", padding: "1.2rem", textAlign: "center", borderTop: "1px solid #e3e8ee" }}>
            <div style={{ marginBottom: 10, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
              <MantineLogo type="mark" size={28} style={{ marginBottom: 2 }} />
              <div style={{ fontWeight: 600, fontSize: 16 }}>{userName}</div>
              <div style={{ fontSize: 12, color: '#91ADC8', marginBottom: 2 }}>{userRole}</div>
            </div>
            <Button
              variant="outline"
              color="red"
              size="sm"
              onClick={handleLogout}
              leftSection={<IconLogout size={16} style={{ marginRight: 4 }} />}
              style={{ fontWeight: 500, letterSpacing: 0.2, padding: "8px 18px", borderRadius: 8 }}
            >
              Logout
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}

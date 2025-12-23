import { AppShell } from "@mantine/core";
import { Outlet } from "react-router-dom";
import NavbarNested from "./navbar/NavbarNested";

export default function Layout() {
  return (
    <AppShell
      padding="md"
      navbar={{ width: 260, breakpoint: "sm" }}
    >
      {/* Sidebar */}
      <AppShell.Navbar>
        <NavbarNested />
      </AppShell.Navbar>

    
      <AppShell.Main>
        <div >
          <Outlet />
        </div>
      </AppShell.Main>
    </AppShell>
  );
}

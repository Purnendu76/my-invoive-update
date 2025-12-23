import { type RouteObject } from "react-router-dom";
import Layout from "../components/layout";
import Dashboard from "../pages/dashboard";
import Admin_invoice from "../pages/admin-invoice";
import User_invoice from "../pages/user-invoice";
import Register from "../pages/regester";
import Auth from "../pages/auth";
import PrivateRoute from "../components/PrivateRoute";
import Users from "../pages/users";
import Test from "../pages/test";
import InvoiceDetails from "../pages/InvoiceDetails";
import SelectedStatus from "../pages/selectedStatus";
import { AddProject } from "../pages/projects";
import { Project } from "../components/project";
import Dashboard2 from "../pages/dashboard-2";
import SelectGst from "../pages/select-gst";
import Overdue from "../pages/overdue";
const routes: RouteObject[] = [
  { path: "/", element: <Auth /> },
  { path: "/register", element: <Register /> },

  {
    element: <Layout />,
    children: [
      {
        path: "/dashboard",
        element: (
          <PrivateRoute allowedRoles={["Admin", "user"]}>
            <Dashboard />
          </PrivateRoute>
        ),
      },
      {
        path: "/dashboard-2",
        element: (
          <PrivateRoute allowedRoles={["Admin", "user"]}>
            <Dashboard2 />
          </PrivateRoute>
        ),
      },
      {
        path: "/admin-invoice",
        element: (
          <PrivateRoute allowedRoles={["Admin"]}>
            <Admin_invoice />
          </PrivateRoute>
        ),
      },

      {
        path:"/projects",
        element: (
          <PrivateRoute allowedRoles={["Admin"]}>
            <AddProject />
          </PrivateRoute>
        ),

      },
      {
        path: "/admin-invoice/:invoiceNumber",
        element: (
          <PrivateRoute allowedRoles={["Admin"]}>
            <InvoiceDetails />
          </PrivateRoute>
        ),
      },
      {
        path: "/user-invoice",
        element: (
          <PrivateRoute allowedRoles={["user", "Admin"]}>
            <User_invoice />
          </PrivateRoute>
        ),
      },
      {
       path: "/user-invoice/:invoiceNumber",
        element: (
          <PrivateRoute allowedRoles={["user", "Admin"]}>
            <InvoiceDetails />
          </PrivateRoute>
        )
      },
      {
        path: "/users",
        element: (
          <PrivateRoute allowedRoles={["Admin"]}>
            <Users />
          </PrivateRoute>
        ),
      },
      {
        path: "/test",
        element: (
          <PrivateRoute allowedRoles={["Admin", "user"]}>
            <Test />
          </PrivateRoute>
        ),
      },

      {
        path:"/select-status",
        element: (
          <PrivateRoute allowedRoles={["Admin"]}>
            <SelectedStatus />
          </PrivateRoute>
        ),
      },
      {
        path:"/select-gst",
        element: (
          <PrivateRoute allowedRoles={["Admin"]}>
            <SelectGst />
          </PrivateRoute>
        ),
      },
      {
        path: "/project/:projectName",
        element: (
          <PrivateRoute allowedRoles={["Admin"]}>
            <Project />
          </PrivateRoute>
        ),
      },
      {
        path: "/overdue",
        element: (
          <PrivateRoute allowedRoles={["Admin", "user"]}>
            <Overdue />
          </PrivateRoute>
        ),
      }

    ],
  },
];

export default routes;

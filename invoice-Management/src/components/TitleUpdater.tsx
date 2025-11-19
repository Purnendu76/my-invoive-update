import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function TitleUpdater() {
  const location = useLocation();

  useEffect(() => {
    // Map routes to page titles
    const routeTitles: { [key: string]: string } = {
      "/":"signIn",
      "/register": "Register",
      "/dashboard": "Dashboard",
      "/admin-invoice": "Admin-invoice ",
      "/user-invoice": "User-invoice ",
      "/users": "Users",
    };

    const path = location.pathname;
    const title = routeTitles[path] || " Invoice Management Software";

    document.title = `${title} | Invoice Management `;
  }, [location]);

  return null;
}
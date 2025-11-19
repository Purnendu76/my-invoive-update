import { jwtDecode } from "jwt-decode";

export type DecodedToken = {
  id: string;
  email: string;
  role: "Admin" | "User";
  exp: number;
};

export function getUserRole(): "Admin" | "user" | null {
const token = document.cookie
    .split("; ")
    .find(row => row.startsWith("token="))
    ?.split("=")[1] || null;
  if (!token) return null;

  try {
    const decoded: DecodedToken = jwtDecode(token);
    return decoded.role === "User" ? "user" : decoded.role;
  } catch (error) {
    console.error("Invalid token:", error);
    return null;
  }
}

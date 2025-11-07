import "next-auth";
import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      role: "user" | "admin";
      provider?: "credentials" | "google";
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId: string;
    role: "user" | "admin";
    provider?: "credentials" | "google";
  }
}

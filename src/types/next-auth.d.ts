import "next-auth";
import { DefaultSession } from "next-auth";
declare module "next-auth" {
  interface Session {
    user: {
      id?: string;
      role?: "user" | "admin";
      provider?: "credentials" | "google";
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string;
    role?: "user" | "admin";
    provider?: "credentials" | "google";
  }
}

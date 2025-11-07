"use client";

import { Button } from "@/components/ui/button";
import { signOut } from "next-auth/react";
import { LogOut as LogOutIcon } from "lucide-react";
import { toast } from "sonner";

export function LogoutButton() {
  const handleLogout = async () => {
    try {
      await signOut({ callbackUrl: "/login" });
    } catch (error) {
      toast.error("Failed to logout");
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleLogout}
      className="hidden sm:flex"
    >
      <LogOutIcon className="mr-2 h-4 w-4" />
      Logout
    </Button>
  );
}

"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export function Breadcrumbs() {
  const pathname = usePathname();

  const segments = React.useMemo(
    () => pathname.split("/").filter(Boolean),
    [pathname]
  );

  const first = segments[0];

  const LABELS: Record<string, string> = {
    dashboard: "Dashboard",
    tasks: "Tasks",
    users: "Users",
  };

  const isRootDashboard = segments.length === 0;

  if (!isRootDashboard && !LABELS[first ?? ""]) {
    return null;
  }

  return (
    <Breadcrumb aria-label="Breadcrumb">
      <BreadcrumbList>
        {isRootDashboard ? (
          <BreadcrumbItem>
            <BreadcrumbPage>Dashboard</BreadcrumbPage>
          </BreadcrumbItem>
        ) : (
          <>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/">Dashboard</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{LABELS[first!]}</BreadcrumbPage>
            </BreadcrumbItem>
          </>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

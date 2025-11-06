"use client";

import * as React from "react";

type AssignedBadgeProps = {
  assignee: string;
};

export const AssignedBadge: React.FC<AssignedBadgeProps> = ({ assignee }) => (
  <div className="text-muted-foreground text-xs" aria-live="polite">
    Assigned to {assignee}
  </div>
);
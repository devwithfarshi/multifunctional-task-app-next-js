"use client";

import * as React from "react";
import { LayoutGridIcon, ListIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ViewMode } from "./types";
import { CreateEditDialog } from "./CreateEditDialog";

type TasksHeaderProps = {
  view: ViewMode;
  onChangeView: (view: ViewMode) => void;
};

export const TasksHeader: React.FC<TasksHeaderProps> = ({ view, onChangeView }) => {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onChangeView("grid")}
          aria-label="Grid view"
        >
          <LayoutGridIcon className="size-4" />
          <span className="hidden sm:inline">Grid</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onChangeView("list")}
          aria-label="List view"
        >
          <ListIcon className="size-4" />
          <span className="hidden sm:inline">List</span>
        </Button>
      </div>
      <div className="flex items-center gap-2">
        <CreateEditDialog mode="create" trigger="new" />
      </div>
    </div>
  );
};
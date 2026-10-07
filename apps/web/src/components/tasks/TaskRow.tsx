"use client";

import { useState } from "react";
import { Calendar, Pencil, Trash2 } from "lucide-react";
import type { Task } from "@pms/shared";
import { Badge } from "@/components/ui/Badge";
import { Select } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { formatDate, taskPriorityLabel, taskPriorityStyles } from "@/lib/utils";

interface Props {
  task: Task;
  showProject?: boolean;
  onStatusChange: (status: string) => void;
  onPriorityChange: (priority: string) => void;
  onEdit: () => void;
  onDelete: () => void;
  isUpdating?: boolean;
}

export function TaskRow({ task, showProject, onStatusChange, onPriorityChange, onEdit, onDelete, isUpdating }: Props) {
  const [localStatus, setLocalStatus] = useState(task.status);
  const [localPriority, setLocalPriority] = useState(task.priority);

  return (
    <div className="flex flex-col gap-3 border-b border-slate-100 py-4 last:border-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-slate-900">{task.name}</p>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
          {showProject && task.project && <span>{task.project.name}</span>}
          {task.dueDate && (
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatDate(task.dueDate)}
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Badge className={taskPriorityStyles[localPriority]}>{taskPriorityLabel[localPriority]}</Badge>
        <Select
          value={localStatus}
          disabled={isUpdating}
          onChange={(e) => {
            setLocalStatus(e.target.value as Task["status"]);
            onStatusChange(e.target.value);
          }}
          className="w-36 py-1 text-xs"
        >
          <option value="PENDING">Pending</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="COMPLETED">Completed</option>
        </Select>
        <Select
          value={localPriority}
          disabled={isUpdating}
          onChange={(e) => {
            setLocalPriority(e.target.value as Task["priority"]);
            onPriorityChange(e.target.value);
          }}
          className="w-28 py-1 text-xs"
        >
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
        </Select>
        <Button variant="ghost" size="sm" onClick={onEdit} aria-label="Edit task">
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="sm" onClick={onDelete} aria-label="Delete task">
          <Trash2 className="h-3.5 w-3.5 text-rose-600" />
        </Button>
      </div>
    </div>
  );
}

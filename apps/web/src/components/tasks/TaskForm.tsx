"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { taskFormSchema, type TaskFormValues } from "@pms/shared";
import { Input, Select, Textarea } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

interface Props {
  projects: Array<{ id: string; name: string }>;
  defaultValues?: Partial<TaskFormValues>;
  onSubmit: (values: TaskFormValues) => Promise<void>;
  submitLabel: string;
  onCancel: () => void;
  lockProject?: boolean;
}

export function TaskForm({ projects, defaultValues, onSubmit, submitLabel, onCancel, lockProject }: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      projectId: "",
      name: "",
      description: "",
      priority: "MEDIUM",
      status: "PENDING",
      dueDate: "",
      ...defaultValues,
    },
  });

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
      <Select
        label="Project"
        error={errors.projectId?.message}
        disabled={lockProject}
        {...register("projectId")}
      >
        <option value="">Select a project</option>
        {projects.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </Select>

      <Input label="Task name" placeholder="Design homepage" error={errors.name?.message} {...register("name")} />

      <Textarea label="Description" placeholder="Details about this task" error={errors.description?.message} {...register("description")} />

      <div className="grid grid-cols-2 gap-4">
        <Select label="Priority" error={errors.priority?.message} {...register("priority")}>
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
        </Select>
        <Select label="Status" error={errors.status?.message} {...register("status")}>
          <option value="PENDING">Pending</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="COMPLETED">Completed</option>
        </Select>
      </div>

      <Input label="Due date" type="date" error={errors.dueDate?.message} {...register("dueDate")} />

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}

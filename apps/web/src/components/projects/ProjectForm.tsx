"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { projectFormSchema, type ProjectFormValues } from "@pms/shared";
import { Input, Select, Textarea } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

interface Props {
  defaultValues?: Partial<ProjectFormValues>;
  onSubmit: (values: ProjectFormValues) => Promise<void>;
  submitLabel: string;
  onCancel: () => void;
}

export function ProjectForm({ defaultValues, onSubmit, submitLabel, onCancel }: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      name: "",
      description: "",
      status: "NOT_STARTED",
      startDate: "",
      endDate: "",
      ...defaultValues,
    },
  });

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
      <Input label="Project name" placeholder="Website Redesign" error={errors.name?.message} {...register("name")} />

      <Textarea
        label="Description"
        placeholder="What is this project about?"
        error={errors.description?.message}
        {...register("description")}
      />

      <Select label="Status" error={errors.status?.message} {...register("status")}>
        <option value="NOT_STARTED">Not Started</option>
        <option value="IN_PROGRESS">In Progress</option>
        <option value="COMPLETED">Completed</option>
      </Select>

      <div className="grid grid-cols-2 gap-4">
        <Input label="Start date" type="date" error={errors.startDate?.message} {...register("startDate")} />
        <Input label="End date" type="date" error={errors.endDate?.message} {...register("endDate")} />
      </div>

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

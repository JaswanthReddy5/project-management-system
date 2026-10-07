"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { ProjectFormValues } from "@pms/shared";
import { Card } from "@/components/ui/Card";
import { ProjectForm } from "@/components/projects/ProjectForm";
import { useCreateProject } from "@/hooks/useProjects";
import { getErrorMessage } from "@/lib/utils";

export default function NewProjectPage() {
  const router = useRouter();
  const createProject = useCreateProject();

  async function handleSubmit(values: ProjectFormValues) {
    try {
      const res = await createProject.mutateAsync({
        ...values,
        description: values.description || undefined,
        startDate: values.startDate || undefined,
        endDate: values.endDate || undefined,
      });
      toast.success("Project created");
      router.push(`/projects/${res.data.id}`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h2 className="mb-6 text-lg font-semibold text-slate-900">New Project</h2>
      <Card className="p-6">
        <ProjectForm submitLabel="Create project" onSubmit={handleSubmit} onCancel={() => router.push("/projects")} />
      </Card>
    </div>
  );
}

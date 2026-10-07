"use client";

import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import type { ProjectFormValues } from "@pms/shared";
import { useProject, useUpdateProject } from "@/hooks/useProjects";
import { Card } from "@/components/ui/Card";
import { PageLoader } from "@/components/ui/Spinner";
import { ErrorState } from "@/components/ui/ErrorState";
import { ProjectForm } from "@/components/projects/ProjectForm";
import { getErrorMessage, toDateInputValue } from "@/lib/utils";

export default function EditProjectPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data, isLoading, isError, error, refetch } = useProject(id);
  const updateProject = useUpdateProject(id);

  if (isLoading) return <PageLoader label="Loading project..." />;
  if (isError) return <ErrorState message={getErrorMessage(error)} onRetry={() => refetch()} />;

  const project = data!.data;

  async function handleSubmit(values: ProjectFormValues) {
    try {
      await updateProject.mutateAsync({
        ...values,
        description: values.description || null,
        startDate: values.startDate || null,
        endDate: values.endDate || null,
      });
      toast.success("Project updated");
      router.push(`/projects/${id}`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h2 className="mb-6 text-lg font-semibold text-slate-900">Edit Project</h2>
      <Card className="p-6">
        <ProjectForm
          defaultValues={{
            name: project.name,
            description: project.description ?? "",
            status: project.status,
            startDate: toDateInputValue(project.startDate),
            endDate: toDateInputValue(project.endDate),
          }}
          submitLabel="Save changes"
          onSubmit={handleSubmit}
          onCancel={() => router.push(`/projects/${id}`)}
        />
      </Card>
    </div>
  );
}

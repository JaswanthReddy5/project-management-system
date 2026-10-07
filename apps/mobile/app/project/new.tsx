import { useState } from "react";
import { useRouter } from "expo-router";
import type { ProjectFormValues } from "@pms/shared";
import { ProjectFormView } from "../../src/components/ProjectFormView";
import { useCreateProject } from "../../src/hooks/useProjects";
import { getErrorMessage } from "../../src/lib/utils";

export default function NewProjectScreen() {
  const router = useRouter();
  const createProject = useCreateProject();
  const [serverError, setServerError] = useState<string | null>(null);

  async function handleSubmit(values: ProjectFormValues) {
    setServerError(null);
    try {
      const res = await createProject.mutateAsync({
        ...values,
        description: values.description || undefined,
        startDate: values.startDate || undefined,
        endDate: values.endDate || undefined,
      });
      router.replace(`/project/${res.data.id}`);
    } catch (err) {
      setServerError(getErrorMessage(err));
    }
  }

  return (
    <ProjectFormView
      submitLabel="Create project"
      onSubmit={handleSubmit}
      isSubmitting={createProject.isPending}
      serverError={serverError}
    />
  );
}

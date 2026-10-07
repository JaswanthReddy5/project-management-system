import { useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import type { TaskFormValues } from "@pms/shared";
import { TaskFormView } from "../../src/components/TaskFormView";
import { useCreateTask } from "../../src/hooks/useTasks";
import { useProjects } from "../../src/hooks/useProjects";
import { getErrorMessage } from "../../src/lib/utils";

export default function NewTaskScreen() {
  const router = useRouter();
  const { projectId } = useLocalSearchParams<{ projectId?: string }>();
  const createTask = useCreateTask();
  const { data: projectsData } = useProjects({ limit: 100 });
  const [serverError, setServerError] = useState<string | null>(null);

  const projects = projectsData?.data ?? [];

  async function handleSubmit(values: TaskFormValues) {
    setServerError(null);
    try {
      await createTask.mutateAsync({
        ...values,
        description: values.description || undefined,
        dueDate: values.dueDate || undefined,
      });
      router.back();
    } catch (err) {
      setServerError(getErrorMessage(err));
    }
  }

  return (
    <TaskFormView
      projects={projects}
      lockProject={Boolean(projectId)}
      defaultValues={{ projectId: projectId ?? "" }}
      submitLabel="Create task"
      onSubmit={handleSubmit}
      isSubmitting={createTask.isPending}
      serverError={serverError}
    />
  );
}

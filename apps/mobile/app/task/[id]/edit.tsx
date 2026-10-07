import { useState } from "react";
import { View, StyleSheet } from "react-native";
import { ActivityIndicator, Text, Button } from "react-native-paper";
import { useLocalSearchParams, useRouter } from "expo-router";
import type { TaskFormValues } from "@pms/shared";
import { useTask, useUpdateTask } from "../../../src/hooks/useTasks";
import { TaskFormView } from "../../../src/components/TaskFormView";
import { getErrorMessage } from "../../../src/lib/utils";

export default function EditTaskScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data, isLoading, isError, error, refetch } = useTask(id);
  const [serverError, setServerError] = useState<string | null>(null);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.center}>
        <Text style={{ color: "#e11d48" }}>{getErrorMessage(error)}</Text>
        <Button mode="contained" onPress={() => refetch()} style={{ marginTop: 12 }}>
          Try again
        </Button>
      </View>
    );
  }

  const task = data!.data;

  return <EditTaskForm taskId={task.id} projectId={task.projectId} defaultValues={{
    name: task.name,
    description: task.description ?? "",
    priority: task.priority,
    status: task.status,
    dueDate: task.dueDate ? task.dueDate.slice(0, 10) : "",
  }} serverError={serverError} setServerError={setServerError} onDone={() => router.back()} />;
}

function EditTaskForm({
  taskId,
  projectId,
  defaultValues,
  serverError,
  setServerError,
  onDone,
}: {
  taskId: string;
  projectId: string;
  defaultValues: Partial<TaskFormValues>;
  serverError: string | null;
  setServerError: (err: string | null) => void;
  onDone: () => void;
}) {
  const updateTask = useUpdateTask(taskId, projectId);

  async function handleSubmit(values: TaskFormValues) {
    setServerError(null);
    try {
      await updateTask.mutateAsync({
        name: values.name,
        description: values.description || undefined,
        priority: values.priority,
        status: values.status,
        dueDate: values.dueDate || undefined,
      });
      onDone();
    } catch (err) {
      setServerError(getErrorMessage(err));
    }
  }

  return (
    <TaskFormView
      lockProject
      defaultValues={defaultValues}
      submitLabel="Save changes"
      onSubmit={handleSubmit}
      isSubmitting={updateTask.isPending}
      serverError={serverError}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
});

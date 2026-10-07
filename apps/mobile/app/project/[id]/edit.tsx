import { useState } from "react";
import { View, StyleSheet } from "react-native";
import { ActivityIndicator, Text, Button } from "react-native-paper";
import { useLocalSearchParams, useRouter } from "expo-router";
import type { ProjectFormValues } from "@pms/shared";
import { useProject, useUpdateProject } from "../../../src/hooks/useProjects";
import { ProjectFormView } from "../../../src/components/ProjectFormView";
import { getErrorMessage, toDateInputValue } from "../../../src/lib/utils";

export default function EditProjectScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data, isLoading, isError, error, refetch } = useProject(id);
  const updateProject = useUpdateProject(id);
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

  const project = data!.data;

  async function handleSubmit(values: ProjectFormValues) {
    setServerError(null);
    try {
      await updateProject.mutateAsync({
        ...values,
        description: values.description || null,
        startDate: values.startDate || null,
        endDate: values.endDate || null,
      });
      router.back();
    } catch (err) {
      setServerError(getErrorMessage(err));
    }
  }

  return (
    <ProjectFormView
      defaultValues={{
        name: project.name,
        description: project.description ?? "",
        status: project.status,
        startDate: toDateInputValue(project.startDate),
        endDate: toDateInputValue(project.endDate),
      }}
      submitLabel="Save changes"
      onSubmit={handleSubmit}
      isSubmitting={updateProject.isPending}
      serverError={serverError}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
});

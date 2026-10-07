import { useState } from "react";
import { ScrollView, StyleSheet } from "react-native";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Text, TextInput, Button, HelperText, SegmentedButtons, Menu } from "react-native-paper";
import { taskFormSchema, type TaskFormValues } from "@pms/shared";

interface Props {
  projects?: Array<{ id: string; name: string }>;
  lockProject?: boolean;
  defaultValues?: Partial<TaskFormValues>;
  onSubmit: (values: TaskFormValues) => Promise<void>;
  submitLabel: string;
  isSubmitting?: boolean;
  serverError?: string | null;
}

export function TaskFormView({
  projects,
  lockProject,
  defaultValues,
  onSubmit,
  submitLabel,
  isSubmitting,
  serverError,
}: Props) {
  const [projectMenuOpen, setProjectMenuOpen] = useState(false);
  const {
    control,
    handleSubmit,
    formState: { errors },
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
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {!lockProject && projects && (
        <>
          <Text style={styles.label}>Project</Text>
          <Controller
            control={control}
            name="projectId"
            render={({ field }) => (
              <Menu
                visible={projectMenuOpen}
                onDismiss={() => setProjectMenuOpen(false)}
                anchor={
                  <Button mode="outlined" onPress={() => setProjectMenuOpen(true)} style={styles.input}>
                    {projects.find((p) => p.id === field.value)?.name ?? "Select a project"}
                  </Button>
                }
              >
                {projects.map((p) => (
                  <Menu.Item
                    key={p.id}
                    title={p.name}
                    onPress={() => {
                      field.onChange(p.id);
                      setProjectMenuOpen(false);
                    }}
                  />
                ))}
              </Menu>
            )}
          />
        </>
      )}

      <Controller
        control={control}
        name="name"
        render={({ field }) => (
          <TextInput label="Task name" mode="outlined" value={field.value} onChangeText={field.onChange} style={styles.input} />
        )}
      />
      <HelperText type="error" visible={Boolean(errors.name)}>
        {errors.name?.message}
      </HelperText>

      <Controller
        control={control}
        name="description"
        render={({ field }) => (
          <TextInput
            label="Description"
            mode="outlined"
            multiline
            numberOfLines={3}
            value={field.value ?? ""}
            onChangeText={field.onChange}
            style={styles.input}
          />
        )}
      />

      <Text style={styles.label}>Priority</Text>
      <Controller
        control={control}
        name="priority"
        render={({ field }) => (
          <SegmentedButtons
            value={field.value}
            onValueChange={field.onChange}
            style={styles.input}
            buttons={[
              { value: "LOW", label: "Low" },
              { value: "MEDIUM", label: "Medium" },
              { value: "HIGH", label: "High" },
            ]}
          />
        )}
      />

      <Text style={styles.label}>Status</Text>
      <Controller
        control={control}
        name="status"
        render={({ field }) => (
          <SegmentedButtons
            value={field.value}
            onValueChange={field.onChange}
            style={styles.input}
            buttons={[
              { value: "PENDING", label: "Pending" },
              { value: "IN_PROGRESS", label: "In Progress" },
              { value: "COMPLETED", label: "Completed" },
            ]}
          />
        )}
      />

      <Controller
        control={control}
        name="dueDate"
        render={({ field }) => (
          <TextInput
            label="Due date (YYYY-MM-DD)"
            mode="outlined"
            value={field.value ?? ""}
            onChangeText={field.onChange}
            style={styles.input}
          />
        )}
      />

      {errors.projectId && <HelperText type="error">{errors.projectId.message}</HelperText>}
      {serverError && <Text style={styles.serverError}>{serverError}</Text>}

      <Button mode="contained" onPress={handleSubmit(onSubmit)} loading={isSubmitting} style={styles.submit}>
        {submitLabel}
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#f8fafc" },
  content: { padding: 16, paddingBottom: 48 },
  input: { backgroundColor: "white", marginBottom: 4 },
  label: { marginBottom: 8, color: "#64748b", fontSize: 13 },
  serverError: { color: "#e11d48", marginTop: 8, marginBottom: 4, textAlign: "center" },
  submit: { marginTop: 16, borderRadius: 10, paddingVertical: 2 },
});

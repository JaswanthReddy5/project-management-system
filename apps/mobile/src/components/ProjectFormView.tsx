import { ScrollView, StyleSheet, View } from "react-native";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Text, TextInput, Button, HelperText, SegmentedButtons } from "react-native-paper";
import { projectFormSchema, type ProjectFormValues } from "@pms/shared";

interface Props {
  defaultValues?: Partial<ProjectFormValues>;
  onSubmit: (values: ProjectFormValues) => Promise<void>;
  submitLabel: string;
  isSubmitting?: boolean;
  serverError?: string | null;
}

export function ProjectFormView({ defaultValues, onSubmit, submitLabel, isSubmitting, serverError }: Props) {
  const {
    control,
    handleSubmit,
    formState: { errors },
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
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Controller
        control={control}
        name="name"
        render={({ field }) => (
          <TextInput label="Project name" mode="outlined" value={field.value} onChangeText={field.onChange} style={styles.input} />
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
              { value: "NOT_STARTED", label: "Not Started" },
              { value: "IN_PROGRESS", label: "In Progress" },
              { value: "COMPLETED", label: "Completed" },
            ]}
          />
        )}
      />

      <View style={styles.row}>
        <Controller
          control={control}
          name="startDate"
          render={({ field }) => (
            <TextInput
              label="Start date (YYYY-MM-DD)"
              mode="outlined"
              value={field.value ?? ""}
              onChangeText={field.onChange}
              style={[styles.input, styles.half]}
            />
          )}
        />
        <Controller
          control={control}
          name="endDate"
          render={({ field }) => (
            <TextInput
              label="End date (YYYY-MM-DD)"
              mode="outlined"
              value={field.value ?? ""}
              onChangeText={field.onChange}
              style={[styles.input, styles.half]}
            />
          )}
        />
      </View>
      <HelperText type="error" visible={Boolean(errors.endDate)}>
        {errors.endDate?.message}
      </HelperText>

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
  row: { flexDirection: "row", gap: 10 },
  half: { flex: 1 },
  serverError: { color: "#e11d48", marginTop: 8, marginBottom: 4, textAlign: "center" },
  submit: { marginTop: 16, borderRadius: 10, paddingVertical: 2 },
});

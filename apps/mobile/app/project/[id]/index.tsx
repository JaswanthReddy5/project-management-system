import { useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { ActivityIndicator, Text, Chip, Button, Card, IconButton, Menu } from "react-native-paper";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useProject } from "../../../src/hooks/useProjects";
import { useDeleteTask, useUpdateTask } from "../../../src/hooks/useTasks";
import {
  formatDate,
  getErrorMessage,
  projectStatusColor,
  projectStatusLabel,
  taskPriorityColor,
  taskPriorityLabel,
  taskStatusColor,
  taskStatusLabel,
} from "../../../src/lib/utils";
import type { Task } from "@pms/shared";

const statusOptions: Task["status"][] = ["PENDING", "IN_PROGRESS", "COMPLETED"];

export default function ProjectDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data, isLoading, isError, error, refetch, isRefetching } = useProject(id);

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
        <Text style={styles.errorText}>{getErrorMessage(error)}</Text>
        <Button mode="contained" onPress={() => refetch()} style={{ marginTop: 12 }}>
          Try again
        </Button>
      </View>
    );
  }

  const project = data!.data;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} />}
    >
      <View style={styles.header}>
        <Text variant="titleLarge" style={styles.title}>
          {project.name}
        </Text>
        <Chip style={{ backgroundColor: `${projectStatusColor[project.status]}1A` }}>
          {projectStatusLabel[project.status]}
        </Chip>
      </View>

      {project.description && <Text style={styles.description}>{project.description}</Text>}

      <Text style={styles.meta}>
        {formatDate(project.startDate)} – {formatDate(project.endDate)}
      </Text>

      <Button mode="outlined" style={styles.editButton} onPress={() => router.push(`/project/${project.id}/edit`)}>
        Edit Project
      </Button>

      <View style={styles.sectionHeader}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Tasks
        </Text>
        <Button
          mode="contained"
          compact
          onPress={() => router.push({ pathname: "/task/new", params: { projectId: project.id } })}
        >
          Add Task
        </Button>
      </View>

      {project.tasks.length === 0 ? (
        <Text style={styles.empty}>No tasks yet.</Text>
      ) : (
        project.tasks.map((task) => (
          <TaskItem key={task.id} task={task} onEdit={() => router.push(`/task/${task.id}/edit`)} />
        ))
      )}
    </ScrollView>
  );
}

function TaskItem({ task, onEdit }: { task: Task; onEdit: () => void }) {
  const updateTask = useUpdateTask(task.id, task.projectId);
  const deleteTask = useDeleteTask(task.projectId);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <Card style={styles.taskCard}>
      <Card.Content>
        <View style={styles.taskHeader}>
          <Text style={styles.taskTitle}>{task.name}</Text>
          <Menu
            visible={menuOpen}
            onDismiss={() => setMenuOpen(false)}
            anchor={<IconButton icon="dots-vertical" size={18} onPress={() => setMenuOpen(true)} />}
          >
            <Menu.Item title="Edit" onPress={() => { setMenuOpen(false); onEdit(); }} />
            <Menu.Item title="Delete" onPress={() => { setMenuOpen(false); deleteTask.mutate(task.id); }} />
          </Menu>
        </View>
        <View style={styles.badgeRow}>
          <Chip compact textStyle={{ fontSize: 11 }} style={{ backgroundColor: `${taskPriorityColor[task.priority]}1A` }}>
            {taskPriorityLabel[task.priority]}
          </Chip>
          {statusOptions.map((s) => (
            <Chip
              key={s}
              compact
              selected={task.status === s}
              onPress={() => updateTask.mutate({ status: s })}
              textStyle={{ fontSize: 11 }}
              style={[styles.statusChip, task.status === s && { backgroundColor: `${taskStatusColor[s]}33` }]}
            >
              {taskStatusLabel[s]}
            </Chip>
          ))}
        </View>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#f8fafc" },
  content: { padding: 16, paddingBottom: 32 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  errorText: { color: "#e11d48", textAlign: "center" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { fontWeight: "700", flex: 1, marginRight: 8 },
  description: { color: "#475569", marginTop: 10 },
  meta: { color: "#94a3b8", marginTop: 10, fontSize: 13 },
  editButton: { marginTop: 16, alignSelf: "flex-start" },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 24, marginBottom: 10 },
  sectionTitle: { fontWeight: "700" },
  empty: { color: "#94a3b8" },
  taskCard: { marginBottom: 10, backgroundColor: "white" },
  taskHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  taskTitle: { fontWeight: "600", color: "#0f172a", flex: 1 },
  badgeRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8 },
  statusChip: { backgroundColor: "#f1f5f9" },
});

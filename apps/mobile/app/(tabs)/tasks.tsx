import { useState } from "react";
import { FlatList, RefreshControl, StyleSheet, View } from "react-native";
import { ActivityIndicator, Text, Card, Chip, Searchbar, FAB, Button, Menu, IconButton } from "react-native-paper";
import { useRouter } from "expo-router";
import { useTasks, useUpdateTask, useDeleteTask } from "../../src/hooks/useTasks";
import { useProjects } from "../../src/hooks/useProjects";
import {
  getErrorMessage,
  taskPriorityColor,
  taskPriorityLabel,
  taskStatusColor,
  taskStatusLabel,
} from "../../src/lib/utils";
import type { Task } from "@pms/shared";

const statusOptions: Task["status"][] = ["PENDING", "IN_PROGRESS", "COMPLETED"];
const priorityOptions: Task["priority"][] = ["LOW", "MEDIUM", "HIGH"];

export default function TasksScreen() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const [priorityMenuOpen, setPriorityMenuOpen] = useState(false);

  const { data, isLoading, isError, error, refetch, isRefetching } = useTasks({
    search: search || undefined,
    status: statusFilter || undefined,
    priority: priorityFilter || undefined,
  });
  const { data: projectsData } = useProjects({ limit: 100 });
  const deleteTask = useDeleteTask();

  const tasks = data?.data ?? [];
  const hasProjects = (projectsData?.data?.length ?? 0) > 0;

  return (
    <View style={styles.screen}>
      <View style={styles.filters}>
        <Searchbar placeholder="Search tasks" value={search} onChangeText={setSearch} style={styles.search} />
        <View style={styles.filterRow}>
          <Menu
            visible={statusMenuOpen}
            onDismiss={() => setStatusMenuOpen(false)}
            anchor={
              <Chip icon="filter-variant" onPress={() => setStatusMenuOpen(true)} style={styles.filterChip}>
                {statusFilter ? taskStatusLabel[statusFilter as Task["status"]] : "Status"}
              </Chip>
            }
          >
            <Menu.Item title="All" onPress={() => { setStatusFilter(""); setStatusMenuOpen(false); }} />
            {statusOptions.map((s) => (
              <Menu.Item key={s} title={taskStatusLabel[s]} onPress={() => { setStatusFilter(s); setStatusMenuOpen(false); }} />
            ))}
          </Menu>

          <Menu
            visible={priorityMenuOpen}
            onDismiss={() => setPriorityMenuOpen(false)}
            anchor={
              <Chip icon="flag-variant" onPress={() => setPriorityMenuOpen(true)} style={styles.filterChip}>
                {priorityFilter ? taskPriorityLabel[priorityFilter as Task["priority"]] : "Priority"}
              </Chip>
            }
          >
            <Menu.Item title="All" onPress={() => { setPriorityFilter(""); setPriorityMenuOpen(false); }} />
            {priorityOptions.map((p) => (
              <Menu.Item key={p} title={taskPriorityLabel[p]} onPress={() => { setPriorityFilter(p); setPriorityMenuOpen(false); }} />
            ))}
          </Menu>
        </View>
      </View>

      {isLoading && (
        <View style={styles.center}>
          <ActivityIndicator size="large" />
        </View>
      )}

      {isError && (
        <View style={styles.center}>
          <Text style={styles.errorText}>{getErrorMessage(error)}</Text>
          <Button mode="contained" onPress={() => refetch()} style={{ marginTop: 12 }}>
            Try again
          </Button>
        </View>
      )}

      {!isLoading && !isError && (
        <FlatList
          data={tasks}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} />}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.empty}>No tasks found.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TaskCard
              task={item}
              onEdit={() => router.push(`/task/${item.id}/edit`)}
              onDelete={() => deleteTask.mutate(item.id)}
            />
          )}
        />
      )}

      <FAB icon="plus" style={styles.fab} disabled={!hasProjects} onPress={() => router.push("/task/new")} />
    </View>
  );
}

function TaskCard({ task, onEdit, onDelete }: { task: Task; onEdit: () => void; onDelete: () => void }) {
  const updateTask = useUpdateTask(task.id, task.projectId);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>{task.name}</Text>
            <Text style={styles.cardSubtitle}>{task.project?.name}</Text>
          </View>
          <Menu
            visible={menuOpen}
            onDismiss={() => setMenuOpen(false)}
            anchor={<IconButton icon="dots-vertical" onPress={() => setMenuOpen(true)} />}
          >
            <Menu.Item title="Edit" onPress={() => { setMenuOpen(false); onEdit(); }} />
            <Menu.Item title="Delete" onPress={() => { setMenuOpen(false); onDelete(); }} />
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
  filters: { padding: 16, paddingBottom: 8, gap: 10 },
  search: { backgroundColor: "white" },
  filterRow: { flexDirection: "row", gap: 8 },
  filterChip: { backgroundColor: "white" },
  listContent: { paddingHorizontal: 16, paddingBottom: 100 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  errorText: { color: "#e11d48", textAlign: "center" },
  empty: { color: "#94a3b8", marginTop: 40 },
  card: { marginBottom: 10, backgroundColor: "white" },
  cardHeader: { flexDirection: "row", alignItems: "center" },
  cardTitle: { fontWeight: "700", fontSize: 15, color: "#0f172a" },
  cardSubtitle: { color: "#94a3b8", fontSize: 12, marginTop: 2 },
  badgeRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 10 },
  statusChip: { backgroundColor: "#f1f5f9" },
  fab: { position: "absolute", right: 16, bottom: 16, backgroundColor: "#3568f5" },
});

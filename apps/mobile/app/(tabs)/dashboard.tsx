import { RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { ActivityIndicator, Text, Card, Chip, Button } from "react-native-paper";
import { useRouter } from "expo-router";
import { useDashboard } from "../../src/hooks/useDashboard";
import { getErrorMessage, projectStatusColor, projectStatusLabel, taskStatusColor, taskStatusLabel } from "../../src/lib/utils";

const statCards = [
  { key: "totalProjects", label: "Total Projects" },
  { key: "totalTasks", label: "Total Tasks" },
  { key: "completedTasks", label: "Completed Tasks" },
  { key: "pendingTasks", label: "Pending Tasks" },
  { key: "projectsInProgress", label: "Projects In Progress" },
] as const;

export default function DashboardScreen() {
  const { data, isLoading, isError, error, refetch, isRefetching } = useDashboard();
  const router = useRouter();

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

  const stats = data!.data;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} />}
    >
      <View style={styles.grid}>
        {statCards.map(({ key, label }) => (
          <Card key={key} style={styles.statCard} mode="contained">
            <Card.Content>
              <Text variant="displaySmall" style={styles.statValue}>
                {stats[key]}
              </Text>
              <Text variant="bodySmall" style={styles.statLabel}>
                {label}
              </Text>
            </Card.Content>
          </Card>
        ))}
      </View>

      <Text variant="titleMedium" style={styles.sectionTitle}>
        Recent Projects
      </Text>
      {stats.recentProjects.length === 0 ? (
        <Text style={styles.empty}>No projects yet.</Text>
      ) : (
        stats.recentProjects.map((project) => (
          <Card key={project.id} style={styles.row} onPress={() => router.push(`/project/${project.id}`)}>
            <Card.Content style={styles.rowContent}>
              <Text style={styles.rowTitle}>{project.name}</Text>
              <Chip compact textStyle={{ fontSize: 11 }} style={{ backgroundColor: `${projectStatusColor[project.status]}1A` }}>
                {projectStatusLabel[project.status]}
              </Chip>
            </Card.Content>
          </Card>
        ))
      )}

      <Text variant="titleMedium" style={styles.sectionTitle}>
        Recent Tasks
      </Text>
      {stats.recentTasks.length === 0 ? (
        <Text style={styles.empty}>No tasks yet.</Text>
      ) : (
        stats.recentTasks.map((task) => (
          <Card key={task.id} style={styles.row}>
            <Card.Content style={styles.rowContent}>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>{task.name}</Text>
                <Text style={styles.rowSubtitle}>{task.project?.name}</Text>
              </View>
              <Chip compact textStyle={{ fontSize: 11 }} style={{ backgroundColor: `${taskStatusColor[task.status]}1A` }}>
                {taskStatusLabel[task.status]}
              </Chip>
            </Card.Content>
          </Card>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#f8fafc" },
  content: { padding: 16, paddingBottom: 32 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  errorText: { color: "#e11d48", textAlign: "center" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 8 },
  statCard: { width: "47%", backgroundColor: "white" },
  statValue: { fontWeight: "700", color: "#1c3abc" },
  statLabel: { color: "#64748b" },
  sectionTitle: { marginTop: 20, marginBottom: 10, fontWeight: "700" },
  row: { marginBottom: 8, backgroundColor: "white" },
  rowContent: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  rowTitle: { fontWeight: "600", color: "#0f172a" },
  rowSubtitle: { color: "#94a3b8", fontSize: 12 },
  empty: { color: "#94a3b8" },
});

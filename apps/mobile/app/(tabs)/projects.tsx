import { useState } from "react";
import { FlatList, RefreshControl, StyleSheet, View } from "react-native";
import { ActivityIndicator, Text, Card, Chip, Searchbar, FAB, Button, SegmentedButtons } from "react-native-paper";
import { useRouter } from "expo-router";
import { useProjects } from "../../src/hooks/useProjects";
import { getErrorMessage, projectStatusColor, projectStatusLabel } from "../../src/lib/utils";

export default function ProjectsScreen() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  const { data, isLoading, isError, error, refetch, isRefetching } = useProjects({
    search: search || undefined,
    status: status || undefined,
  });

  const projects = data?.data ?? [];

  return (
    <View style={styles.screen}>
      <View style={styles.filters}>
        <Searchbar placeholder="Search projects" value={search} onChangeText={setSearch} style={styles.search} />
        <SegmentedButtons
          value={status}
          onValueChange={setStatus}
          style={styles.segmented}
          buttons={[
            { value: "", label: "All" },
            { value: "NOT_STARTED", label: "Not Started" },
            { value: "IN_PROGRESS", label: "In Progress" },
            { value: "COMPLETED", label: "Completed" },
          ]}
        />
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
          data={projects}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} />}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.empty}>No projects found.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <Card style={styles.card} onPress={() => router.push(`/project/${item.id}`)}>
              <Card.Content>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>{item.name}</Text>
                  <Chip compact textStyle={{ fontSize: 11 }} style={{ backgroundColor: `${projectStatusColor[item.status]}1A` }}>
                    {projectStatusLabel[item.status]}
                  </Chip>
                </View>
                {item.description && (
                  <Text style={styles.cardDescription} numberOfLines={2}>
                    {item.description}
                  </Text>
                )}
                <Text style={styles.cardMeta}>{item._count?.tasks ?? 0} tasks</Text>
              </Card.Content>
            </Card>
          )}
        />
      )}

      <FAB icon="plus" style={styles.fab} onPress={() => router.push("/project/new")} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#f8fafc" },
  filters: { padding: 16, paddingBottom: 8, gap: 10 },
  search: { backgroundColor: "white" },
  segmented: {},
  listContent: { paddingHorizontal: 16, paddingBottom: 100 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  errorText: { color: "#e11d48", textAlign: "center" },
  empty: { color: "#94a3b8", marginTop: 40 },
  card: { marginBottom: 10, backgroundColor: "white" },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cardTitle: { fontWeight: "700", fontSize: 15, color: "#0f172a", flex: 1, marginRight: 8 },
  cardDescription: { color: "#64748b", marginTop: 4, fontSize: 13 },
  cardMeta: { color: "#94a3b8", marginTop: 8, fontSize: 12 },
  fab: { position: "absolute", right: 16, bottom: 16, backgroundColor: "#3568f5" },
});

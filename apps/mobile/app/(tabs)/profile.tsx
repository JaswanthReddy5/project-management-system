import { StyleSheet, View } from "react-native";
import { Avatar, Text, Button, Card } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../src/lib/auth-context";

export default function ProfileScreen() {
  const { user, logout } = useAuth();

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Avatar.Text size={64} label={user?.fullName?.[0]?.toUpperCase() ?? "?"} />
          <Text variant="titleLarge" style={styles.name}>
            {user?.fullName}
          </Text>
          <Text style={styles.email}>{user?.email}</Text>
        </View>

        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.label}>Member since</Text>
            <Text style={styles.value}>
              {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "—"}
            </Text>
          </Card.Content>
        </Card>

        <Button mode="contained-tonal" onPress={() => logout()} style={styles.logoutButton} textColor="#e11d48">
          Log out
        </Button>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#f8fafc" },
  content: { flex: 1, padding: 24 },
  header: { alignItems: "center", marginBottom: 24, marginTop: 12 },
  name: { marginTop: 12, fontWeight: "700" },
  email: { color: "#64748b", marginTop: 2 },
  card: { backgroundColor: "white", marginBottom: 24 },
  label: { color: "#94a3b8", fontSize: 12 },
  value: { color: "#0f172a", fontSize: 15, marginTop: 2 },
  logoutButton: { marginTop: "auto" },
});

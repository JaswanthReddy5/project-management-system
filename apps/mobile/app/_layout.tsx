import { useEffect } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { PaperProvider, MD3LightTheme, Snackbar } from "react-native-paper";
import { StatusBar } from "expo-status-bar";
import { QueryProvider } from "../src/lib/query-provider";
import { AuthProvider, useAuth } from "../src/lib/auth-context";

const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: "#3568f5",
    secondary: "#1c3abc",
  },
};

function RootNavigator() {
  const { user, isLoading, sessionExpired, dismissSessionExpired } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (isLoading) return;
    const inAuthGroup = segments[0] === "login" || segments[0] === "register";

    if (!user && !inAuthGroup) {
      router.replace("/login");
    } else if (user && inAuthGroup) {
      router.replace("/(tabs)/dashboard");
    }
  }, [user, isLoading, segments, router]);

  useEffect(() => {
    if (sessionExpired) {
      router.replace("/login");
    }
  }, [sessionExpired, router]);

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="project/new" options={{ headerShown: true, title: "New Project", presentation: "modal" }} />
        <Stack.Screen name="project/[id]/index" options={{ headerShown: true, title: "Project" }} />
        <Stack.Screen name="project/[id]/edit" options={{ headerShown: true, title: "Edit Project" }} />
        <Stack.Screen name="task/new" options={{ headerShown: true, title: "New Task", presentation: "modal" }} />
        <Stack.Screen name="task/[id]/edit" options={{ headerShown: true, title: "Edit Task", presentation: "modal" }} />
      </Stack>

      <Snackbar
        visible={sessionExpired}
        onDismiss={dismissSessionExpired}
        duration={5000}
        action={{ label: "OK", onPress: dismissSessionExpired }}
      >
        Your session has expired. Please log in again.
      </Snackbar>
    </>
  );
}

export default function RootLayout() {
  return (
    <QueryProvider>
      <AuthProvider>
        <PaperProvider theme={theme}>
          <StatusBar style="dark" />
          <RootNavigator />
        </PaperProvider>
      </AuthProvider>
    </QueryProvider>
  );
}

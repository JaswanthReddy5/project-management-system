import { useState } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, View } from "react-native";
import { useRouter, Link } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Text, TextInput, Button, HelperText } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { loginSchema, type LoginFormValues } from "@pms/shared";
import { useAuth } from "../src/lib/auth-context";
import { ApiRequestError } from "../src/lib/api";

export default function LoginScreen() {
  const { login } = useAuth();
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(values: LoginFormValues) {
    setServerError(null);
    setLoading(true);
    try {
      await login(values.email, values.password);
      router.replace("/(tabs)/dashboard");
    } catch (err) {
      setServerError(err instanceof ApiRequestError ? err.message : "Unable to log in. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        <View style={styles.container}>
          <Text variant="headlineMedium" style={styles.title}>
            Welcome back
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            Log in to manage your projects and tasks.
          </Text>

          <Controller
            control={control}
            name="email"
            render={({ field }) => (
              <TextInput
                label="Email"
                mode="outlined"
                autoCapitalize="none"
                keyboardType="email-address"
                value={field.value ?? ""}
                onChangeText={field.onChange}
                style={styles.input}
              />
            )}
          />
          <HelperText type="error" visible={Boolean(errors.email)}>
            {errors.email?.message}
          </HelperText>

          <Controller
            control={control}
            name="password"
            render={({ field }) => (
              <TextInput
                label="Password"
                mode="outlined"
                secureTextEntry
                value={field.value ?? ""}
                onChangeText={field.onChange}
                style={styles.input}
              />
            )}
          />
          <HelperText type="error" visible={Boolean(errors.password)}>
            {errors.password?.message}
          </HelperText>

          {serverError && <Text style={styles.serverError}>{serverError}</Text>}

          <Button mode="contained" onPress={handleSubmit(onSubmit)} loading={loading} style={styles.button}>
            Log in
          </Button>

          <View style={styles.footer}>
            <Text variant="bodyMedium">Don&apos;t have an account? </Text>
            <Link href="/register">
              <Text variant="bodyMedium" style={styles.link}>
                Create one
              </Text>
            </Link>
          </View>

          <Text style={styles.demo}>Demo: alice@example.com / Password123!</Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f8fafc" },
  flex: { flex: 1 },
  container: { flex: 1, justifyContent: "center", paddingHorizontal: 24 },
  title: { textAlign: "center", fontWeight: "700", marginBottom: 4 },
  subtitle: { textAlign: "center", color: "#64748b", marginBottom: 24 },
  input: { backgroundColor: "white" },
  button: { marginTop: 8, borderRadius: 10, paddingVertical: 2 },
  serverError: { color: "#e11d48", marginBottom: 8, textAlign: "center" },
  footer: { flexDirection: "row", justifyContent: "center", marginTop: 20 },
  link: { color: "#3568f5", fontWeight: "600" },
  demo: { textAlign: "center", color: "#94a3b8", marginTop: 16, fontSize: 12 },
});

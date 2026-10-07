import { useState } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, View } from "react-native";
import { useRouter, Link } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Text, TextInput, Button, HelperText } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { registerSchema, type RegisterFormValues } from "@pms/shared";
import { useAuth } from "../src/lib/auth-context";
import { ApiRequestError } from "../src/lib/api";

export default function RegisterScreen() {
  const { register: registerUser } = useAuth();
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({ resolver: zodResolver(registerSchema) });

  async function onSubmit(values: RegisterFormValues) {
    setServerError(null);
    setLoading(true);
    try {
      await registerUser(values.fullName, values.email, values.password);
      router.replace("/(tabs)/dashboard");
    } catch (err) {
      setServerError(err instanceof ApiRequestError ? err.message : "Unable to register. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.flex}>
        <View style={styles.container}>
          <Text variant="headlineMedium" style={styles.title}>
            Create your account
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            Start organizing your projects in minutes.
          </Text>

          <Controller
            control={control}
            name="fullName"
            render={({ field }) => (
              <TextInput label="Full name" mode="outlined" value={field.value ?? ""} onChangeText={field.onChange} style={styles.input} />
            )}
          />
          <HelperText type="error" visible={Boolean(errors.fullName)}>
            {errors.fullName?.message}
          </HelperText>

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
            Create account
          </Button>

          <View style={styles.footer}>
            <Text variant="bodyMedium">Already have an account? </Text>
            <Link href="/login">
              <Text variant="bodyMedium" style={styles.link}>
                Log in
              </Text>
            </Link>
          </View>
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
});

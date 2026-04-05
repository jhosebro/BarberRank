//TODO: Aplicar SRP
//TODO: Extraer la validacion
//TODO: Separar componentes de UI
//TODO: Memorizar funciones evitando renders
//TODO: Evitar logica en jsx
//TODO: Mejorar UX
//TODO: Mejorar Arquitectura

import { UserRole } from "@/lib/types";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../../hooks/useAuth";

export default function RegisterScreen() {
  const { signUp, loading } = useAuth();

  interface RegisterForm {
    fullName: string;
    email: string;
    phone: string;
    password: string;
    role: UserRole;
  }

  const [form, setForm] = useState<RegisterForm>({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    role: "client",
  });

  const handleChange = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleRegister = async () => {
    if (!form.fullName || !form.email || !form.password || !form.phone) {
      return;
    }
    await signUp(form);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Crear cuenta</Text>
        <Text style={styles.subtitle}>¿Cómo quieres usar BarberApp?</Text>

        {/* Selector de rol */}
        <View style={styles.roleRow}>
          <TouchableOpacity
            style={[
              styles.roleCard,
              form.role === "client" && styles.roleCardActive,
            ]}
            onPress={() => handleChange("role", "client")}
          >
            <Text style={styles.roleEmoji}>💈</Text>
            <Text
              style={[
                styles.roleLabel,
                form.role === "client" && styles.roleLabelActive,
              ]}
            >
              Soy cliente
            </Text>
            <Text style={styles.roleDesc}>Quiero reservar citas</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.roleCard,
              form.role === "barber" && styles.roleCardActive,
            ]}
            onPress={() => handleChange("role", "barber")}
          >
            <Text style={styles.roleEmoji}>✂️</Text>
            <Text
              style={[
                styles.roleLabel,
                form.role === "barber" && styles.roleLabelActive,
              ]}
            >
              Soy barbero
            </Text>
            <Text style={styles.roleDesc}>Quiero recibir citas</Text>
          </TouchableOpacity>
        </View>

        {/* Formulario */}
        <View style={styles.form}>
          <Text style={styles.label}>Nombre completo</Text>
          <TextInput
            style={styles.input}
            placeholder="Carlos Rodríguez"
            placeholderTextColor="#999"
            value={form.fullName}
            onChangeText={(text) => handleChange("fullName", text)}
            autoCapitalize="words"
          />

          <Text style={styles.label}>Teléfono</Text>
          <TextInput
            style={styles.input}
            placeholder="+57 300 000 0000"
            placeholderTextColor="#999"
            value={form.phone}
            onChangeText={(text) => handleChange("phone", text)}
            keyboardType="phone-pad"
          />

          <Text style={styles.label}>Correo electrónico</Text>
          <TextInput
            style={styles.input}
            placeholder="tu@correo.com"
            placeholderTextColor="#999"
            value={form.email}
            onChangeText={(text) => handleChange("email", text)}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <Text style={styles.label}>Contraseña</Text>
          <TextInput
            style={styles.input}
            placeholder="Mínimo 8 caracteres"
            placeholderTextColor="#999"
            value={form.password}
            onChangeText={(text) => handleChange("password", text)}
            secureTextEntry
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#1a0f00" />
            ) : (
              <Text style={styles.buttonText}>
                {form.role === "barber"
                  ? "Crear cuenta de barbero"
                  : "Crear cuenta"}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backLink}
          >
            <Ionicons name="arrow-back" size={20} color="#888" />
            <Text style={styles.backText}>Ya tengo cuenta</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f0f0f" },
  scroll: { flexGrow: 1, padding: 24, paddingTop: 60 },
  title: { fontSize: 28, fontWeight: "700", color: "#fff", marginBottom: 6 },
  subtitle: { fontSize: 14, color: "#888", marginBottom: 24 },

  roleRow: { flexDirection: "row", gap: 12, marginBottom: 28 },
  roleCard: {
    flex: 1,
    backgroundColor: "#1e1e1e",
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#2a2a2a",
  },
  roleCardActive: { borderColor: "#D4A853", backgroundColor: "#1e1a10" },
  roleEmoji: { fontSize: 28, marginBottom: 8 },
  roleLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#aaa",
    marginBottom: 4,
  },
  roleLabelActive: { color: "#D4A853" },
  roleDesc: { fontSize: 11, color: "#666", textAlign: "center" },

  form: { gap: 8 },
  label: { fontSize: 13, color: "#aaa", marginBottom: 4, marginTop: 8 },
  input: {
    backgroundColor: "#1e1e1e",
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: "#fff",
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  button: {
    backgroundColor: "#D4A853",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 20,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: "#1a0f00", fontSize: 16, fontWeight: "600" },
  backLink: {
    alignItems: "center",
    marginTop: 16,
    flexDirection: "row",
    gap: 6,
    justifyContent: "center",
  },
  backText: { color: "#888", fontSize: 14 },
});

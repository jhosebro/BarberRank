// FIXME: Solucionar Placeholder negro
// TODO: FeedBack Visual (No usar Alert)
// TODO: Animaciones

import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Link, router } from "expo-router";
import { Formik } from "formik";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import * as Yup from "yup";
import { useAuth } from "../../hooks/useAuth";

export default function LoginScreen() {
  const { signIn, loading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  const validationSchema = Yup.object({
    email: Yup.string()
      .email("Correo inválido")
      .required("El correo es requerido"),
    password: Yup.string()
      .min(8, "La contraseña debe tener al menos 8 caracteres")
      .required("La contraseña es requerida"),
  });

  type LoginValues = {
    email: string;
    password: string;
  };

  const handleLogin = async (values: LoginValues) => {
    try {
      const res = await signIn(values);
      if (!res?.user) {
        Alert.alert("Error", "Credenciales incorrectas");
        return;
      }
      const role = res.user.user_metadata?.role;
      if (role === "barber") router.replace("/(barber)/planner");
      else if (role === "client") router.replace("/(client)/discovery");
      else router.replace("/");
    } catch (error: unknown) {
      if (error instanceof Error) {
        Alert.alert("Error", error.message);
      } else {
        Alert.alert("Error", "Ocurrió un problema al iniciar sesión");
      }
    }
  };

  return (
    <Formik
      initialValues={{ email: "", password: "" }}
      validationSchema={validationSchema}
      onSubmit={handleLogin}
    >
      {({
        handleChange,
        handleSubmit,
        handleBlur,
        values,
        errors,
        touched,
        isValid,
        dirty,
      }) => (
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.header}>
              <Image
                source={require("../../assets/images/logo.png")}
                style={styles.logo}
              />
              <Text style={styles.title}>BarberRank</Text>
              <Text style={styles.subtitle}>
                Encuentra tu barbero ideal en tu ciudad
              </Text>
            </View>

            <View style={styles.form}>
              <Text style={styles.label}>Correo electrónico</Text>
              <TextInput
                placeholder="tu@correo.com"
                onChangeText={handleChange("email")}
                onBlur={handleBlur("email")}
                keyboardType="email-address"
                value={values.email}
                style={[
                  styles.input,
                  touched.email && errors.email && styles.inputError,
                ]}
                autoCapitalize="none"
                accessible
                accessibilityLabel="Correo electrónico"
                autoComplete="email"
                textContentType="emailAddress"
              />
              {touched.email && errors.email && (
                <Text style={styles.errorText}>{errors.email}</Text>
              )}
              <Text style={styles.label}>Contraseña</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[
                    styles.input,
                    touched.password && errors.password && styles.inputError,
                  ]}
                  placeholder="********"
                  value={values.password}
                  onChangeText={handleChange("password")}
                  secureTextEntry={!showPassword}
                  onBlur={handleBlur("password")}
                  autoCapitalize="none"
                  accessible
                  accessibilityLabel="Contraseña"
                  autoComplete="password"
                  textContentType="password"
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowPassword(!showPassword)}
                  accessible={true}
                  accessibilityLabel={
                    showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                  }
                >
                  <Ionicons
                    name={showPassword ? "eye-off" : "eye"}
                    size={20}
                    color="#aaa"
                  />
                </TouchableOpacity>
              </View>
              {touched.password && errors.password && (
                <Text style={styles.errorText}>{errors.password}</Text>
              )}

              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={() => handleSubmit()}
                disabled={loading || !isValid || !dirty}
                accessible={true}
                accessibilityLabel="Iniciar sesión"
              >
                <LinearGradient
                  colors={["#D4A853", "#b8973e"]}
                  style={[styles.gradient]}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>Ingresar</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              <View style={styles.footer}>
                <Text style={styles.footerText}>¿No tienes cuenta? </Text>
                <Link href="/(auth)/register" asChild>
                  <TouchableOpacity
                    accessible={true}
                    accessibilityLabel="Ir a registro de usuario"
                  >
                    <Text style={styles.link}>Regístrate</Text>
                  </TouchableOpacity>
                </Link>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </Formik>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f0f0f" },
  scroll: { flexGrow: 1, justifyContent: "center", padding: 24 },
  header: { alignItems: "center", marginBottom: 40 },
  logo: { width: 200, height: 200 },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: -0.5,
  },
  subtitle: { fontSize: 14, color: "#888", textAlign: "center", marginTop: 3 },
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
    borderRadius: 12,
    alignItems: "center",
    marginTop: 20,
    overflow: "hidden",
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: "#1a0f00", fontSize: 16, fontWeight: "600" },
  footer: { flexDirection: "row", justifyContent: "center", marginTop: 20 },
  footerText: { color: "#888", fontSize: 14 },
  link: { color: "#D4A853", fontSize: 14, fontWeight: "600" },
  inputError: {
    borderColor: "#ef4444",
    borderWidth: 2,
  },
  errorText: {
    color: "#ef4444",
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
    fontWeight: "500",
  },
  passwordContainer: { position: "relative" },
  eyeIcon: {
    position: "absolute",
    right: 14,
    top: "40%",
    marginTop: -10,
    padding: 5,
  },
  eyeText: { fontSize: 18 },
  gradient: {
    width: "100%",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
  },
});

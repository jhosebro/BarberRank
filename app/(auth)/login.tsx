// TODO: Digitalizar Logo
// TODO: Generar nueva paleta de colores
// TODO: Generar componente Toast global para manejo del feedback
// TODO: Refactorizar para que quede simplificado todo

import { useScaleAnimation } from "@/hooks/animations/useScaleAnimations";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Link, router } from "expo-router";
import { Formik } from "formik";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
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
  const { signIn } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedBack] = useState<{
    type: "error" | "success" | null;
    message: string;
  }>({ type: null, message: "" });
  const [focusedInput, setFocusedInput] = useState<"email" | "password" | null>(
    null,
  );
  const emailAnim = useScaleAnimation();
  const passwordAnim = useScaleAnimation();

  //Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(30)).current;
  const feedbackAnim = useRef(new Animated.Value(0)).current;
  const [showFeedback, setShowFeedback] = useState(false);

  useEffect(() => {
    if (feedback.type) {
      setShowFeedback(true);
    } else {
      setTimeout(() => setShowFeedback(false), 300);
    }
  }, [feedback]);

  useEffect(() => {
    Animated.timing(feedbackAnim, {
      toValue: feedback.type ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [feedback, feedbackAnim]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, translateY]);

  const buttonScale = useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    Animated.spring(buttonScale, {
      toValue: 0.96,
      useNativeDriver: true,
    }).start();
  };

  const onPressOut = () => {
    Animated.spring(buttonScale, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  useEffect(() => {
    if (feedback.type) {
      const timer = setTimeout(() => {
        setFeedBack({ type: null, message: "" });
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [feedback]);

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
    setIsSubmitting(true);
    try {
      const res = await signIn(values);
      if (!res?.user) {
        setFeedBack({
          type: "error",
          message: "Credenciales incorrectas",
        });
        return;
      }

      setFeedBack({ type: "success", message: "Inicio de sesión exitoso" });

      const role = res.user.user_metadata?.role;
      if (role === "barber") router.replace("/(barber)/planner");
      else if (role === "client") router.replace("/(client)/discovery");
      else router.replace("/");
    } catch (error: unknown) {
      setFeedBack({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Ocurrió un problema al iniciar sesión",
      });
    } finally {
      setIsSubmitting(false);
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
        <Animated.View
          style={{ flex: 1, opacity: fadeAnim, transform: [{ translateY }] }}
        >
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
                <Animated.View
                  style={{ transform: [{ scale: emailAnim.scale }] }}
                >
                  <TextInput
                    onFocus={() => {
                      setFocusedInput("email");
                      emailAnim.onFocus();
                    }}
                    onBlur={(e) => {
                      handleBlur("email")(e);
                      setFocusedInput(null);
                      emailAnim.onBlur();
                    }}
                    placeholder="tu@correo.com"
                    placeholderTextColor={"#888"}
                    onChangeText={handleChange("email")}
                    keyboardType="email-address"
                    value={values.email}
                    style={[
                      styles.input,
                      //touched.email && errors.email && styles.inputError
                      focusedInput === "email" && {
                        borderColor: "#D4A853",
                        borderWidth: 2,
                      },
                    ]}
                    autoCapitalize="none"
                    accessible
                    accessibilityLabel="Correo electrónico"
                    autoComplete="email"
                    textContentType="emailAddress"
                  />
                </Animated.View>

                {touched.email && errors.email && (
                  <Text style={styles.errorText}>{errors.email}</Text>
                )}
                <Text style={styles.label}>Contraseña</Text>
                <View style={styles.passwordContainer}>
                  <Animated.View
                    style={{ transform: [{ scale: passwordAnim.scale }] }}
                  >
                    <TextInput
                      onFocus={() => {
                        setFocusedInput("password");
                        passwordAnim.onFocus();
                      }}
                      onBlur={(e) => {
                        handleBlur("password")(e);
                        setFocusedInput(null);
                        passwordAnim.onBlur();
                      }}
                      style={[
                        styles.input,
                        //touched.password && errors.password && styles.inputError,
                        focusedInput === "password" && {
                          borderColor: "#D4A853",
                          borderWidth: 2,
                        },
                      ]}
                      placeholder="********"
                      placeholderTextColor={"#888"}
                      value={values.password}
                      onChangeText={handleChange("password")}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      accessible
                      accessibilityLabel="Contraseña"
                      autoComplete="password"
                      textContentType="password"
                    />
                  </Animated.View>
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
                <Animated.View
                  style={{
                    opacity: feedbackAnim,
                    transform: [
                      {
                        translateY: feedbackAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [-10, 0],
                        }),
                      },
                    ],
                  }}
                >
                  {showFeedback && (
                    <View
                      style={[
                        styles.feedback,
                        feedback.type === "error"
                          ? styles.feedbackError
                          : styles.feedbackSuccess,
                      ]}
                    >
                      <Text style={styles.feedbackText}>
                        {feedback.message}
                      </Text>
                    </View>
                  )}
                </Animated.View>

                <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
                  <TouchableOpacity
                    onPressIn={onPressIn}
                    onPressOut={onPressOut}
                    style={[
                      styles.button,
                      isSubmitting && styles.buttonDisabled,
                    ]}
                    onPress={() => handleSubmit()}
                    disabled={isSubmitting || !isValid || !dirty}
                    accessible={true}
                    accessibilityLabel="Iniciar sesión"
                  >
                    <LinearGradient
                      colors={["#D4A853", "#b8973e"]}
                      style={[styles.gradient]}
                    >
                      {isSubmitting ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <Text style={styles.buttonText}>Ingresar</Text>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </Animated.View>
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
        </Animated.View>
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
  feedback: {
    padding: 12,
    borderRadius: 10,
    marginTop: 10,
  },

  feedbackError: {
    backgroundColor: "#2a1a1a",
    borderColor: "#ef4444",
    borderWidth: 1,
  },

  feedbackSuccess: {
    backgroundColor: "#1a2a1a",
    borderColor: "#22c55e",
    borderWidth: 1,
  },

  feedbackText: {
    color: "#fff",
    fontSize: 13,
    textAlign: "center",
  },
});

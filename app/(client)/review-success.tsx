// app/(client)/review-success.tsx
// Pantalla de confirmación después de enviar una reseña

import { router, useLocalSearchParams } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ReviewSuccessScreen() {
  const { barberName, rating } = useLocalSearchParams<{
    barberName: string;
    rating: string;
  }>();

  const ratingNum = parseInt(rating ?? "5");
  const stars = "★".repeat(ratingNum) + "☆".repeat(5 - ratingNum);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.iconWrap}>
          <Text style={styles.icon}>⭐</Text>
        </View>

        <Text style={styles.title}>¡Gracias por tu reseña!</Text>
        <Text style={styles.stars}>{stars}</Text>
        <Text style={styles.subtitle}>
          Tu opinión sobre {barberName} ya está publicada y ayudará a otros
          clientes a encontrar su barbero ideal.
        </Text>

        <View style={styles.impactCard}>
          <Text style={styles.impactTitle}>Tu reseña ayuda a:</Text>
          <Text style={styles.impactItem}>
            ✓ Mejorar el ranking de {barberName}
          </Text>
          <Text style={styles.impactItem}>
            ✓ Guiar a nuevos clientes en su decisión
          </Text>
          <Text style={styles.impactItem}>✓ Reconocer el buen trabajo</Text>
        </View>

        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => router.replace("/(client)/discovery")}
        >
          <Text style={styles.primaryBtnText}>Explorar más barberos</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => router.replace("/(client)/my-bookings")}
        >
          <Text style={styles.secondaryBtnText}>Ver mis citas</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0f0f0f" },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
  },
  iconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#2a1a00",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  icon: { fontSize: 44 },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#fff",
    textAlign: "center",
    marginBottom: 10,
  },
  stars: { fontSize: 28, color: "#D4A853", letterSpacing: 4, marginBottom: 14 },
  subtitle: {
    fontSize: 14,
    color: "#888",
    textAlign: "center",
    lineHeight: 21,
    marginBottom: 28,
  },
  impactCard: {
    width: "100%",
    backgroundColor: "#1e1e1e",
    borderRadius: 14,
    padding: 16,
    borderWidth: 0.5,
    borderColor: "#2a2a2a",
    marginBottom: 28,
    gap: 8,
  },
  impactTitle: {
    fontSize: 13,
    color: "#aaa",
    fontWeight: "600",
    marginBottom: 4,
  },
  impactItem: { fontSize: 13, color: "#D4A853" },
  primaryBtn: {
    width: "100%",
    backgroundColor: "#D4A853",
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
    marginBottom: 12,
  },
  primaryBtnText: { color: "#1a0f00", fontSize: 16, fontWeight: "700" },
  secondaryBtn: {
    width: "100%",
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  secondaryBtnText: { color: "#aaa", fontSize: 15 },
});

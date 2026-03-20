// app/(client)/booking-success.tsx
// Pantalla de confirmación después de crear la cita

import { router, useLocalSearchParams } from "expo-router";
import {
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export default function BookingSuccessScreen() {
  const { barberName, serviceName, scheduledAt } = useLocalSearchParams<{
    barberName: string;
    serviceName: string;
    scheduledAt: string;
  }>();

  const date = scheduledAt
    ? new Date(scheduledAt).toLocaleDateString("es-CO", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "";

  const time = scheduledAt
    ? new Date(scheduledAt).toLocaleTimeString("es-CO", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Ícono animado */}
        <View style={styles.iconWrap}>
          <Text style={styles.icon}>✅</Text>
        </View>

        <Text style={styles.title}>¡Cita reservada!</Text>
        <Text style={styles.subtitle}>
          Tu solicitud fue enviada. El barbero la confirmará pronto y recibirás
          una notificación.
        </Text>

        {/* Resumen compacto */}
        <View style={styles.summaryCard}>
          <Row label="Barbero" value={barberName ?? ""} />
          <Row label="Servicio" value={serviceName ?? ""} />
          <Row label="Fecha" value={date} />
          <Row label="Hora" value={time} />
          <View style={styles.statusRow}>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>
                ⏳ Pendiente de confirmación
              </Text>
            </View>
          </View>
        </View>

        {/* Acciones */}
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => router.replace("/(client)/discovery")}
        >
          <Text style={styles.primaryBtnText}>Volver al inicio</Text>
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

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue} numberOfLines={2}>
        {value}
      </Text>
    </View>
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
    backgroundColor: "#1a2a1a",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  icon: { fontSize: 44 },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#fff",
    textAlign: "center",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: "#888",
    textAlign: "center",
    lineHeight: 21,
    marginBottom: 28,
  },
  summaryCard: {
    width: "100%",
    backgroundColor: "#1e1e1e",
    borderRadius: 16,
    padding: 16,
    borderWidth: 0.5,
    borderColor: "#2a2a2a",
    marginBottom: 28,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: "#2a2a2a",
  },
  rowLabel: { fontSize: 13, color: "#888" },
  rowValue: {
    fontSize: 13,
    color: "#fff",
    fontWeight: "500",
    flex: 1,
    textAlign: "right",
    marginLeft: 12,
  },
  statusRow: { alignItems: "center", paddingTop: 12 },
  statusBadge: {
    backgroundColor: "#2a2010",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 0.5,
    borderColor: "#D4A853",
  },
  statusText: { fontSize: 12, color: "#D4A853", fontWeight: "600" },
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
    backgroundColor: "transparent",
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  secondaryBtnText: { color: "#aaa", fontSize: 15 },
});

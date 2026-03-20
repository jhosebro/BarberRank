// app/(client)/my-bookings.tsx
// Pantalla "mis citas" — próximas y historial con opción de cancelar

import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  BookingTab,
  MyBooking,
  useMyBookings,
} from "../../hooks/useMyBookings";

// ─── Helpers ──────────────────────────────────────────────
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-CO", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}
function fmtTime(iso: string) {
  const d = new Date(iso);
  const h = d.getHours(),
    m = d.getMinutes();
  const ampm = h >= 12 ? "pm" : "am";
  const h12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}
function fmtPrice(p: number) {
  return `$${p.toLocaleString("es-CO")}`;
}

// ─── Config de estados ────────────────────────────────────
const STATUS_CFG = {
  pending: { label: "Pendiente", bg: "#2a2010", color: "#D4A853" },
  confirmed: { label: "Confirmada", bg: "#0d2a1a", color: "#4caf7d" },
  completed: { label: "Completada", bg: "#1a1a2a", color: "#7B8FD4" },
  cancelled: { label: "Cancelada", bg: "#2a1010", color: "#e06060" },
  no_show: { label: "No asistí", bg: "#221a10", color: "#c08040" },
} as const;

function StatusPill({ status }: { status: keyof typeof STATUS_CFG }) {
  const cfg = STATUS_CFG[status] ?? STATUS_CFG.pending;
  return (
    <View style={[pill.wrap, { backgroundColor: cfg.bg }]}>
      <Text style={[pill.text, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  );
}
const pill = StyleSheet.create({
  wrap: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  text: { fontSize: 11, fontWeight: "600" },
});

// ─── Card de cita ─────────────────────────────────────────
function BookingCard({
  booking,
  canCancel,
  onCancel,
  onRebook,
  onViewBarber,
}: {
  booking: MyBooking;
  canCancel: boolean;
  onCancel: () => void;
  onRebook: () => void;
  onViewBarber: () => void;
}) {
  const barberName = booking.barber?.profile?.full_name ?? "Barbero";
  const initials = barberName
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  const avatarUrl = booking.barber?.profile?.avatar_url;

  return (
    <View style={card.wrap}>
      {/* Franja superior con fecha */}
      <View style={card.dateStrip}>
        <Text style={card.dateText}>
          {fmtDate(booking.scheduled_at)} · {fmtTime(booking.scheduled_at)}
        </Text>
        <StatusPill status={booking.status as keyof typeof STATUS_CFG} />
      </View>

      {/* Cuerpo */}
      <TouchableOpacity
        style={card.body}
        onPress={onViewBarber}
        activeOpacity={0.8}
      >
        {/* Avatar barbero */}
        <View style={card.avatarWrap}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={card.avatar} />
          ) : (
            <View style={[card.avatar, card.avatarFallback]}>
              <Text style={card.avatarInitials}>{initials}</Text>
            </View>
          )}
        </View>

        <View style={{ flex: 1 }}>
          <Text style={card.barberName} numberOfLines={1}>
            {barberName}
          </Text>
          <Text style={card.serviceName} numberOfLines={1}>
            {booking.service?.name ?? "Servicio"} ·{" "}
            {booking.service?.duration_min ?? 0} min
          </Text>
          {booking.barber?.city && (
            <Text style={card.city}>📍 {booking.barber.city}</Text>
          )}
        </View>

        <Text style={card.price}>{fmtPrice(booking.total_price)}</Text>
      </TouchableOpacity>

      {/* Nota */}
      {booking.notes && (
        <View style={card.noteWrap}>
          <Text style={card.noteText} numberOfLines={2}>
            💬 {booking.notes}
          </Text>
        </View>
      )}

      {/* Acciones */}
      <View style={card.actions}>
        {canCancel && (
          <TouchableOpacity style={card.cancelBtn} onPress={onCancel}>
            <Text style={card.cancelBtnText}>Cancelar cita</Text>
          </TouchableOpacity>
        )}
        {(booking.status === "completed" || booking.status === "cancelled") && (
          <TouchableOpacity style={card.rebookBtn} onPress={onRebook}>
            <Text style={card.rebookBtnText}>Reservar de nuevo</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={card.viewBtn} onPress={onViewBarber}>
          <Text style={card.viewBtnText}>Ver barbero →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const card = StyleSheet.create({
  wrap: {
    backgroundColor: "#1e1e1e",
    borderRadius: 16,
    marginBottom: 14,
    borderWidth: 0.5,
    borderColor: "#2a2a2a",
    overflow: "hidden",
  },
  dateStrip: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "#181818",
    borderBottomWidth: 0.5,
    borderBottomColor: "#2a2a2a",
  },
  dateText: { fontSize: 12, color: "#aaa", fontWeight: "500" },
  body: { flexDirection: "row", alignItems: "center", padding: 14, gap: 12 },
  avatarWrap: {},
  avatar: { width: 52, height: 52, borderRadius: 26 },
  avatarFallback: {
    backgroundColor: "#2a2a2a",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitials: { fontSize: 18, fontWeight: "700", color: "#D4A853" },
  barberName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 3,
  },
  serviceName: { fontSize: 12, color: "#888", marginBottom: 2 },
  city: { fontSize: 11, color: "#666" },
  price: { fontSize: 16, fontWeight: "700", color: "#D4A853" },
  noteWrap: {
    paddingHorizontal: 14,
    paddingBottom: 10,
    borderTopWidth: 0.5,
    borderTopColor: "#2a2a2a",
    paddingTop: 8,
    marginTop: -4,
  },
  noteText: { fontSize: 12, color: "#777", lineHeight: 17 },
  actions: {
    flexDirection: "row",
    gap: 8,
    padding: 12,
    borderTopWidth: 0.5,
    borderTopColor: "#2a2a2a",
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: "#2a1010",
    borderWidth: 0.5,
    borderColor: "#e06060",
    alignItems: "center",
  },
  cancelBtnText: { fontSize: 12, color: "#e06060", fontWeight: "600" },
  rebookBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: "#2a1a00",
    borderWidth: 0.5,
    borderColor: "#D4A853",
    alignItems: "center",
  },
  rebookBtnText: { fontSize: 12, color: "#D4A853", fontWeight: "600" },
  viewBtn: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: "#2a2a2a",
    alignItems: "center",
  },
  viewBtnText: { fontSize: 12, color: "#aaa" },
});

// ─── Estado vacío ─────────────────────────────────────────
function EmptyState({ tab }: { tab: BookingTab }) {
  return (
    <View style={empty.wrap}>
      <Text style={empty.icon}>{tab === "upcoming" ? "📅" : "🕐"}</Text>
      <Text style={empty.title}>
        {tab === "upcoming" ? "Sin citas próximas" : "Sin historial aún"}
      </Text>
      <Text style={empty.desc}>
        {tab === "upcoming"
          ? "Explora barberos cerca de ti y reserva tu primera cita."
          : "Tus citas completadas y canceladas aparecerán aquí."}
      </Text>
      {tab === "upcoming" && (
        <TouchableOpacity
          style={empty.btn}
          onPress={() => router.replace("/(client)/discovery")}
        >
          <Text style={empty.btnText}>Explorar barberos</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
const empty = StyleSheet.create({
  wrap: { alignItems: "center", paddingTop: 60, paddingHorizontal: 32 },
  icon: { fontSize: 48, marginBottom: 16 },
  title: { fontSize: 18, fontWeight: "600", color: "#fff", marginBottom: 8 },
  desc: { fontSize: 14, color: "#666", textAlign: "center", lineHeight: 20 },
  btn: {
    marginTop: 20,
    backgroundColor: "#D4A853",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  btnText: { color: "#1a0f00", fontWeight: "600", fontSize: 14 },
});

// ─── Pantalla principal ───────────────────────────────────
export default function MyBookingsScreen() {
  const [activeTab, setActiveTab] = useState<BookingTab>("upcoming");
  const { upcoming, history, loading, cancelBooking } = useMyBookings();

  const handleCancel = (booking: MyBooking) => {
    Alert.alert(
      "Cancelar cita",
      `¿Seguro que quieres cancelar tu cita del ${fmtDate(booking.scheduled_at)} a las ${fmtTime(booking.scheduled_at)}?`,
      [
        { text: "No, mantener", style: "cancel" },
        {
          text: "Sí, cancelar",
          style: "destructive",
          onPress: async () => {
            const ok = await cancelBooking(booking.id);
            if (!ok) Alert.alert("Error", "No se pudo cancelar la cita.");
          },
        },
      ],
    );
  };

  const handleRebook = (booking: MyBooking) => {
    if (!booking.barber?.id) return;
    router.push({
      pathname: "/(client)/barber-profile",
      params: { id: booking.barber.id },
    });
  };

  const handleViewBarber = (booking: MyBooking) => {
    if (!booking.barber?.id) return;
    router.push({
      pathname: "/(client)/barber-profile",
      params: { id: booking.barber.id },
    });
  };

  const displayData = activeTab === "upcoming" ? upcoming : history;

  return (
    <SafeAreaView style={styles.safe}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Mis citas</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* ── Tabs ── */}
      <View style={styles.tabBar}>
        {(["upcoming", "history"] as BookingTab[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tab && styles.tabTextActive,
              ]}
            >
              {tab === "upcoming"
                ? `Próximas${upcoming.length > 0 ? ` (${upcoming.length})` : ""}`
                : "Historial"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Contenido ── */}
      {loading ? (
        <ActivityIndicator color="#D4A853" style={{ marginTop: 40 }} />
      ) : displayData.length === 0 ? (
        <EmptyState tab={activeTab} />
      ) : (
        <ScrollView
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        >
          {displayData.map((booking) => (
            <BookingCard
              key={booking.id}
              booking={booking}
              canCancel={
                activeTab === "upcoming" &&
                (booking.status === "pending" || booking.status === "confirmed")
              }
              onCancel={() => handleCancel(booking)}
              onRebook={() => handleRebook(booking)}
              onViewBarber={() => handleViewBarber(booking)}
            />
          ))}
          <View style={{ height: 32 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0f0f0f" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: "#1e1e1e",
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  backText: { fontSize: 22, color: "#fff" },
  title: { fontSize: 17, fontWeight: "600", color: "#fff" },
  tabBar: {
    flexDirection: "row",
    margin: 16,
    backgroundColor: "#1e1e1e",
    borderRadius: 12,
    padding: 4,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 9,
    alignItems: "center",
  },
  tabBtnActive: { backgroundColor: "#D4A853" },
  tabText: { fontSize: 13, color: "#888", fontWeight: "500" },
  tabTextActive: { color: "#1a0f00", fontWeight: "700" },
  list: { paddingHorizontal: 16, paddingTop: 4 },
});

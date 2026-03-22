// app/(barber)/planner.tsx
// Agenda del barbero — navegación por días, lista de citas, acciones y detalle del cliente

import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../hooks/useAuth";
import {
  BarberBooking,
  BookingStatus,
  useBarberBookings,
} from "../../hooks/useBarberBookings";

// ─── Helpers ──────────────────────────────────────────────
const DAY_NAMES = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];
const DAY_SHORT = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const MONTH_SHORT = [
  "Ene",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
  "Ago",
  "Sep",
  "Oct",
  "Nov",
  "Dic",
];

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

// ─── Badge de estado ──────────────────────────────────────
const STATUS_CONFIG: Record<
  BookingStatus,
  { label: string; bg: string; text: string }
> = {
  pending: { label: "Pendiente", bg: "#2a2010", text: "#D4A853" },
  confirmed: { label: "Confirmada", bg: "#0d2a1a", text: "#4caf7d" },
  completed: { label: "Completada", bg: "#1a1a2a", text: "#7B8FD4" },
  cancelled: { label: "Cancelada", bg: "#2a1010", text: "#e06060" },
  no_show: { label: "No asistió", bg: "#221a10", text: "#c08040" },
};

function StatusBadge({ status }: { status: BookingStatus }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  return (
    <View style={[badge.wrap, { backgroundColor: cfg.bg }]}>
      <Text style={[badge.text, { color: cfg.text }]}>{cfg.label}</Text>
    </View>
  );
}
const badge = StyleSheet.create({
  wrap: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  text: { fontSize: 11, fontWeight: "600" },
});

// ─── Navegador de días (scroll horizontal) ────────────────
function DayNavigator({
  selected,
  onSelect,
}: {
  selected: Date;
  onSelect: (d: Date) => void;
}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Genera 14 días: 2 atrás + hoy + 11 adelante
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - 2 + i);
    return d;
  });

  return (
    <View style={nav.wrap}>
      <Text style={nav.monthLabel}>
        {DAY_NAMES[selected.getDay()]}, {selected.getDate()}{" "}
        {MONTH_SHORT[selected.getMonth()]} {selected.getFullYear()}
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={nav.row}
      >
        {days.map((d, i) => {
          const isSelected = d.toDateString() === selected.toDateString();
          const isToday = d.toDateString() === today.toDateString();
          const isPast = d < today;
          return (
            <TouchableOpacity
              key={i}
              style={[
                nav.day,
                isSelected && nav.daySelected,
                isPast && nav.dayPast,
              ]}
              onPress={() => onSelect(d)}
            >
              <Text
                style={[
                  nav.dayName,
                  isSelected && nav.dayTextSelected,
                  isPast && nav.dayTextPast,
                ]}
              >
                {DAY_SHORT[d.getDay()]}
              </Text>
              <Text
                style={[
                  nav.dayNum,
                  isSelected && nav.dayTextSelected,
                  isPast && nav.dayTextPast,
                ]}
              >
                {d.getDate()}
              </Text>
              {isToday && !isSelected && <View style={nav.todayDot} />}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}
const nav = StyleSheet.create({
  wrap: {
    borderBottomWidth: 0.5,
    borderBottomColor: "#1e1e1e",
    paddingBottom: 12,
  },
  monthLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 10,
  },
  row: { paddingHorizontal: 16, gap: 6 },
  day: {
    width: 46,
    alignItems: "center",
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "#1e1e1e",
    borderWidth: 0.5,
    borderColor: "#2a2a2a",
  },
  daySelected: { backgroundColor: "#D4A853", borderColor: "#D4A853" },
  dayPast: { opacity: 0.4 },
  dayName: { fontSize: 10, color: "#888", fontWeight: "600", marginBottom: 3 },
  dayNum: { fontSize: 16, color: "#fff", fontWeight: "700" },
  dayTextSelected: { color: "#1a0f00" },
  dayTextPast: { color: "#555" },
  todayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#D4A853",
    marginTop: 3,
  },
});

// ─── Stats del día ────────────────────────────────────────
function DayStats({
  stats,
}: {
  stats: ReturnType<typeof useBarberBookings>["stats"];
}) {
  return (
    <View style={st.row}>
      <View style={st.card}>
        <Text style={st.num}>{stats.total}</Text>
        <Text style={st.label}>Total</Text>
      </View>
      <View style={st.card}>
        <Text style={[st.num, { color: "#D4A853" }]}>{stats.pending}</Text>
        <Text style={st.label}>Pendientes</Text>
      </View>
      <View style={st.card}>
        <Text style={[st.num, { color: "#4caf7d" }]}>{stats.confirmed}</Text>
        <Text style={st.label}>Confirmadas</Text>
      </View>
      <View style={st.card}>
        <Text style={[st.num, { color: "#7B8FD4" }]}>
          {fmtPrice(stats.revenue)}
        </Text>
        <Text style={st.label}>Ingresos</Text>
      </View>
    </View>
  );
}
const st = StyleSheet.create({
  row: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 10,
    paddingVertical: 14,
  },
  card: {
    flex: 1,
    backgroundColor: "#1e1e1e",
    borderRadius: 12,
    padding: 10,
    alignItems: "center",
    borderWidth: 0.5,
    borderColor: "#2a2a2a",
  },
  num: { fontSize: 16, fontWeight: "700", color: "#fff", marginBottom: 2 },
  label: { fontSize: 10, color: "#666" },
});

// ─── Modal detalle del cliente ────────────────────────────
function ClientModal({
  booking,
  onClose,
  onAction,
}: {
  booking: BarberBooking;
  onClose: () => void;
  onAction: (status: BookingStatus) => void;
}) {
  const client = booking.client;
  const name = client?.full_name ?? "Cliente";
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  const cfg = STATUS_CONFIG[booking.status];

  return (
    <View style={cm.sheet}>
      <View style={cm.handle} />

      {/* Avatar */}
      <View style={cm.avatarWrap}>
        {client?.avatar_url ? (
          <Image source={{ uri: client.avatar_url }} style={cm.avatar} />
        ) : (
          <View style={[cm.avatar, cm.avatarFallback]}>
            <Text style={cm.avatarInitials}>{initials}</Text>
          </View>
        )}
      </View>

      <Text style={cm.name}>{name}</Text>
      {client?.phone && <Text style={cm.phone}>📞 {client.phone}</Text>}

      {/* Detalles de la cita */}
      <View style={cm.detailCard}>
        <CRow label="Servicio" value={booking.service?.name ?? "—"} />
        <CRow
          label="Hora"
          value={`${fmtTime(booking.scheduled_at)} - ${fmtTime(booking.ends_at)}`}
        />
        <CRow
          label="Duración"
          value={`${booking.service?.duration_min ?? 0} min`}
        />
        <CRow label="Total" value={fmtPrice(booking.total_price)} accent />
        <View style={cm.statusRow}>
          <Text style={cm.rowLabel}>Estado</Text>
          <StatusBadge status={booking.status} />
        </View>
      </View>

      {/* Nota del cliente */}
      {booking.notes && (
        <View style={cm.noteCard}>
          <Text style={cm.noteTitle}>Nota del cliente</Text>
          <Text style={cm.noteText}>{booking.notes}</Text>
        </View>
      )}

      {/* Acciones según estado */}
      <View style={cm.actions}>
        {booking.status === "pending" && (
          <>
            <TouchableOpacity
              style={[cm.btn, cm.btnConfirm]}
              onPress={() => onAction("confirmed")}
            >
              <Text style={cm.btnConfirmText}>✓ Aceptar cita</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[cm.btn, cm.btnCancel]}
              onPress={() => onAction("cancelled")}
            >
              <Text style={cm.btnCancelText}>✕ Rechazar</Text>
            </TouchableOpacity>
          </>
        )}
        {booking.status === "confirmed" && (
          <>
            <TouchableOpacity
              style={[cm.btn, cm.btnComplete]}
              onPress={() => onAction("completed")}
            >
              <Text style={cm.btnCompleteText}>★ Marcar completada</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[cm.btn, cm.btnCancel]}
              onPress={() => onAction("no_show")}
            >
              <Text style={cm.btnCancelText}>No asistió</Text>
            </TouchableOpacity>
          </>
        )}
        {(booking.status === "completed" ||
          booking.status === "cancelled" ||
          booking.status === "no_show") && (
          <View style={cm.finalState}>
            <Text style={[cm.finalText, { color: cfg.text }]}>
              Cita {cfg.label.toLowerCase()}
            </Text>
          </View>
        )}
      </View>

      <TouchableOpacity style={cm.closeBtn} onPress={onClose}>
        <Text style={cm.closeBtnText}>Cerrar</Text>
      </TouchableOpacity>
    </View>
  );
}

function CRow({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <View style={cm.row}>
      <Text style={cm.rowLabel}>{label}</Text>
      <Text style={[cm.rowValue, accent && cm.rowValueAccent]}>{value}</Text>
    </View>
  );
}
const cm = StyleSheet.create({
  sheet: {
    backgroundColor: "#181818",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 36,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: "#333",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 20,
  },
  avatarWrap: { alignItems: "center", marginBottom: 12 },
  avatar: { width: 80, height: 80, borderRadius: 40 },
  avatarFallback: {
    backgroundColor: "#2a2a2a",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitials: { fontSize: 28, fontWeight: "700", color: "#D4A853" },
  name: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
    textAlign: "center",
    marginBottom: 4,
  },
  phone: { fontSize: 13, color: "#888", textAlign: "center", marginBottom: 16 },
  detailCard: {
    backgroundColor: "#222",
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 0.5,
    borderColor: "#2a2a2a",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 7,
    borderBottomWidth: 0.5,
    borderBottomColor: "#2a2a2a",
  },
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 7,
  },
  rowLabel: { fontSize: 13, color: "#888" },
  rowValue: { fontSize: 13, color: "#fff", fontWeight: "500" },
  rowValueAccent: { color: "#D4A853", fontWeight: "700", fontSize: 15 },
  noteCard: {
    backgroundColor: "#1a1a10",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 0.5,
    borderColor: "#3a3010",
  },
  noteTitle: {
    fontSize: 11,
    color: "#886633",
    fontWeight: "600",
    marginBottom: 6,
  },
  noteText: { fontSize: 13, color: "#ccc", lineHeight: 19 },
  actions: { gap: 10, marginBottom: 16 },
  btn: { borderRadius: 12, padding: 14, alignItems: "center" },
  btnConfirm: {
    backgroundColor: "#0d3a1a",
    borderWidth: 1,
    borderColor: "#4caf7d",
  },
  btnConfirmText: { color: "#4caf7d", fontSize: 15, fontWeight: "700" },
  btnComplete: {
    backgroundColor: "#1a1a2a",
    borderWidth: 1,
    borderColor: "#7B8FD4",
  },
  btnCompleteText: { color: "#7B8FD4", fontSize: 15, fontWeight: "700" },
  btnCancel: {
    backgroundColor: "#2a1010",
    borderWidth: 1,
    borderColor: "#e06060",
  },
  btnCancelText: { color: "#e06060", fontSize: 15, fontWeight: "600" },
  finalState: { alignItems: "center", paddingVertical: 12 },
  finalText: { fontSize: 15, fontWeight: "600" },
  closeBtn: {
    backgroundColor: "#1e1e1e",
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
  },
  closeBtnText: { color: "#888", fontSize: 15 },
});

// ─── Fila de cita en la lista ─────────────────────────────
function BookingRow({
  booking,
  onPress,
}: {
  booking: BarberBooking;
  onPress: () => void;
}) {
  const name = booking.client?.full_name ?? "Cliente";
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  const isPast = new Date(booking.ends_at) < new Date();

  return (
    <TouchableOpacity
      style={[row.wrap, isPast && row.wrapPast]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {/* Línea de tiempo */}
      <View style={row.timeline}>
        <Text style={row.timeStart}>{fmtTime(booking.scheduled_at)}</Text>
        <View style={row.timeBar} />
        <Text style={row.timeEnd}>{fmtTime(booking.ends_at)}</Text>
      </View>

      {/* Card */}
      <View style={row.card}>
        <View style={row.cardTop}>
          {/* Avatar */}
          <View style={row.avatarWrap}>
            {booking.client?.avatar_url ? (
              <Image
                source={{ uri: booking.client.avatar_url }}
                style={row.avatar}
              />
            ) : (
              <View style={[row.avatar, row.avatarFallback]}>
                <Text style={row.avatarInitials}>{initials}</Text>
              </View>
            )}
          </View>

          <View style={{ flex: 1 }}>
            <Text style={row.clientName} numberOfLines={1}>
              {name}
            </Text>
            <Text style={row.serviceName} numberOfLines={1}>
              {booking.service?.name ?? "Servicio"} ·{" "}
              {booking.service?.duration_min ?? 0} min
            </Text>
          </View>

          <View style={row.right}>
            <Text style={row.price}>{fmtPrice(booking.total_price)}</Text>
            <StatusBadge status={booking.status} />
          </View>
        </View>

        {/* Nota previa del cliente */}
        {booking.notes && (
          <View style={row.noteWrap}>
            <Text style={row.noteText} numberOfLines={1}>
              💬 {booking.notes}
            </Text>
          </View>
        )}

        {/* Acciones rápidas para pendientes */}
        {booking.status === "pending" && (
          <View style={row.quickActions}>
            <Text style={row.quickHint}>
              Toca para aceptar o rechazar{" "}
              <Ionicons name="arrow-forward-outline"></Ionicons>
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}
const row = StyleSheet.create({
  wrap: { flexDirection: "row", gap: 10, marginBottom: 12 },
  wrapPast: { opacity: 0.55 },
  timeline: { width: 52, alignItems: "center", paddingTop: 4 },
  timeStart: {
    fontSize: 11,
    color: "#aaa",
    fontWeight: "600",
    textAlign: "center",
  },
  timeBar: {
    flex: 1,
    width: 2,
    backgroundColor: "#2a2a2a",
    borderRadius: 1,
    marginVertical: 4,
    minHeight: 20,
  },
  timeEnd: { fontSize: 10, color: "#555", textAlign: "center" },
  card: {
    flex: 1,
    backgroundColor: "#1e1e1e",
    borderRadius: 14,
    padding: 12,
    borderWidth: 0.5,
    borderColor: "#2a2a2a",
  },
  cardTop: { flexDirection: "row", alignItems: "center", gap: 10 },
  avatarWrap: {},
  avatar: { width: 40, height: 40, borderRadius: 20 },
  avatarFallback: {
    backgroundColor: "#2a2a2a",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitials: { fontSize: 14, fontWeight: "700", color: "#D4A853" },
  clientName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 2,
  },
  serviceName: { fontSize: 12, color: "#888" },
  right: { alignItems: "flex-end", gap: 4 },
  price: { fontSize: 14, fontWeight: "700", color: "#D4A853" },
  noteWrap: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 0.5,
    borderTopColor: "#2a2a2a",
  },
  noteText: { fontSize: 12, color: "#777" },
  quickActions: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 0.5,
    borderTopColor: "#2a2a2a",
  },
  quickHint: { fontSize: 11, color: "#D4A853", textAlign: "right" },
});

// ─── Pantalla principal ───────────────────────────────────
export default function PlannerScreen() {
  const { profile, signOut } = useAuth();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedBooking, setSelectedBooking] = useState<BarberBooking | null>(
    null,
  );

  const { bookings, loading, stats, updateStatus } =
    useBarberBookings(selectedDate);

  useEffect(() => {
    if (!selectedBooking) return;
    console.log("🔍 buscando en bookings:", selectedBooking.id.slice(0, 8));
    const updated = bookings.find((b) => b.id === selectedBooking.id);
    console.log("✅ encontrado:", updated?.status);
    if (updated) setSelectedBooking(updated);
  }, [bookings, selectedBooking]);

  const handleAction = async (status: BookingStatus) => {
    if (!selectedBooking) return;

    const labels: Record<string, string> = {
      confirmed: "aceptar",
      cancelled: "rechazar",
      completed: "marcar como completada",
      no_show: "marcar como no asistió",
    };

    Alert.alert(
      "Confirmar acción",
      `¿Seguro que quieres ${labels[status] ?? status} esta cita?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Confirmar",
          style: status === "cancelled" ? "destructive" : "default",
          onPress: async () => {
            const ok = await updateStatus(selectedBooking.id, status);
            if (ok) setSelectedBooking(null);
            else Alert.alert("Error", "No se pudo actualizar la cita.");
          },
        },
      ],
    );
  };

  const pendingCount = stats.pending;

  return (
    <SafeAreaView style={styles.safe}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Mi agenda</Text>
          <Text style={styles.headerSub}>
            {profile?.full_name?.split(" ")[0] ?? "Barbero"}
            {pendingCount > 0 && (
              <Text style={styles.pendingAlert}>
                {" "}
                · {pendingCount} pendiente{pendingCount > 1 ? "s" : ""}
              </Text>
            )}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={() => router.push("/(barber)/onboarding")}
        >
          <Text style={{ color: "#D4A853", fontSize: 13 }}>
            Configurar perfil
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={signOut} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Salir</Text>
        </TouchableOpacity>
      </View>

      {/* ── Navegador de días ── */}
      <DayNavigator selected={selectedDate} onSelect={setSelectedDate} />

      {/* ── Stats ── */}
      <DayStats stats={stats} />

      {/* ── Lista de citas ── */}
      {loading ? (
        <ActivityIndicator color="#D4A853" style={{ marginTop: 40 }} />
      ) : bookings.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>📅</Text>
          <Text style={styles.emptyTitle}>Sin citas este día</Text>
          <Text style={styles.emptyText}>
            No tienes citas programadas para este día.
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        >
          {/* Separador de citas por estado */}
          {pendingCount > 0 && (
            <View style={styles.sectionHeader}>
              <View style={styles.sectionDot} />
              <Text style={styles.sectionTitle}>
                Por confirmar ({pendingCount})
              </Text>
            </View>
          )}
          {bookings
            .filter((b) => b.status === "pending")
            .map((b) => (
              <BookingRow
                key={b.id}
                booking={b}
                onPress={() => setSelectedBooking(b)}
              />
            ))}

          {bookings.filter((b) => b.status !== "pending").length > 0 && (
            <View style={styles.sectionHeader}>
              <View
                style={[styles.sectionDot, { backgroundColor: "#4caf7d" }]}
              />
              <Text style={styles.sectionTitle}>Resto del día</Text>
            </View>
          )}
          {bookings
            .filter((b) => b.status !== "pending")
            .map((b) => (
              <BookingRow
                key={b.id}
                booking={b}
                onPress={() => setSelectedBooking(b)}
              />
            ))}

          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {/* ── Modal detalle ── */}
      <Modal
        visible={!!selectedBooking}
        animationType="slide"
        transparent
        onRequestClose={() => setSelectedBooking(null)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setSelectedBooking(null)}
        >
          <Pressable style={{ width: "100%" }} onPress={() => {}}>
            {selectedBooking && (
              <ClientModal
                booking={selectedBooking}
                onClose={() => setSelectedBooking(null)}
                onAction={handleAction}
              />
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Estilos ──────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0f0f0f" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 4,
  },
  headerTitle: { fontSize: 24, fontWeight: "700", color: "#fff" },
  headerSub: { fontSize: 13, color: "#888", marginTop: 2 },
  pendingAlert: { color: "#D4A853", fontWeight: "600" },
  logoutBtn: { padding: 8 },
  logoutText: { color: "#666", fontSize: 13 },
  list: { paddingHorizontal: 20, paddingTop: 4 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
    marginTop: 4,
  },
  sectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#D4A853",
  },
  sectionTitle: {
    fontSize: 12,
    color: "#666",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
  },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 8,
  },
  emptyText: { fontSize: 14, color: "#666", textAlign: "center" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
    alignItems: "center",
  },
});

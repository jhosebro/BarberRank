// app/(client)/booking.tsx
// Flujo de reserva en 3 pasos: fecha → hora → resumen + confirmación

import { notifyBookingChange } from "@/lib/notifications";
import { router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../../hooks/useAuth";
import { useBarberProfile } from "../../hooks/useBarberProfile";
import { TimeSlot, useBookingSlots } from "../../hooks/useBookingSlots";
import { supabase } from "../../lib/supabase";

// ─── Helpers ──────────────────────────────────────────────
const MONTH_NAMES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];
const DAY_NAMES_SHORT = ["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sá"];

function buildCalendarWeeks(year: number, month: number) {
  const first = new Date(year, month, 1).getDay();
  const days = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(first).fill(null),
    ...Array.from({ length: days }, (_, i) => i + 1),
  ];
  const weeks: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }
  return weeks;
}

// ─── Componente: indicador de pasos ───────────────────────
function StepIndicator({ step }: { step: number }) {
  const steps = ["Fecha", "Hora", "Confirmar"];
  return (
    <View style={si.row}>
      {steps.map((label, i) => {
        const idx = i + 1;
        const active = step === idx;
        const done = step > idx;
        return (
          <View key={i} style={si.item}>
            <View
              style={[
                si.circle,
                active && si.circleActive,
                done && si.circleDone,
              ]}
            >
              <Text
                style={[si.circleText, (active || done) && si.circleTextActive]}
              >
                {done ? "✓" : String(idx)}
              </Text>
            </View>
            <Text style={[si.label, active && si.labelActive]}>{label}</Text>
            {i < steps.length - 1 && (
              <View style={[si.line, done && si.lineDone]} />
            )}
          </View>
        );
      })}
    </View>
  );
}
const si = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 0,
    paddingVertical: 20,
  },
  item: { flexDirection: "row", alignItems: "center", gap: 6 },
  circle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#333",
    alignItems: "center",
    justifyContent: "center",
  },
  circleActive: { borderColor: "#D4A853", backgroundColor: "#D4A853" },
  circleDone: { borderColor: "#D4A853", backgroundColor: "transparent" },
  circleText: { fontSize: 12, color: "#555", fontWeight: "600" },
  circleTextActive: { color: "#D4A853" },
  label: { fontSize: 12, color: "#555" },
  labelActive: { color: "#D4A853", fontWeight: "600" },
  line: {
    width: 28,
    height: 1.5,
    backgroundColor: "#333",
    marginHorizontal: 4,
  },
  lineDone: { backgroundColor: "#D4A853" },
});

// ─── Paso 1: Selección de fecha ───────────────────────────
function StepDate({
  selected,
  onSelect,
}: {
  selected: Date | null;
  onSelect: (d: Date) => void;
}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const weeks = useMemo(
    () => buildCalendarWeeks(viewYear, viewMonth),
    [viewYear, viewMonth],
  );

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else setViewMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else setViewMonth((m) => m + 1);
  };

  // No permitir navegar al mes anterior al actual
  const canGoPrev =
    viewYear > today.getFullYear() ||
    (viewYear === today.getFullYear() && viewMonth > today.getMonth());

  return (
    <View style={styles.stepWrap}>
      <Text style={styles.stepTitle}>¿Qué día quieres ir?</Text>

      {/* Navegación de mes */}
      <View style={cal.navRow}>
        <TouchableOpacity
          onPress={prevMonth}
          disabled={!canGoPrev}
          style={cal.navBtn}
        >
          <Text style={[cal.navArrow, !canGoPrev && cal.navArrowDisabled]}>
            ‹
          </Text>
        </TouchableOpacity>
        <Text style={cal.monthLabel}>
          {MONTH_NAMES[viewMonth]} {viewYear}
        </Text>
        <TouchableOpacity onPress={nextMonth} style={cal.navBtn}>
          <Text style={cal.navArrow}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Cabecera días */}
      <View style={cal.headerRow}>
        {DAY_NAMES_SHORT.map((d) => (
          <Text key={d} style={cal.headerCell}>
            {d}
          </Text>
        ))}
      </View>

      {/* Semanas */}
      {weeks.map((week, wi) => (
        <View key={wi} style={cal.weekRow}>
          {week.map((day, di) => {
            if (!day) return <View key={di} style={cal.cell} />;

            const date = new Date(viewYear, viewMonth, day);
            const isPast = date < today;
            const isToday = date.getTime() === today.getTime();
            const isSel = selected?.toDateString() === date.toDateString();

            return (
              <TouchableOpacity
                key={di}
                style={[
                  cal.cell,
                  isToday && cal.cellToday,
                  isSel && cal.cellSelected,
                  isPast && cal.cellPast,
                ]}
                onPress={() => !isPast && onSelect(date)}
                disabled={isPast}
              >
                <Text
                  style={[
                    cal.cellText,
                    isToday && cal.cellTextToday,
                    isSel && cal.cellTextSelected,
                    isPast && cal.cellTextPast,
                  ]}
                >
                  {day}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </View>
  );
}
const cal = StyleSheet.create({
  navRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  navBtn: { padding: 8 },
  navArrow: { fontSize: 24, color: "#fff", fontWeight: "300" },
  navArrowDisabled: { color: "#444" },
  monthLabel: { fontSize: 16, fontWeight: "600", color: "#fff" },
  headerRow: { flexDirection: "row", marginBottom: 6 },
  headerCell: {
    flex: 1,
    textAlign: "center",
    fontSize: 12,
    color: "#666",
    fontWeight: "600",
  },
  weekRow: { flexDirection: "row", marginBottom: 4 },
  cell: {
    flex: 1,
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
  },
  cellToday: { borderWidth: 1.5, borderColor: "#D4A853" },
  cellSelected: { backgroundColor: "#D4A853" },
  cellPast: { opacity: 0.25 },
  cellText: { fontSize: 14, color: "#fff" },
  cellTextToday: { color: "#D4A853", fontWeight: "600" },
  cellTextSelected: { color: "#1a0f00", fontWeight: "700" },
  cellTextPast: { color: "#555" },
});

// ─── Paso 2: Selección de hora ────────────────────────────
function StepTime({
  date,
  slots,
  loadingSlots,
  selected,
  onSelect,
}: {
  date: Date;
  slots: TimeSlot[];
  loadingSlots: boolean;
  selected: TimeSlot | null;
  onSelect: (s: TimeSlot) => void;
}) {
  const dateStr = date.toLocaleDateString("es-CO", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <View style={styles.stepWrap}>
      <Text style={styles.stepTitle}>¿A qué hora?</Text>
      <Text style={styles.stepSub}>{dateStr}</Text>

      {loadingSlots ? (
        <ActivityIndicator color="#D4A853" style={{ marginTop: 40 }} />
      ) : slots.length === 0 ? (
        <View style={styles.noSlots}>
          <Text style={styles.noSlotsIcon}>😕</Text>
          <Text style={styles.noSlotsText}>
            No hay horarios disponibles este día.
          </Text>
          <Text style={styles.noSlotsSub}>Prueba con otra fecha.</Text>
        </View>
      ) : (
        <View style={time.grid}>
          {slots.map((s) => (
            <TouchableOpacity
              key={s.time}
              style={[
                time.slot,
                !s.available && time.slotTaken,
                selected?.time === s.time && time.slotSelected,
              ]}
              onPress={() => s.available && onSelect(s)}
              disabled={!s.available}
            >
              <Text
                style={[
                  time.slotText,
                  !s.available && time.slotTextTaken,
                  selected?.time === s.time && time.slotTextSelected,
                ]}
              >
                {s.label}
              </Text>
              {!s.available && <Text style={time.takenLabel}>Ocupado</Text>}
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}
const time = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 8 },
  slot: {
    width: "22%",
    backgroundColor: "#1e1e1e",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  slotTaken: { opacity: 0.35, borderStyle: "dashed" },
  slotSelected: { backgroundColor: "#D4A853", borderColor: "#D4A853" },
  slotText: { fontSize: 13, color: "#ccc", fontWeight: "500" },
  slotTextTaken: { color: "#555", textDecorationLine: "line-through" },
  slotTextSelected: { color: "#1a0f00", fontWeight: "700" },
  takenLabel: { fontSize: 9, color: "#555", marginTop: 2 },
});

// ─── Paso 3: Resumen + nota + confirmar ───────────────────
function StepSummary({
  barberName,
  serviceName,
  servicePrice,
  date,
  slot,
  note,
  onNoteChange,
  onConfirm,
  loading,
}: {
  barberName: string;
  serviceName: string;
  servicePrice: number;
  date: Date;
  slot: TimeSlot;
  note: string;
  onNoteChange: (t: string) => void;
  onConfirm: () => void;
  loading: boolean;
}) {
  const dateStr = date.toLocaleDateString("es-CO", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <View style={styles.stepWrap}>
      <Text style={styles.stepTitle}>Resumen de tu cita</Text>

      {/* Card resumen */}
      <View style={sum.card}>
        <SumRow icon="✂️" label="Barbero" value={barberName} />
        <SumRow icon="💈" label="Servicio" value={serviceName} />
        <SumRow icon="📅" label="Fecha" value={dateStr} />
        <SumRow icon="🕐" label="Hora" value={slot.label} />
        <View style={sum.divider} />
        <View style={sum.totalRow}>
          <Text style={sum.totalLabel}>Total</Text>
          <Text style={sum.totalValue}>
            ${servicePrice.toLocaleString("es-CO")}
          </Text>
        </View>
      </View>

      {/* Estado de pago — Wompi */}
      <View style={sum.payCard}>
        <Text style={sum.payTitle}>💳 Pago</Text>
        <Text style={sum.payDesc}>
          El pago se procesará a través de Wompi al confirmar la cita. Tu cita
          quedará en estado{" "}
          <Text style={{ color: "#D4A853", fontWeight: "600" }}>pendiente</Text>{" "}
          hasta que el barbero la confirme.
        </Text>
        {/* FUTURE-FEAT: integrar SDK de Wompi aquí */}
        <View style={sum.wompiPlaceholder}>
          <Text style={sum.wompiText}>Integración Wompi — próximamente</Text>
        </View>
      </View>

      {/* Nota para el barbero */}
      <Text style={sum.noteLabel}>Nota para el barbero (opcional)</Text>
      <TextInput
        style={sum.noteInput}
        placeholder="Ej: quiero degradado bajo, traigo referencia..."
        placeholderTextColor="#555"
        value={note}
        onChangeText={onNoteChange}
        multiline
        numberOfLines={3}
        maxLength={200}
      />
      <Text style={sum.noteCount}>{note.length}/200</Text>

      {/* Botón confirmar */}
      <TouchableOpacity
        style={[sum.confirmBtn, loading && sum.confirmBtnDisabled]}
        onPress={onConfirm}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#1a0f00" />
        ) : (
          <Text style={sum.confirmBtnText}>Confirmar reserva</Text>
        )}
      </TouchableOpacity>

      <Text style={sum.disclaimer}>
        Recibirás una notificación cuando el barbero confirme tu cita.
      </Text>
    </View>
  );
}

function SumRow({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <View style={sum.row}>
      <Text style={sum.rowIcon}>{icon}</Text>
      <Text style={sum.rowLabel}>{label}</Text>
      <Text style={sum.rowValue} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}
const sum = StyleSheet.create({
  card: {
    backgroundColor: "#1e1e1e",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 0.5,
    borderColor: "#2a2a2a",
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 8,
    gap: 10,
  },
  rowIcon: { fontSize: 16, width: 22 },
  rowLabel: { fontSize: 13, color: "#888", width: 68 },
  rowValue: {
    flex: 1,
    fontSize: 13,
    color: "#fff",
    fontWeight: "500",
    textAlign: "right",
  },
  divider: { height: 0.5, backgroundColor: "#2a2a2a", marginVertical: 4 },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 8,
  },
  totalLabel: { fontSize: 15, fontWeight: "600", color: "#fff" },
  totalValue: { fontSize: 18, fontWeight: "700", color: "#D4A853" },
  payCard: {
    backgroundColor: "#1a1a10",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 0.5,
    borderColor: "#3a3010",
  },
  payTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#D4A853",
    marginBottom: 8,
  },
  payDesc: { fontSize: 13, color: "#aaa", lineHeight: 19, marginBottom: 12 },
  wompiPlaceholder: {
    backgroundColor: "#2a2410",
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
    borderWidth: 0.5,
    borderColor: "#4a3a10",
    borderStyle: "dashed",
  },
  wompiText: { fontSize: 12, color: "#886633" },
  noteLabel: { fontSize: 13, color: "#888", marginBottom: 8 },
  noteInput: {
    backgroundColor: "#1e1e1e",
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    color: "#fff",
    borderWidth: 0.5,
    borderColor: "#2a2a2a",
    textAlignVertical: "top",
    minHeight: 80,
  },
  noteCount: {
    fontSize: 11,
    color: "#555",
    textAlign: "right",
    marginTop: 4,
    marginBottom: 20,
  },
  confirmBtn: {
    backgroundColor: "#D4A853",
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
  },
  confirmBtnDisabled: { opacity: 0.6 },
  confirmBtnText: { color: "#1a0f00", fontSize: 16, fontWeight: "700" },
  disclaimer: {
    fontSize: 12,
    color: "#555",
    textAlign: "center",
    marginTop: 12,
    lineHeight: 18,
  },
});

// ─── Pantalla principal ───────────────────────────────────
export default function BookingScreen() {
  const { barberId, serviceId } = useLocalSearchParams<{
    barberId: string;
    serviceId?: string;
  }>();
  const { user } = useAuth();
  const { barber } = useBarberProfile(barberId ?? null);

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Servicio seleccionado (puede venir por params o tomar el primero)
  const service = useMemo(() => {
    if (!barber?.services?.length) return null;
    if (serviceId)
      return (
        barber.services.find((s) => s.id === serviceId) ?? barber.services[0]
      );
    return barber.services[0];
  }, [barber, serviceId]);

  const { slots, loading: loadingSlots } = useBookingSlots(
    barberId ?? null,
    selectedDate,
    service?.duration_min ?? 30,
  );

  // ── Navegación entre pasos ──
  const goNext = () => {
    if (step === 1 && selectedDate) setStep(2);
    if (step === 2 && selectedSlot) setStep(3);
  };
  const goBack = () => {
    if (step === 2) {
      setSelectedSlot(null);
      setStep(1);
    } else if (step === 3) setStep(2);
    else router.back();
  };

  // ── Confirmar reserva ──
  const handleConfirm = async () => {
    if (!user || !barber || !service || !selectedDate || !selectedSlot) return;

    setSubmitting(true);

    const endsAt = new Date(
      selectedSlot.datetime.getTime() + service.duration_min * 60000,
    );

    const { data, error } = await supabase
      .from("bookings")
      .insert({
        client_id: user.id,
        barber_id: barber.id,
        service_id: service.id,
        scheduled_at: selectedSlot.datetime.toISOString(),
        ends_at: endsAt.toISOString(),
        status: "pending",
        total_price: service.price,
        notes: note.trim() || null,
        payment_status: "pending",
      })
      .select()
      .single();

    setSubmitting(false);

    if (!error && data) {
      await notifyBookingChange(data.id, "new_booking");
    }

    if (error) {
      Alert.alert("Error", "No se pudo crear la cita. Intenta de nuevo.");
      return;
    }

    // Éxito → pantalla de confirmación
    router.replace({
      pathname: "/(client)/booking-success",
      params: {
        barberName: barber.profile.full_name,
        serviceName: service.name,
        scheduledAt: selectedSlot.datetime.toISOString(),
      },
    });
  };

  const canContinue =
    (step === 1 && !!selectedDate) || (step === 2 && !!selectedSlot);

  return (
    <SafeAreaView style={styles.safe}>
      {/* ── Navbar ── */}
      <View style={styles.navbar}>
        <TouchableOpacity onPress={goBack} style={styles.navBackBtn}>
          <Text style={styles.navBackText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.navTitle}>Reservar cita</Text>
        <View style={{ width: 36 }} />
      </View>

      <StepIndicator step={step} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {step === 1 && (
          <StepDate
            selected={selectedDate}
            onSelect={(d) => {
              setSelectedDate(d);
              setSelectedSlot(null);
            }}
          />
        )}

        {step === 2 && selectedDate && (
          <StepTime
            date={selectedDate}
            slots={slots}
            loadingSlots={loadingSlots}
            selected={selectedSlot}
            onSelect={setSelectedSlot}
          />
        )}

        {step === 3 && selectedDate && selectedSlot && service && barber && (
          <StepSummary
            barberName={barber.profile.full_name}
            serviceName={service.name}
            servicePrice={service.price}
            date={selectedDate}
            slot={selectedSlot}
            note={note}
            onNoteChange={setNote}
            onConfirm={handleConfirm}
            loading={submitting}
          />
        )}
      </ScrollView>

      {/* ── Botón continuar (pasos 1 y 2) ── */}
      {step < 3 && (
        <View style={styles.ctaBar}>
          <TouchableOpacity
            style={[styles.ctaBtn, !canContinue && styles.ctaBtnDisabled]}
            onPress={goNext}
            disabled={!canContinue}
          >
            <Text style={styles.ctaBtnText}>
              {step === 1 ? "Ver horarios disponibles" : "Continuar"}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

// ─── Estilos base ─────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0f0f0f" },
  navbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: "#1e1e1e",
  },
  navBackBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  navBackText: { fontSize: 22, color: "#fff" },
  navTitle: { fontSize: 16, fontWeight: "600", color: "#fff" },
  scroll: { paddingHorizontal: 20, paddingBottom: 40 },
  stepWrap: { paddingTop: 4 },
  stepTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 6,
  },
  stepSub: {
    fontSize: 14,
    color: "#888",
    marginBottom: 20,
    textTransform: "capitalize",
  },
  noSlots: { alignItems: "center", paddingTop: 48 },
  noSlotsIcon: { fontSize: 40, marginBottom: 12 },
  noSlotsText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "600",
    marginBottom: 6,
  },
  noSlotsSub: { fontSize: 13, color: "#666" },
  ctaBar: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 0.5,
    borderTopColor: "#1e1e1e",
    backgroundColor: "#0f0f0f",
  },
  ctaBtn: {
    backgroundColor: "#D4A853",
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
  },
  ctaBtnDisabled: { opacity: 0.35 },
  ctaBtnText: { color: "#1a0f00", fontSize: 16, fontWeight: "700" },
});

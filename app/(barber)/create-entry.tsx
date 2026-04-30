// app/(barber)/create-entry.tsx
// UI completamente declarativa — toda la lógica vive en useCreateEntry.
// Sigue Clean Architecture: la pantalla solo renderiza, no decide.

import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useBarberServices } from "../../hooks/useBarberServices";
import {
  EntryType,
  ServiceOption,
  useCreateEntry,
} from "../../hooks/useCreateEntry";

// ─── Config visual de tipos de entrada ────────────────────
// ✅ Mejora: mapeo visual desacoplado de la lógica de negocio
const ENTRY_TYPE_CONFIG: Record<
  EntryType,
  { label: string; emoji: string; desc: string; color: string }
> = {
  barber_booking: {
    label: "Cliente registrado",
    emoji: "📱",
    desc: "Busca un cliente de la app",
    color: "#4caf7d",
  },
  external_booking: {
    label: "Cliente externo",
    emoji: "👤",
    desc: "Nombre y teléfono del cliente",
    color: "#D4A853",
  },
  block: {
    label: "Bloqueo personal",
    emoji: "🔒",
    desc: "Almuerzo, descanso, cita médica…",
    color: "#7B8FD4",
  },
};

// ─── Selector de tipo ──────────────────────────────────────
function EntryTypeSelector({
  selected,
  onSelect,
}: {
  selected: EntryType;
  onSelect: (t: EntryType) => void;
}) {
  return (
    <View style={s.section}>
      <Text style={s.sectionTitle}>Tipo de entrada</Text>
      <View style={ts.row}>
        {(
          Object.entries(ENTRY_TYPE_CONFIG) as [
            EntryType,
            (typeof ENTRY_TYPE_CONFIG)[EntryType],
          ][]
        ).map(([type, cfg]) => (
          <TouchableOpacity
            key={type}
            style={[
              ts.card,
              selected === type && {
                borderColor: cfg.color,
                backgroundColor: "#1a1a1a",
              },
            ]}
            onPress={() => onSelect(type)}
          >
            <Text style={ts.emoji}>{cfg.emoji}</Text>
            <Text style={[ts.label, selected === type && { color: cfg.color }]}>
              {cfg.label}
            </Text>
            <Text style={ts.desc}>{cfg.desc}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}
const ts = StyleSheet.create({
  row: { flexDirection: "row", gap: 8 },
  card: {
    flex: 1,
    backgroundColor: "#1e1e1e",
    borderRadius: 12,
    padding: 10,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#2a2a2a",
    gap: 4,
  },
  emoji: { fontSize: 20 },
  label: {
    fontSize: 11,
    fontWeight: "600",
    color: "#aaa",
    textAlign: "center",
  },
  desc: { fontSize: 10, color: "#555", textAlign: "center", lineHeight: 13 },
});

// ─── Selector de servicio ──────────────────────────────────
function ServiceSelector({
  services,
  selected,
  onSelect,
}: {
  services: ServiceOption[];
  selected: ServiceOption | null;
  onSelect: (s: ServiceOption) => void;
}) {
  return (
    <View style={s.section}>
      <Text style={s.sectionTitle}>Servicio</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8 }}
      >
        {services.map((sv) => (
          <TouchableOpacity
            key={sv.id}
            style={[ss.chip, selected?.id === sv.id && ss.chipActive]}
            onPress={() => onSelect(sv)}
          >
            <Text
              style={[ss.chipName, selected?.id === sv.id && ss.chipNameActive]}
            >
              {sv.name}
            </Text>
            <Text
              style={[
                ss.chipMeta,
                selected?.id === sv.id && { color: "#D4A853" },
              ]}
            >
              {sv.duration_min} min · $
              {Number(sv.price).toLocaleString("es-CO")}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}
const ss = StyleSheet.create({
  chip: {
    backgroundColor: "#1e1e1e",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#2a2a2a",
    minWidth: 120,
  },
  chipActive: { borderColor: "#D4A853", backgroundColor: "#1e1a10" },
  chipName: { fontSize: 13, fontWeight: "600", color: "#aaa", marginBottom: 4 },
  chipNameActive: { color: "#D4A853" },
  chipMeta: { fontSize: 11, color: "#666" },
});

// ─── Buscador de clientes registrados ─────────────────────
function ClientSearch({
  value,
  results,
  searching,
  onChangeText,
  onSelect,
}: {
  value: string;
  results: { id: string; full_name: string; phone: string | null }[];
  searching: boolean;
  onChangeText: (q: string) => void;
  onSelect: (c: {
    id: string;
    full_name: string;
    phone: string | null;
  }) => void;
}) {
  return (
    <View style={s.section}>
      <Text style={s.sectionTitle}>Buscar cliente</Text>
      <View style={cs.inputWrap}>
        <Text style={cs.icon}>🔍</Text>
        <TextInput
          style={cs.input}
          placeholder="Nombre del cliente..."
          placeholderTextColor="#555"
          value={value}
          onChangeText={onChangeText}
          autoCapitalize="words"
        />
        {searching && <ActivityIndicator size="small" color="#D4A853" />}
      </View>
      {results.map((c) => (
        <TouchableOpacity
          key={c.id}
          style={cs.result}
          onPress={() => onSelect(c)}
        >
          <View style={cs.avatar}>
            <Text style={cs.avatarText}>
              {c.full_name
                .split(" ")
                .slice(0, 2)
                .map((w) => w[0])
                .join("")
                .toUpperCase()}
            </Text>
          </View>
          <View>
            <Text style={cs.resultName}>{c.full_name}</Text>
            {c.phone && <Text style={cs.resultPhone}>{c.phone}</Text>}
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
}
const cs = StyleSheet.create({
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1e1e1e",
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 0.5,
    borderColor: "#2a2a2a",
    marginBottom: 8,
  },
  icon: { fontSize: 14, marginRight: 8 },
  input: { flex: 1, height: 44, color: "#fff", fontSize: 14 },
  result: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#1e1e1e",
    borderRadius: 10,
    padding: 10,
    marginBottom: 6,
    borderWidth: 0.5,
    borderColor: "#2a2a2a",
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#2a2a2a",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 13, fontWeight: "700", color: "#D4A853" },
  resultName: { fontSize: 14, color: "#fff", fontWeight: "500" },
  resultPhone: { fontSize: 12, color: "#888" },
});

// ─── Formulario cliente externo ────────────────────────────
function ExternalClientForm({
  name,
  phone,
  onNameChange,
  onPhoneChange,
}: {
  name: string;
  phone: string;
  onNameChange: (v: string) => void;
  onPhoneChange: (v: string) => void;
}) {
  return (
    <View style={s.section}>
      <Text style={s.sectionTitle}>Datos del cliente</Text>
      <TextInput
        style={s.input}
        placeholder="Nombre *"
        placeholderTextColor="#555"
        value={name}
        onChangeText={onNameChange}
        autoCapitalize="words"
        maxLength={60}
      />
      <TextInput
        style={[s.input, { marginTop: 8 }]}
        placeholder="Teléfono (opcional)"
        placeholderTextColor="#555"
        value={phone}
        onChangeText={onPhoneChange}
        keyboardType="phone-pad"
        maxLength={15}
      />
    </View>
  );
}

// ─── Selector de hora ──────────────────────────────────────
function TimeSelector({
  slots,
  selected,
  onSelect,
}: {
  slots: { time: string; label: string; available: boolean }[];
  selected: string;
  onSelect: (t: string) => void;
}) {
  if (!slots.length) {
    return (
      <View style={s.section}>
        <Text style={s.sectionTitle}>Hora</Text>
        <Text style={{ color: "#555", fontSize: 13, paddingVertical: 8 }}>
          Sin disponibilidad este día o selecciona un servicio primero.
        </Text>
      </View>
    );
  }

  return (
    <View style={s.section}>
      <Text style={s.sectionTitle}>Hora</Text>
      <View style={tsl.grid}>
        {slots.map((slot) => (
          <TouchableOpacity
            key={slot.time}
            style={[
              tsl.slot,
              !slot.available && tsl.slotBusy,
              selected === slot.time && tsl.slotSelected,
            ]}
            onPress={() => slot.available && onSelect(slot.time)}
            disabled={!slot.available}
          >
            <Text
              style={[
                tsl.slotText,
                !slot.available && tsl.slotTextBusy,
                selected === slot.time && tsl.slotTextSelected,
              ]}
            >
              {slot.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}
const tsl = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  slot: {
    width: "22%",
    backgroundColor: "#1e1e1e",
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  slotBusy: { opacity: 0.3 },
  slotSelected: { backgroundColor: "#D4A853", borderColor: "#D4A853" },
  slotText: { fontSize: 12, color: "#ccc" },
  slotTextBusy: { textDecorationLine: "line-through" },
  slotTextSelected: { color: "#1a0f00", fontWeight: "700" },
});

// ─── Formulario bloqueo personal ──────────────────────────
function BlockForm({
  reason,
  onReasonChange,
}: {
  reason: string;
  onReasonChange: (v: string) => void;
}) {
  const QUICK = [
    "Almuerzo",
    "Descanso",
    "Cita médica",
    "Diligencias",
    "Capacitación",
  ];
  return (
    <View style={s.section}>
      <Text style={s.sectionTitle}>Motivo del bloqueo</Text>
      <View style={bf.chips}>
        {QUICK.map((q) => (
          <TouchableOpacity
            key={q}
            style={[bf.chip, reason === q && bf.chipActive]}
            onPress={() => onReasonChange(reason === q ? "" : q)}
          >
            <Text style={[bf.chipText, reason === q && bf.chipTextActive]}>
              {q}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <TextInput
        style={[s.input, { marginTop: 10 }]}
        placeholder="O escribe un motivo personalizado..."
        placeholderTextColor="#555"
        value={reason}
        onChangeText={onReasonChange}
        maxLength={80}
      />
    </View>
  );
}
const bf = StyleSheet.create({
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#1e1e1e",
    borderWidth: 0.5,
    borderColor: "#2a2a2a",
  },
  chipActive: { backgroundColor: "#1a1a2a", borderColor: "#7B8FD4" },
  chipText: { fontSize: 12, color: "#888" },
  chipTextActive: { color: "#7B8FD4", fontWeight: "600" },
});

// ─── Resumen final ─────────────────────────────────────────
function SummaryCard({
  title,
  subtitle,
  price,
}: {
  title: string;
  subtitle: string;
  price: number | null;
}) {
  return (
    <View style={sum.card}>
      <Text style={sum.title}>{title}</Text>
      <Text style={sum.sub}>{subtitle}</Text>
      {price !== null && (
        <Text style={sum.price}>${Number(price).toLocaleString("es-CO")}</Text>
      )}
    </View>
  );
}
const sum = StyleSheet.create({
  card: {
    backgroundColor: "#1e1a10",
    borderRadius: 14,
    padding: 14,
    borderWidth: 0.5,
    borderColor: "#3a3010",
    marginBottom: 4,
  },
  title: { fontSize: 16, fontWeight: "700", color: "#fff", marginBottom: 4 },
  sub: {
    fontSize: 13,
    color: "#aaa",
    marginBottom: 6,
    textTransform: "capitalize",
  },
  price: { fontSize: 18, fontWeight: "700", color: "#D4A853" },
});

// ─── Pantalla principal ────────────────────────────────────
// ✅ Mejora: la pantalla es completamente declarativa.
//    No valida, no navega, no transforma — solo consume el hook.
export default function CreateEntryScreen() {
  const { date } = useLocalSearchParams<{ date?: string }>();
  const initialDate = date ? new Date(date) : new Date();

  const { services } = useBarberServices();

  // ✅ Mejora: barberId obtenido desde el hook de servicios para no duplicar queries
  const { barberId } = useBarberServices();

  const hook = useCreateEntry(
    barberId,
    services.filter((s) => s.is_active),
    initialDate,
  );

  const { entryType, selectedDate, selectedService, generateTimeSlots } = hook;

  // Slots de tiempo — se recargan al cambiar fecha, hora o servicio
  const [slots, setSlots] = useState<
    { time: string; label: string; available: boolean }[]
  >([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  useEffect(() => {
    if (entryType === "block") {
      setSlots([]);
      return;
    }
    setLoadingSlots(true);

    generateTimeSlots().then((s) => {
      setSlots(s);
      setLoadingSlots(false);
    });
  }, [selectedDate, selectedService, entryType, generateTimeSlots]);

  return (
    <SafeAreaView style={s.safe}>
      {/* ── Header ── */}
      <View style={s.header}>
        <TouchableOpacity onPress={hook.handleCancel} style={s.headerBtn}>
          <Text style={s.headerBtnText}>Cancelar</Text>
        </TouchableOpacity>
        <Text style={s.title}>Nueva entrada</Text>
        <TouchableOpacity
          onPress={hook.handleSave}
          style={[s.headerBtn, s.saveBtn, !hook.canSave && s.saveBtnDisabled]}
          disabled={!hook.canSave || hook.saving}
        >
          {hook.saving ? (
            <ActivityIndicator size="small" color="#1a0f00" />
          ) : (
            <Text style={s.saveBtnText}>Guardar</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={s.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Tipo de entrada ── */}
        <EntryTypeSelector
          selected={hook.entryType}
          onSelect={hook.setEntryType}
        />

        {/* ── Servicio (no aplica para bloqueo) ── */}
        {hook.entryType !== "block" && services.length > 0 && (
          <ServiceSelector
            services={services.filter((sv) => sv.is_active)}
            selected={hook.selectedService}
            onSelect={hook.setSelectedService}
          />
        )}

        {/* ── Datos según tipo ── */}
        {hook.entryType === "barber_booking" && (
          <ClientSearch
            value={hook.clientSearch}
            results={hook.clientResults}
            searching={hook.searching}
            onChangeText={hook.searchClients}
            onSelect={hook.selectClient}
          />
        )}

        {hook.entryType === "external_booking" && (
          <ExternalClientForm
            name={hook.externalName}
            phone={hook.externalPhone}
            onNameChange={hook.setExternalName}
            onPhoneChange={hook.setExternalPhone}
          />
        )}

        {hook.entryType === "block" && (
          <BlockForm
            reason={hook.blockReason}
            onReasonChange={hook.setBlockReason}
          />
        )}

        {/* ── Selector de hora ── */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Hora</Text>
          {loadingSlots ? (
            <ActivityIndicator color="#D4A853" style={{ marginVertical: 12 }} />
          ) : hook.entryType === "block" ? (
            // Para bloqueos: input libre de hora
            <TextInput
              style={s.input}
              placeholder="HH:MM — ej: 13:30"
              placeholderTextColor="#555"
              value={hook.selectedTime}
              onChangeText={hook.setSelectedTime}
              keyboardType="numbers-and-punctuation"
              maxLength={5}
            />
          ) : (
            <TimeSelector
              slots={slots}
              selected={hook.selectedTime}
              onSelect={hook.setSelectedTime}
            />
          )}
        </View>

        {/* ── Resumen (solo si hay suficiente info) ── */}
        {hook.canSave && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Resumen</Text>
            <SummaryCard
              title={hook.summary.title}
              subtitle={hook.summary.subtitle}
              price={hook.summary.price}
            />
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Estilos base ──────────────────────────────────────────
const s = StyleSheet.create({
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
  headerBtn: { paddingHorizontal: 10, paddingVertical: 6 },
  headerBtnText: { fontSize: 14, color: "#888" },
  title: { fontSize: 16, fontWeight: "600", color: "#fff" },
  saveBtn: { backgroundColor: "#D4A853", borderRadius: 20 },
  saveBtnDisabled: { opacity: 0.35 },
  saveBtnText: { fontSize: 14, fontWeight: "700", color: "#1a0f00" },
  scroll: { paddingHorizontal: 20, paddingTop: 8 },
  section: { marginBottom: 24 },
  sectionTitle: {
    fontSize: 12,
    color: "#666",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  input: {
    backgroundColor: "#1e1e1e",
    borderRadius: 12,
    padding: 13,
    fontSize: 14,
    color: "#fff",
    borderWidth: 0.5,
    borderColor: "#2a2a2a",
  },
});

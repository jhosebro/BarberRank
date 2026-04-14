// app/(barber)/services.tsx
// Gestión de servicios del barbero — listar, crear, editar, activar/desactivar y eliminar

import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
    BarberService,
    ServiceForm,
    useBarberServices,
} from "../../hooks/useBarberServices";

// ─── Helpers ──────────────────────────────────────────────
function fmtPrice(p: number) {
  return `$${Number(p).toLocaleString("es-CO")}`;
}

// Duraciones predefinidas para el selector rápido
const DURATIONS = [15, 20, 30, 45, 60, 90, 120];

// ─── Formulario de servicio (crear / editar) ──────────────
function ServiceFormComponent({
  initial,
  saving,
  onSave,
  onCancel,
}: {
  initial: ServiceForm;
  saving: boolean;
  onSave: (form: ServiceForm) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial.name);
  const [description, setDescription] = useState(initial.description);
  const [duration, setDuration] = useState(initial.duration_min);
  const [price, setPrice] = useState(
    initial.price > 0 ? String(initial.price) : "",
  );

  const isValid = name.trim().length > 0 && Number(price) > 0;

  return (
    <View style={form.wrap}>
      {/* Nombre */}
      <Text style={form.label}>Nombre del servicio *</Text>
      <TextInput
        style={form.input}
        placeholder="Ej: Corte + barba"
        placeholderTextColor="#555"
        value={name}
        onChangeText={setName}
        autoCapitalize="sentences"
        maxLength={60}
      />

      {/* Descripción */}
      <Text style={form.label}>Descripción (opcional)</Text>
      <TextInput
        style={[form.input, form.textArea]}
        placeholder="¿Qué incluye este servicio?"
        placeholderTextColor="#555"
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={3}
        maxLength={200}
        textAlignVertical="top"
      />

      {/* Duración */}
      <Text style={form.label}>Duración</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={form.durationRow}
      >
        {DURATIONS.map((d) => (
          <TouchableOpacity
            key={d}
            style={[
              form.durationChip,
              duration === d && form.durationChipActive,
            ]}
            onPress={() => setDuration(d)}
          >
            <Text
              style={[
                form.durationText,
                duration === d && form.durationTextActive,
              ]}
            >
              {d < 60 ? `${d} min` : `${d / 60}h`}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Precio */}
      <Text style={form.label}>Precio (COP) *</Text>
      <View style={form.priceRow}>
        <Text style={form.priceCurrency}>$</Text>
        <TextInput
          style={[form.input, form.priceInput]}
          placeholder="35000"
          placeholderTextColor="#555"
          value={price}
          onChangeText={(v) => setPrice(v.replace(/[^0-9]/g, ""))}
          keyboardType="numeric"
          maxLength={8}
        />
      </View>
      {Number(price) > 0 && (
        <Text style={form.priceHint}>
          {fmtPrice(Number(price))} · duración: {duration} min
        </Text>
      )}

      {/* Acciones */}
      <View style={form.actions}>
        <TouchableOpacity style={form.cancelBtn} onPress={onCancel}>
          <Text style={form.cancelText}>Cancelar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[form.saveBtn, (!isValid || saving) && form.saveBtnDisabled]}
          onPress={() =>
            onSave({
              name,
              description,
              duration_min: duration,
              price: Number(price),
            })
          }
          disabled={!isValid || saving}
        >
          {saving ? (
            <ActivityIndicator color="#1a0f00" size="small" />
          ) : (
            <Text style={form.saveText}>Guardar</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const form = StyleSheet.create({
  wrap: { padding: 20 },
  label: { fontSize: 13, color: "#aaa", marginBottom: 6, marginTop: 16 },
  input: {
    backgroundColor: "#222",
    borderRadius: 12,
    padding: 13,
    fontSize: 14,
    color: "#fff",
    borderWidth: 0.5,
    borderColor: "#2a2a2a",
  },
  textArea: { minHeight: 80, textAlignVertical: "top" },
  durationRow: { gap: 8, paddingVertical: 4 },
  durationChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#1e1e1e",
    borderWidth: 0.5,
    borderColor: "#2a2a2a",
  },
  durationChipActive: { backgroundColor: "#2a1a00", borderColor: "#D4A853" },
  durationText: { fontSize: 13, color: "#888" },
  durationTextActive: { color: "#D4A853", fontWeight: "600" },
  priceRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  priceCurrency: { fontSize: 18, color: "#D4A853", fontWeight: "700" },
  priceInput: { flex: 1 },
  priceHint: { fontSize: 12, color: "#D4A853", marginTop: 6 },
  actions: { flexDirection: "row", gap: 10, marginTop: 28 },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#1e1e1e",
    alignItems: "center",
    borderWidth: 0.5,
    borderColor: "#2a2a2a",
  },
  cancelText: { color: "#888", fontSize: 14 },
  saveBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#D4A853",
    alignItems: "center",
  },
  saveBtnDisabled: { opacity: 0.35 },
  saveText: { color: "#1a0f00", fontSize: 15, fontWeight: "700" },
});

// ─── Card de servicio ──────────────────────────────────────
function ServiceCard({
  service,
  onEdit,
  onToggle,
  onDelete,
}: {
  service: BarberService;
  onEdit: () => void;
  onToggle: (active: boolean) => void;
  onDelete: () => void;
}) {
  return (
    <View style={[sc.wrap, !service.is_active && sc.wrapInactive]}>
      {/* Cabecera */}
      <View style={sc.header}>
        <View style={{ flex: 1 }}>
          <Text style={[sc.name, !service.is_active && sc.nameInactive]}>
            {service.name}
          </Text>
          {service.description && (
            <Text style={sc.desc} numberOfLines={2}>
              {service.description}
            </Text>
          )}
        </View>

        {/* Switch activo/inactivo */}
        <Switch
          value={service.is_active}
          onValueChange={onToggle}
          trackColor={{ false: "#2a2a2a", true: "#D4A853" }}
          thumbColor={service.is_active ? "#1a0f00" : "#555"}
        />
      </View>

      {/* Meta */}
      <View style={sc.meta}>
        <View style={sc.metaChip}>
          <Text style={sc.metaText}>⏱ {service.duration_min} min</Text>
        </View>
        <View style={[sc.metaChip, sc.priceChip]}>
          <Text style={sc.priceText}>{fmtPrice(service.price)}</Text>
        </View>
        {!service.is_active && (
          <View style={sc.inactivePill}>
            <Text style={sc.inactiveText}>Inactivo</Text>
          </View>
        )}
      </View>

      {/* Acciones */}
      <View style={sc.actions}>
        <TouchableOpacity style={sc.editBtn} onPress={onEdit}>
          <Text style={sc.editText}>✏️ Editar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={sc.deleteBtn} onPress={onDelete}>
          <Text style={sc.deleteText}>🗑 Eliminar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const sc = StyleSheet.create({
  wrap: {
    backgroundColor: "#1e1e1e",
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 0.5,
    borderColor: "#2a2a2a",
    overflow: "hidden",
  },
  wrapInactive: { opacity: 0.6 },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 14,
    gap: 12,
  },
  name: { fontSize: 15, fontWeight: "600", color: "#fff", marginBottom: 4 },
  nameInactive: { color: "#888" },
  desc: { fontSize: 12, color: "#777", lineHeight: 17 },
  meta: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 14,
    paddingBottom: 12,
    flexWrap: "wrap",
  },
  metaChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: "#2a2a2a",
  },
  metaText: { fontSize: 12, color: "#aaa" },
  priceChip: { backgroundColor: "#2a1a00" },
  priceText: { fontSize: 12, color: "#D4A853", fontWeight: "600" },
  inactivePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: "#2a1010",
  },
  inactiveText: { fontSize: 12, color: "#e06060" },
  actions: {
    flexDirection: "row",
    borderTopWidth: 0.5,
    borderTopColor: "#2a2a2a",
  },
  editBtn: {
    flex: 1,
    paddingVertical: 11,
    alignItems: "center",
    borderRightWidth: 0.5,
    borderRightColor: "#2a2a2a",
  },
  editText: { fontSize: 13, color: "#aaa" },
  deleteBtn: { flex: 1, paddingVertical: 11, alignItems: "center" },
  deleteText: { fontSize: 13, color: "#e06060" },
});

// ─── Pantalla principal ───────────────────────────────────
export default function ServicesScreen() {
  const {
    services,
    loading,
    saving,
    EMPTY_FORM,
    createService,
    updateService,
    toggleService,
    deleteService,
  } = useBarberServices();

  // null = cerrado | "new" = nuevo | BarberService = editando
  const [modalData, setModalData] = useState<null | "new" | BarberService>(
    null,
  );

  const handleSave = async (formData: ServiceForm) => {
    let result;
    if (modalData === "new") {
      result = await createService(formData);
    } else if (modalData && typeof modalData !== "string") {
      result = await updateService(modalData.id, formData);
    }
    if (result?.success) setModalData(null);
    else if (result?.error) Alert.alert("Error", result.error);
  };

  const handleDelete = (service: BarberService) => {
    Alert.alert(
      "Eliminar servicio",
      `¿Seguro que quieres eliminar "${service.name}"? Las citas futuras que incluyan este servicio no se verán afectadas.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            const result = await deleteService(service.id);
            if (!result.success) Alert.alert("Error", result.error);
          },
        },
      ],
    );
  };

  const handleToggle = async (service: BarberService, active: boolean) => {
    // Si intenta desactivar el último servicio activo, advertir
    const activeCount = services.filter((s) => s.is_active).length;
    if (!active && activeCount === 1) {
      Alert.alert(
        "Último servicio activo",
        "Si desactivas este servicio no tendrás ninguno disponible para reservas. ¿Continuar?",
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Desactivar",
            onPress: () => toggleService(service.id, false),
          },
        ],
      );
      return;
    }
    await toggleService(service.id, active);
  };

  const activeServices = services.filter((s) => s.is_active);
  const inactiveServices = services.filter((s) => !s.is_active);

  const initialForm: ServiceForm =
    modalData && modalData !== "new"
      ? {
          name: modalData.name,
          description: modalData.description ?? "",
          duration_min: modalData.duration_min,
          price: modalData.price,
        }
      : EMPTY_FORM;

  return (
    <SafeAreaView style={styles.safe}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>
            <Ionicons name="arrow-back" size={20} color="#D4A853"></Ionicons>
          </Text>
        </TouchableOpacity>
        <Text style={styles.title}>Mis servicios</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setModalData("new")}
        >
          <Text style={styles.addBtnText}>+ Agregar</Text>
        </TouchableOpacity>
      </View>

      {/* ── Resumen ── */}
      <View style={styles.summary}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryNum}>{services.length}</Text>
          <Text style={styles.summaryLabel}>Total</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryNum, { color: "#4caf7d" }]}>
            {activeServices.length}
          </Text>
          <Text style={styles.summaryLabel}>Activos</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryNum, { color: "#888" }]}>
            {inactiveServices.length}
          </Text>
          <Text style={styles.summaryLabel}>Inactivos</Text>
        </View>
        {activeServices.length > 0 && (
          <View style={styles.summaryItem}>
            <Text
              style={[styles.summaryNum, { color: "#D4A853", fontSize: 13 }]}
            >
              {fmtPrice(Math.min(...activeServices.map((s) => s.price)))}
            </Text>
            <Text style={styles.summaryLabel}>Desde</Text>
          </View>
        )}
      </View>

      {/* ── Lista ── */}
      {loading ? (
        <ActivityIndicator color="#D4A853" style={{ marginTop: 40 }} />
      ) : services.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>✂️</Text>
          <Text style={styles.emptyTitle}>Sin servicios aún</Text>
          <Text style={styles.emptyDesc}>
            Agrega los servicios que ofreces para que los clientes puedan
            reservar.
          </Text>
          <TouchableOpacity
            style={styles.emptyBtn}
            onPress={() => setModalData("new")}
          >
            <Text style={styles.emptyBtnText}>Agregar primer servicio</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        >
          {/* Activos */}
          {activeServices.length > 0 && (
            <>
              <Text style={styles.sectionLabel}>
                Activos ({activeServices.length})
              </Text>
              {activeServices.map((s) => (
                <ServiceCard
                  key={s.id}
                  service={s}
                  onEdit={() => setModalData(s)}
                  onToggle={(active) => handleToggle(s, active)}
                  onDelete={() => handleDelete(s)}
                />
              ))}
            </>
          )}

          {/* Inactivos */}
          {inactiveServices.length > 0 && (
            <>
              <Text style={[styles.sectionLabel, { marginTop: 16 }]}>
                Inactivos ({inactiveServices.length})
              </Text>
              {inactiveServices.map((s) => (
                <ServiceCard
                  key={s.id}
                  service={s}
                  onEdit={() => setModalData(s)}
                  onToggle={(active) => handleToggle(s, active)}
                  onDelete={() => handleDelete(s)}
                />
              ))}
            </>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {/* ── Modal crear / editar ── */}
      <Modal
        visible={modalData !== null}
        animationType="slide"
        transparent
        onRequestClose={() => setModalData(null)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => !saving && setModalData(null)}
        >
          <Pressable style={styles.modalSheet} onPress={() => {}}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>
              {modalData === "new" ? "Nuevo servicio" : "Editar servicio"}
            </Text>
            <ScrollView keyboardShouldPersistTaps="handled">
              <ServiceFormComponent
                initial={initialForm}
                saving={saving}
                onSave={handleSave}
                onCancel={() => setModalData(null)}
              />
            </ScrollView>
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
  addBtn: {
    backgroundColor: "#D4A853",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },
  addBtnText: { color: "#1a0f00", fontSize: 13, fontWeight: "700" },
  summary: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: "#1e1e1e",
  },
  summaryItem: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "#1e1e1e",
    borderRadius: 10,
    paddingVertical: 10,
    borderWidth: 0.5,
    borderColor: "#2a2a2a",
  },
  summaryNum: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 2,
  },
  summaryLabel: { fontSize: 10, color: "#666" },
  list: { paddingHorizontal: 16, paddingTop: 12 },
  sectionLabel: {
    fontSize: 12,
    color: "#666",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
    paddingHorizontal: 32,
  },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 8,
  },
  emptyDesc: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
  },
  emptyBtn: {
    marginTop: 20,
    backgroundColor: "#D4A853",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyBtnText: { color: "#1a0f00", fontWeight: "600", fontSize: 14 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: "#181818",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "90%",
    paddingBottom: 20,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: "#333",
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
    paddingHorizontal: 20,
    paddingTop: 12,
  },
});

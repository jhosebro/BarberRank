//TODO: Separacion de responsabilidades
//TODO: Manejo de estado
//TODO: Validaciones
//TODO: UX/UI
//TODO: Manejo de imagenes
//TODO: Performance
//TODO: Seguridad y consistencia de datos
//TODO: Navegacion y control de flujo
//TODO: Accesibilidad
//TODO: Clean Code

import { useOnboarding } from "@/hooks/useOnboarding";
import { WeekSchedule } from "@/types/onboarding.types";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const DAY_NAMES = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

// ─── Indicador de pasos ───────────────────────────────────
function Steps({ current }: { current: number }) {
  return (
    <View style={si.row}>
      {[1, 2, 3].map((s) => (
        <View key={s} style={si.item}>
          <View
            style={[
              si.dot,
              current >= s && si.dotActive,
              current > s && si.dotDone,
            ]}
          >
            <Text style={[si.dotText, current >= s && si.dotTextActive]}>
              {current > s ? "✓" : s}
            </Text>
          </View>
          {s < 3 && <View style={[si.line, current > s && si.lineActive]} />}
        </View>
      ))}
    </View>
  );
}

function LocationPicker({
  countries,
  selectedCountry,
  setSelectedCountry,
  states,
  selectedState,
  setSelectedState,
  city,
  setCity,
  cities,
}: {
  countries: { id: number; name: string }[];
  selectedCountry?: number | null;
  setSelectedCountry: (v: number | null) => void;

  states: { id: number; name: string; citiesList: string[] }[];
  selectedState?: number | null;
  setSelectedState: (v: number | null) => void;

  city: string;
  setCity: (v: string) => void;
  cities: string[];
}) {
  const [pickerMode, setPickerMode] = useState<
    "country" | "state" | "city" | null
  >(null);
  const [search, setSearch] = useState("");

  const selectedCountryName =
    countries.find((c) => c.id === selectedCountry)?.name || "";

  const selectedStateData = states.find((s) => s.id === selectedState);

  const citiesList = selectedState && selectedStateData ? cities : [];

  const filteredCountries = search
    ? countries.filter((c) =>
        c.name.toLowerCase().includes(search.toLowerCase()),
      )
    : countries;

  const filteredStates = search
    ? states.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()))
    : states;

  const filteredCities = search
    ? citiesList.filter((c) => c.toLowerCase().includes(search.toLowerCase()))
    : citiesList;

  const closePicker = () => {
    setPickerMode(null);
    setSearch("");
  };

  const handleSelectCountry = (id: number) => {
    setSelectedCountry(id);
    setSelectedState(null);
    setCity("");
    closePicker();
  };

  const handleSelectState = (stateId: number) => {
    setSelectedState(stateId);
    setCity("");
    closePicker();
  };

  const handleSelectCity = (cityName: string) => {
    setCity(cityName);
    closePicker();
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={pickerStyles.option}
      onPress={() => {
        if (pickerMode === "country" && item.id != null) {
          handleSelectCountry(item.id);
        } else if (pickerMode === "state" && item.id != null) {
          handleSelectState(item.id);
        } else if (item.name) {
          handleSelectCity(item.name);
        }
      }}
    >
      <Text style={pickerStyles.optionText}>{item.name}</Text>
    </TouchableOpacity>
  );

  return (
    <View>
      <Text style={styles.label}>País *</Text>
      <TouchableOpacity
        style={pickerStyles.selector}
        onPress={() => setPickerMode("country")}
      >
        <Text style={pickerStyles.selectorText}>
          {selectedCountryName || "Selecciona un país"}
        </Text>
      </TouchableOpacity>

      <Text style={styles.label}>Departamento *</Text>
      <TouchableOpacity
        style={[
          pickerStyles.selector,
          !selectedCountry && pickerStyles.disabled,
        ]}
        onPress={() => {
          if (selectedCountry != null) {
            setPickerMode("state");
          }
        }}
      >
        <Text style={pickerStyles.selectorText}>
          {selectedStateData?.name || "Selecciona un departamento"}
        </Text>
      </TouchableOpacity>

      <Text style={styles.label}>Ciudad *</Text>
      <TouchableOpacity
        style={[pickerStyles.selector, !selectedState && pickerStyles.disabled]}
        onPress={() => selectedState && setPickerMode("city")}
      >
        <Text style={pickerStyles.selectorText}>
          {city || "Selecciona una ciudad"}
        </Text>
      </TouchableOpacity>

      <Modal visible={pickerMode !== null} transparent animationType="slide">
        <View style={pickerStyles.modalOverlay}>
          <View style={pickerStyles.modalContent}>
            <TextInput
              style={pickerStyles.searchInput}
              placeholder="Buscar..."
              value={search}
              onChangeText={setSearch}
            />

            <FlatList
              data={
                pickerMode === "country"
                  ? filteredCountries
                  : pickerMode === "state"
                    ? filteredStates
                    : filteredCities.map((name) => ({ name }))
              }
              renderItem={renderItem}
              keyExtractor={(item: any) => item.id?.toString() || item.name}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}
function StepInfo({
  city,
  setCity,
  address,
  setAddress,
  bio,
  setBio,
  countries,
  selectedCountry,
  setSelectedCountry,
  states,
  selectedState,
  setSelectedState,
  cities,
}: {
  city: string;
  setCity: (v: string) => void;
  address: string;
  setAddress: (v: string) => void;
  bio: string;
  setBio: (v: string) => void;

  countries: { id: number; name: string }[];
  selectedCountry?: number | null;
  setSelectedCountry: (v: number | null) => void;

  states: { id: number; name: string; citiesList: string[] }[];
  selectedState?: number | null;
  setSelectedState: (v: number | null) => void;
  cities: string[];
}) {
  return (
    <View style={styles.stepWrap}>
      <Text style={styles.stepTitle}>Cuéntanos sobre ti</Text>

      <LocationPicker
        countries={countries}
        selectedCountry={selectedCountry}
        setSelectedCountry={setSelectedCountry}
        states={states}
        selectedState={selectedState}
        setSelectedState={setSelectedState}
        city={city}
        setCity={setCity}
        cities={cities}
      />

      <Text style={styles.label}>Dirección de tu barbería</Text>
      <TextInput
        style={styles.input}
        placeholder="Ej: Calle 5 # 38-25"
        placeholderTextColor="#555"
        value={address}
        onChangeText={setAddress}
      />

      <Text style={styles.label}>Bio</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={bio}
        onChangeText={setBio}
        multiline
      />
    </View>
  );
}

function StepPhoto({
  avatarUri,
  onPickPhoto,
  uploading,
  onSkip,
}: {
  avatarUri: string | null;
  onPickPhoto: () => void;
  uploading: boolean;
  onSkip: () => void;
}) {
  return (
    <View style={[styles.stepWrap, { alignItems: "center" }]}>
      <Text style={styles.stepTitle}>Tu foto de perfil</Text>
      <Text style={styles.stepSub}>Los clientes la verán al buscarte</Text>

      <TouchableOpacity
        style={photo.circle}
        onPress={onPickPhoto}
        disabled={uploading}
      >
        {avatarUri ? (
          <View
            style={{
              width: "100%",
              height: "100%",
              borderRadius: 80,
              overflow: "hidden",
            }}
          >
            <Image
              source={{ uri: avatarUri }}
              style={{ width: "100%", height: "100%" }}
            />
            <View style={[photo.circle, photo.circlePreview]}>
              <Text style={photo.previewText}>✓ Foto seleccionada</Text>
            </View>
          </View>
        ) : (
          <View style={photo.placeholder}>
            <Text style={photo.placeholderIcon}>📷</Text>
            <Text style={photo.placeholderText}>Toca para subir foto</Text>
          </View>
        )}
      </TouchableOpacity>

      {uploading && (
        <ActivityIndicator color="#D4A853" style={{ marginTop: 16 }} />
      )}

      <Text style={photo.hint}>
        Usa una foto clara de tu cara o de tu trabajo.{"\n"}
        Formatos: JPG, PNG. Máximo 5MB.
      </Text>

      <TouchableOpacity onPress={onSkip} style={photo.skipBtn}>
        <Text style={photo.skipText}>
          Saltar por ahora{" "}
          <Ionicons name="arrow-forward" size={13} color="#1a0f00" />
        </Text>
      </TouchableOpacity>
    </View>
  );
}

function StepSchedule({
  schedule,
  onToggleDay,
  onChangeTime,
}: {
  schedule: WeekSchedule;
  onToggleDay: (day: number, enabled: boolean) => void;
  onChangeTime: (day: number, field: "start" | "end", value: string) => void;
}) {
  return (
    <View style={styles.stepWrap}>
      <Text style={styles.stepTitle}>Tus horarios</Text>
      <Text style={styles.stepSub}>¿Qué días y horas atiendes?</Text>

      {Object.entries(schedule).map(([dayStr, slot]) => {
        const day = parseInt(dayStr);
        return (
          <View key={day} style={sched.row}>
            <View style={sched.left}>
              <Switch
                value={slot.enabled}
                onValueChange={(v) => onToggleDay(day, v)}
                trackColor={{ false: "#2a2a2a", true: "#D4A853" }}
                thumbColor={slot.enabled ? "#1a0f00" : "#555"}
              />
              <Text style={[sched.dayName, !slot.enabled && sched.dayNameOff]}>
                {DAY_NAMES[day]}
              </Text>
            </View>

            {slot.enabled ? (
              <View style={sched.times}>
                <TextInput
                  style={sched.timeInput}
                  value={slot.start}
                  onChangeText={(v) => onChangeTime(day, "start", v)}
                  placeholder="09:00"
                  placeholderTextColor="#555"
                  keyboardType="numbers-and-punctuation"
                  maxLength={5}
                />
                <Text style={sched.separator}>
                  <Ionicons name="arrow-forward" size={13} color="#fff" />
                </Text>
                <TextInput
                  style={sched.timeInput}
                  value={slot.end}
                  onChangeText={(v) => onChangeTime(day, "end", v)}
                  placeholder="18:00"
                  placeholderTextColor="#555"
                  keyboardType="numbers-and-punctuation"
                  maxLength={5}
                />
              </View>
            ) : (
              <Text style={sched.closedText}>Cerrado</Text>
            )}
          </View>
        );
      })}

      <View style={sched.hint}>
        <Text style={sched.hintText}>
          💡 Usa formato 24h. Ej: 09:00{" "}
          <Ionicons name="arrow-forward" size={13} color="#886632" /> 18:00.
          Puedes actualizar tus horarios en cualquier momento desde tu perfil.
        </Text>
      </View>
    </View>
  );
}

export default function OnboardingScreen() {
  const {
    step,
    saving,
    uploading,
    city,
    address,
    bio,
    avatarUri,
    schedule,
    cities,
    countries,
    selectedCountry,
    setSelectedCountry,
    states,
    selectedState,
    setSelectedState,
    setCity,
    setAddress,
    setBio,
    pickPhoto,
    toggleDay,
    changeTime,
    nextStep,
    prevStep,
    finish,
  } = useOnboarding();

  const canContinue =
    step === 1
      ? !!selectedCountry && !!selectedState && city.trim().length > 0
      : step === 2 ||
        (step === 3 && Object.values(schedule).some((s) => s.enabled));

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        {step > 1 ? (
          <TouchableOpacity onPress={prevStep} style={styles.backBtn}>
            <Text style={styles.backText}>
              <Ionicons name="arrow-back" size={22} color="#fff" />
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 36 }} />
        )}
        <Text style={styles.headerTitle}>Configura tu perfil</Text>
        <View style={{ width: 36 }} />
      </View>

      <Steps current={step} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {step === 1 && (
          <StepInfo
            city={city}
            setCity={setCity}
            address={address}
            setAddress={setAddress}
            bio={bio}
            setBio={setBio}
            countries={countries}
            selectedCountry={selectedCountry}
            setSelectedCountry={setSelectedCountry}
            states={states}
            selectedState={selectedState}
            setSelectedState={setSelectedState}
            cities={cities}
          />
        )}
        {step === 2 && (
          <StepPhoto
            avatarUri={avatarUri}
            onPickPhoto={pickPhoto}
            uploading={uploading}
            onSkip={nextStep}
          />
        )}
        {step === 3 && (
          <StepSchedule
            schedule={schedule}
            onToggleDay={toggleDay}
            onChangeTime={changeTime}
          />
        )}
        <View style={{ height: 120 }} />
      </ScrollView>

      <View style={styles.ctaBar}>
        <TouchableOpacity
          style={[
            styles.ctaBtn,
            (!canContinue || saving) && styles.ctaBtnDisabled,
          ]}
          onPress={async () => {
            if (step < 3) {
              nextStep();
            } else {
              try {
                const ok = await finish();
                if (ok) {
                  router.replace("/(barber)/planner");
                }
              } catch (error) {
                console.error(error);
              }
            }
          }}
          disabled={!canContinue || saving}
        >
          {saving ? (
            <ActivityIndicator color="#1a0f00" />
          ) : (
            <Text style={styles.ctaBtnText}>
              {step < 3 ? "Continuar" : "Finalizar y entrar al planner"}
            </Text>
          )}
        </TouchableOpacity>
      </View>
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
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: "#1e1e1e",
  },
  headerTitle: { fontSize: 16, fontWeight: "600", color: "#fff" },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  backText: { fontSize: 22, color: "#fff" },
  scroll: { paddingHorizontal: 20 },
  stepWrap: { paddingTop: 4 },
  stepTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 6,
  },
  stepSub: { fontSize: 14, color: "#888", marginBottom: 24 },
  label: { fontSize: 13, color: "#aaa", marginBottom: 6, marginTop: 16 },
  input: {
    backgroundColor: "#1e1e1e",
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: "#fff",
    borderWidth: 0.5,
    borderColor: "#2a2a2a",
  },
  textArea: { minHeight: 100, textAlignVertical: "top" },
  charCount: { fontSize: 11, color: "#555", textAlign: "right", marginTop: 4 },
  ctaBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#0f0f0f",
    borderTopWidth: 0.5,
    borderTopColor: "#1e1e1e",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 28,
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

const si = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
  },
  item: { flexDirection: "row", alignItems: "center" },
  dot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#333",
    alignItems: "center",
    justifyContent: "center",
  },
  dotActive: { borderColor: "#D4A853", backgroundColor: "#D4A853" },
  dotDone: { backgroundColor: "transparent", borderColor: "#D4A853" },
  dotText: { fontSize: 13, color: "#555", fontWeight: "600" },
  dotTextActive: { color: "#1a0f00" },
  line: {
    width: 40,
    height: 1.5,
    backgroundColor: "#2a2a2a",
    marginHorizontal: 6,
  },
  lineActive: { backgroundColor: "#D4A853" },
});

const sched = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: "#1e1e1e",
  },
  left: { flexDirection: "row", alignItems: "center", gap: 10, width: 130 },
  dayName: { fontSize: 14, color: "#fff", fontWeight: "500" },
  dayNameOff: { color: "#555" },
  times: { flexDirection: "row", alignItems: "center", gap: 6 },
  timeInput: {
    backgroundColor: "#1e1e1e",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    fontSize: 13,
    color: "#fff",
    width: 64,
    textAlign: "center",
    borderWidth: 0.5,
    borderColor: "#2a2a2a",
  },
  separator: { fontSize: 12, color: "#666" },
  closedText: { fontSize: 13, color: "#444" },
  hint: {
    backgroundColor: "#1a1a10",
    borderRadius: 10,
    padding: 12,
    marginTop: 16,
    borderWidth: 0.5,
    borderColor: "#3a3010",
  },
  hintText: { fontSize: 12, color: "#886632", lineHeight: 18 },
});

const photo = StyleSheet.create({
  circle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 2,
    borderColor: "#D4A853",
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 24,
  },
  circlePreview: { backgroundColor: "#1a2010", borderStyle: "solid" },
  previewText: { color: "#4caf7d", fontWeight: "600", fontSize: 14 },
  placeholder: { alignItems: "center", gap: 8 },
  placeholderIcon: { fontSize: 36 },
  placeholderText: { fontSize: 13, color: "#888" },
  hint: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
    lineHeight: 18,
    marginTop: 8,
  },
  skipBtn: {
    marginTop: 20,
    backgroundColor: "#D4A853",
    borderRadius: 14,
    padding: 8,
    alignItems: "center",
  },
  skipText: { color: "#1a0f00", fontSize: 13, fontWeight: "700" },
});

const pickerStyles = StyleSheet.create({
  selector: {
    backgroundColor: "#1e1e1e",
    borderRadius: 12,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 0.5,
    borderColor: "#2a2a2a",
    marginBottom: 16,
  },
  selectorText: { fontSize: 15, color: "#fff", flex: 1 },
  placeholder: { color: "#555" },
  disabled: { opacity: 0.5 },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#1e1e1e",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "70%",
    paddingBottom: 30,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: "#2a2a2a",
  },
  modalTitle: { fontSize: 18, fontWeight: "700", color: "#fff" },
  searchInput: {
    backgroundColor: "#0f0f0f",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: "#fff",
    margin: 16,
    marginBottom: 8,
    borderWidth: 0.5,
    borderColor: "#333",
  },
  list: { maxHeight: 350 },
  option: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: "#2a2a2a",
  },
  optionText: { fontSize: 15, color: "#ccc" },
});

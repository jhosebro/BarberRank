// app/(barber)/onboarding.tsx
// Onboarding del barbero — 3 pasos: info básica, foto, horarios semanales

import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../hooks/useAuth";
import { supabase } from "../../lib/supabase";

// ─── Tipos ────────────────────────────────────────────────
interface DaySchedule {
  enabled: boolean;
  start: string;
  end: string;
}

type WeekSchedule = Record<number, DaySchedule>;

const DAY_NAMES = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

const DEFAULT_SCHEDULE: WeekSchedule = {
  0: { enabled: false, start: "09:00", end: "18:00" },
  1: { enabled: true, start: "09:00", end: "18:00" },
  2: { enabled: true, start: "09:00", end: "18:00" },
  3: { enabled: true, start: "09:00", end: "18:00" },
  4: { enabled: true, start: "09:00", end: "18:00" },
  5: { enabled: true, start: "09:00", end: "18:00" },
  6: { enabled: true, start: "09:00", end: "14:00" },
};

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

// ─── Paso 1: Info básica ──────────────────────────────────
function StepInfo({
  city,
  setCity,
  address,
  setAddress,
  bio,
  setBio,
}: {
  city: string;
  setCity: (v: string) => void;
  address: string;
  setAddress: (v: string) => void;
  bio: string;
  setBio: (v: string) => void;
}) {
  return (
    <View style={styles.stepWrap}>
      <Text style={styles.stepTitle}>Cuéntanos sobre ti</Text>
      <Text style={styles.stepSub}>
        Esta info aparecerá en tu perfil público
      </Text>

      <Text style={styles.label}>Ciudad *</Text>
      <TextInput
        style={styles.input}
        placeholder="Ej: Cali"
        placeholderTextColor="#555"
        value={city}
        onChangeText={setCity}
        autoCapitalize="words"
      />

      <Text style={styles.label}>Dirección de tu barbería</Text>
      <TextInput
        style={styles.input}
        placeholder="Ej: Calle 5 # 38-25, El Peñón"
        placeholderTextColor="#555"
        value={address}
        onChangeText={setAddress}
        autoCapitalize="sentences"
      />

      <Text style={styles.label}>Bio</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Cuéntale a tus clientes sobre tu experiencia, especialidades y estilo..."
        placeholderTextColor="#555"
        value={bio}
        onChangeText={setBio}
        multiline
        numberOfLines={4}
        maxLength={300}
        textAlignVertical="top"
      />
      <Text style={styles.charCount}>{bio.length}/300</Text>
    </View>
  );
}

// ─── Paso 2: Foto de perfil ───────────────────────────────
function StepPhoto({
  avatarUri,
  onPickPhoto,
  uploading,
}: {
  avatarUri: string | null;
  onPickPhoto: () => void;
  uploading: boolean;
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
            {/* En RN real usarías <Image source={{ uri: avatarUri }} /> */}
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

      <TouchableOpacity onPress={() => {}} style={photo.skipBtn}>
        <Text style={photo.skipText}>Saltar por ahora →</Text>
      </TouchableOpacity>
    </View>
  );
}
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
  skipBtn: { marginTop: 20 },
  skipText: { color: "#666", fontSize: 13 },
});

// ─── Paso 3: Horarios ─────────────────────────────────────
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
                <Text style={sched.separator}>→</Text>
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
          💡 Usa formato 24h. Ej: 09:00 → 18:00. Puedes actualizar tus horarios
          en cualquier momento desde tu perfil.
        </Text>
      </View>
    </View>
  );
}
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
  hintText: { fontSize: 12, color: "#886633", lineHeight: 18 },
});

// ─── Pantalla principal ───────────────────────────────────
export default function OnboardingScreen() {
  const { user, updateProfile } = useAuth();

  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Paso 1
  const [city, setCity] = useState<string>("");
  const [address, setAddress] = useState<string>("");
  const [bio, setBio] = useState<string>("");

  // Paso 2
  const [avatarUri, setAvatarUri] = useState<string | null>(null);

  // Paso 3
  const [schedule, setSchedule] = useState<WeekSchedule>(DEFAULT_SCHEDULE);

  const toggleDay = (day: number, enabled: boolean) => {
    setSchedule((s) => ({ ...s, [day]: { ...s[day], enabled } }));
  };
  const changeTime = (day: number, field: "start" | "end", value: string) => {
    setSchedule((s) => ({ ...s, [day]: { ...s[day], [field]: value } }));
  };

  // ── Selección de foto ──
  const pickPhoto = async () => {
    console.log("Supabase URL:", process.env.EXPO_PUBLIC_SUPABASE_URL);
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permiso necesario",
        "Necesitamos acceso a tu galería para subir una foto.",
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      setUploading(true);
      try {
        const uri = result.assets[0].uri;
        const fileExt = uri.split(".").pop() ?? "jpg";
        const fileName = `${user?.id}/${Date.now()}.${fileExt}`;

        // Sube la imagen a Supabase Storage (bucket: avatars)
        const formData = new FormData();
        formData.append("file", {
          uri,
          name: fileName,
          type: `image/${fileExt}`,
        } as any);

        const { error } = await supabase.storage
          .from("avatars")
          .upload(fileName, formData, { contentType: `image/${fileExt}` });

        if (error) throw error;

        const { data: urlData } = supabase.storage
          .from("avatars")
          .getPublicUrl(fileName);

        // Guardar URL en el perfil
        await updateProfile({ avatar_url: urlData.publicUrl });
        setAvatarUri(urlData.publicUrl);
      } catch (err: any) {
        Alert.alert("Error", "No se pudo subir la foto: " + err.message);
      }
      setUploading(false);
    }
  };

  // ── Guardar y finalizar ──
  const handleFinish = async () => {
    if (!user?.id) return;
    setSaving(true);

    try {
      // Actualizar el barbero
      const { error: barberErr } = await supabase
        .from("barbers")
        .update({
          city: city,
          address: address || null,
          bio: bio || null,
        })
        .eq("profile_id", user.id);

      if (barberErr) throw barberErr;

      // 2. Insertar disponibilidad (borrar las anteriores primero)
      const { data: barberRow } = await supabase
        .from("barbers")
        .select("id")
        .eq("profile_id", user.id)
        .single();

      if (!barberRow) throw new Error("No se encontró el barbero");

      await supabase
        .from("availability")
        .delete()
        .eq("barber_id", barberRow.id);

      const slotsToInsert = Object.entries(schedule)
        .filter(([, slot]) => slot.enabled)
        .map(([dayStr, slot]) => ({
          barber_id: barberRow.id,
          day_of_week: parseInt(dayStr),
          start_time: slot.start,
          end_time: slot.end,
          is_active: true,
        }));

      if (slotsToInsert.length > 0) {
        const { error: availErr } = await supabase
          .from("availability")
          .insert(slotsToInsert);
        if (availErr) throw availErr;
      }

      // 3. Navegar al planner
      router.replace("/(barber)/planner");
    } catch (err: any) {
      Alert.alert("Error", err.message ?? "No se pudo guardar la información.");
    }
    setSaving(false);
  };

  const canContinue =
    (step === 1 && city.trim().length > 0) || step === 2 || step === 3;

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        {step > 1 ? (
          <TouchableOpacity
            onPress={() => setStep((s) => (s - 1) as 1 | 2 | 3)}
            style={styles.backBtn}
          >
            <Text style={styles.backText}>←</Text>
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
          />
        )}
        {step === 2 && (
          <StepPhoto
            avatarUri={avatarUri}
            onPickPhoto={pickPhoto}
            uploading={uploading}
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

      {/* CTA */}
      <View style={styles.ctaBar}>
        <TouchableOpacity
          style={[
            styles.ctaBtn,
            (!canContinue || saving) && styles.ctaBtnDisabled,
          ]}
          onPress={() => {
            if (step < 3) setStep((s) => (s + 1) as 1 | 2 | 3);
            else handleFinish();
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

// ─── Estilos base ─────────────────────────────────────────
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

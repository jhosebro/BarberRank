// app/(client)/review.tsx
// Pantalla para dejar reseña después de una cita completada

import { router, useLocalSearchParams } from "expo-router";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useReviews } from "../../hooks/useReviews";
import { notifyBookingChange } from "../../lib/notifications";

// ─── Etiquetas por rating ─────────────────────────────────
const RATING_LABELS: Record<
  number,
  { label: string; emoji: string; color: string }
> = {
  1: { label: "Muy malo", emoji: "😞", color: "#e06060" },
  2: { label: "Malo", emoji: "😕", color: "#c08040" },
  3: { label: "Regular", emoji: "😐", color: "#888780" },
  4: { label: "Bueno", emoji: "😊", color: "#4caf7d" },
  5: { label: "Excelente", emoji: "🤩", color: "#D4A853" },
};

// ─── Selector de estrellas ────────────────────────────────
function StarSelector({
  rating,
  onSelect,
}: {
  rating: number;
  onSelect: (r: number) => void;
}) {
  const scalesRef = useRef(
    Array.from({ length: 5 }, () => new Animated.Value(1)),
  );
  const scales = scalesRef.current;

  const handlePress = (star: number) => {
    onSelect(star);
    // Anima la estrella seleccionada
    Animated.sequence([
      Animated.spring(scales[star - 1], {
        toValue: 1.4,
        useNativeDriver: true,
        speed: 30,
      }),
      Animated.spring(scales[star - 1], {
        toValue: 1.0,
        useNativeDriver: true,
        speed: 20,
      }),
    ]).start();
  };

  const cfg = rating > 0 ? RATING_LABELS[rating] : null;

  return (
    <View style={star.wrap}>
      <View style={star.row}>
        {[1, 2, 3, 4, 5].map((s) => (
          <TouchableOpacity
            key={s}
            onPress={() => handlePress(s)}
            activeOpacity={0.7}
          >
            <Animated.Text
              style={[
                star.icon,
                { transform: [{ scale: scales[s - 1] }] },
                s <= rating ? star.iconFilled : star.iconEmpty,
              ]}
            >
              ★
            </Animated.Text>
          </TouchableOpacity>
        ))}
      </View>

      {cfg && (
        <View style={[star.labelWrap, { borderColor: cfg.color }]}>
          <Text style={star.labelEmoji}>{cfg.emoji}</Text>
          <Text style={[star.labelText, { color: cfg.color }]}>
            {cfg.label}
          </Text>
        </View>
      )}
    </View>
  );
}

const star = StyleSheet.create({
  wrap: { alignItems: "center", marginVertical: 24 },
  row: { flexDirection: "row", gap: 12, marginBottom: 16 },
  icon: { fontSize: 44 },
  iconFilled: { color: "#D4A853" },
  iconEmpty: { color: "#2a2a2a" },
  labelWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    backgroundColor: "#1a1a10",
  },
  labelEmoji: { fontSize: 18 },
  labelText: { fontSize: 15, fontWeight: "600" },
});

// ─── Chips de comentarios rápidos ─────────────────────────
const QUICK_COMMENTS = [
  "Excelente corte",
  "Muy puntual",
  "Lugar limpio",
  "Muy amable",
  "Buen precio",
  "Lo recomiendo",
  "Cumplió mis expectativas",
  "Volvería de nuevo",
];

function QuickComments({
  selected,
  onToggle,
}: {
  selected: string[];
  onToggle: (c: string) => void;
}) {
  return (
    <View style={qc.wrap}>
      <Text style={qc.title}>Toca para agregar rápido</Text>
      <View style={qc.chips}>
        {QUICK_COMMENTS.map((c) => {
          const isSelected = selected.includes(c);
          return (
            <TouchableOpacity
              key={c}
              style={[qc.chip, isSelected && qc.chipSelected]}
              onPress={() => onToggle(c)}
            >
              <Text style={[qc.chipText, isSelected && qc.chipTextSelected]}>
                {isSelected ? "✓ " : ""}
                {c}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const qc = StyleSheet.create({
  wrap: { marginBottom: 20 },
  title: { fontSize: 12, color: "#666", marginBottom: 10 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#1e1e1e",
    borderWidth: 0.5,
    borderColor: "#2a2a2a",
  },
  chipSelected: { backgroundColor: "#2a1a00", borderColor: "#D4A853" },
  chipText: { fontSize: 12, color: "#888" },
  chipTextSelected: { color: "#D4A853", fontWeight: "600" },
});

// ─── Pantalla principal ───────────────────────────────────
export default function ReviewScreen() {
  const { bookingId, barberId, barberName, serviceName } =
    useLocalSearchParams<{
      bookingId: string;
      barberId: string;
      barberName: string;
      serviceName: string;
    }>();

  const { submitReview, submitting } = useReviews();

  const [rating, setRating] = useState(0);
  const [quickSelected, setQuickSelected] = useState<string[]>([]);
  const [comment, setComment] = useState("");

  const toggleQuick = (c: string) => {
    setQuickSelected((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c],
    );
  };

  // Combina quick comments + texto libre
  const buildComment = () => {
    const parts = [...quickSelected];
    if (comment.trim()) parts.push(comment.trim());
    return parts.join(". ");
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert(
        "Selecciona una calificación",
        "Toca las estrellas para calificar.",
      );
      return;
    }

    const result = await submitReview({
      bookingId,
      barberId,
      rating,
      comment: buildComment(),
    });

    if (result.success) {
      // Notificar al barbero que recibió una reseña
      try {
        await notifyBookingChange(bookingId, "booking_completed");
      } catch {
        // Silencioso
      }

      router.replace({
        pathname: "/(client)/review-success",
        params: { barberName, rating: String(rating) },
      });
    } else {
      Alert.alert("Error", result.error ?? "No se pudo enviar la reseña.");
    }
  };

  const cfg = rating > 0 ? RATING_LABELS[rating] : null;

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Deja tu reseña</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.skipText}>Omitir</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Info del servicio */}
        <View style={styles.serviceCard}>
          <View style={styles.serviceAvatar}>
            <Text style={styles.serviceAvatarText}>✂️</Text>
          </View>
          <View>
            <Text style={styles.barberName}>{barberName}</Text>
            <Text style={styles.serviceName}>{serviceName}</Text>
          </View>
        </View>

        {/* Pregunta */}
        <Text style={styles.question}>¿Cómo fue tu experiencia?</Text>

        {/* Estrellas */}
        <StarSelector rating={rating} onSelect={setRating} />

        {/* Quick comments (solo si hay rating) */}
        {rating > 0 && (
          <>
            <QuickComments selected={quickSelected} onToggle={toggleQuick} />

            {/* Campo libre */}
            <Text style={styles.label}>Cuéntanos más (opcional)</Text>
            <TextInput
              style={styles.textArea}
              placeholder={
                cfg
                  ? `¿Qué fue lo que más te gustó de ${barberName}?`
                  : "Escribe tu opinión..."
              }
              placeholderTextColor="#555"
              value={comment}
              onChangeText={setComment}
              multiline
              numberOfLines={4}
              maxLength={400}
              textAlignVertical="top"
            />
            <Text style={styles.charCount}>{comment.length}/400</Text>
          </>
        )}

        {/* Aviso de publicación */}
        {rating > 0 && (
          <View style={styles.notice}>
            <Text style={styles.noticeText}>
              Tu reseña será visible en el perfil público de {barberName} y
              ayudará a otros clientes a elegir su barbero.
            </Text>
          </View>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* CTA */}
      <View style={styles.ctaBar}>
        <TouchableOpacity
          style={[
            styles.ctaBtn,
            (rating === 0 || submitting) && styles.ctaBtnDisabled,
          ]}
          onPress={handleSubmit}
          disabled={rating === 0 || submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#1a0f00" />
          ) : (
            <Text style={styles.ctaBtnText}>
              {rating === 0 ? "Selecciona una calificación" : "Publicar reseña"}
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
  headerTitle: { fontSize: 17, fontWeight: "600", color: "#fff" },
  skipText: { fontSize: 13, color: "#666" },
  scroll: { paddingHorizontal: 20, paddingTop: 20 },
  serviceCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: "#1e1e1e",
    borderRadius: 14,
    padding: 14,
    marginBottom: 28,
    borderWidth: 0.5,
    borderColor: "#2a2a2a",
  },
  serviceAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#2a2a2a",
    alignItems: "center",
    justifyContent: "center",
  },
  serviceAvatarText: { fontSize: 22 },
  barberName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 3,
  },
  serviceName: { fontSize: 13, color: "#888" },
  question: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
    textAlign: "center",
  },
  label: { fontSize: 13, color: "#aaa", marginBottom: 8 },
  textArea: {
    backgroundColor: "#1e1e1e",
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    color: "#fff",
    borderWidth: 0.5,
    borderColor: "#2a2a2a",
    minHeight: 100,
  },
  charCount: {
    fontSize: 11,
    color: "#555",
    textAlign: "right",
    marginTop: 4,
    marginBottom: 20,
  },
  notice: {
    backgroundColor: "#1a1a1a",
    borderRadius: 10,
    padding: 12,
    borderWidth: 0.5,
    borderColor: "#2a2a2a",
  },
  noticeText: { fontSize: 12, color: "#666", lineHeight: 18 },
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

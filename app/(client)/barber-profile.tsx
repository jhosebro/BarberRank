// app/(client)/barber-profile.tsx
// Perfil completo del barbero — header con foto, tabs Servicios / Reseñas, disponibilidad

import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  BarberAvailability,
  BarberReview,
  BarberService,
  useBarberProfile,
} from "../../hooks/useBarberProfile";

const HEADER_H = 280;

const DAY_NAMES = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

// ─── Estrellas ────────────────────────────────────────────
function Stars({ rating }: { rating: number }) {
  return (
    <View style={{ flexDirection: "row", gap: 2 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Text
          key={i}
          style={{
            fontSize: 13,
            color: i <= Math.round(rating) ? "#D4A853" : "#444",
          }}
        >
          ★
        </Text>
      ))}
    </View>
  );
}

// ─── Tab: Servicios ───────────────────────────────────────
function ServicesTab({
  services,
  onBook,
}: {
  services: BarberService[];
  onBook: (service: BarberService) => void;
}) {
  if (!services.length) {
    return (
      <View style={styles.emptyTab}>
        <Text style={styles.emptyTabText}>
          Este barbero aún no tiene servicios registrados.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.tabContent}>
      {services.map((s) => (
        <View key={s.id} style={styles.serviceRow}>
          <View style={styles.serviceInfo}>
            <Text style={styles.serviceName}>{s.name}</Text>
            {s.description && (
              <Text style={styles.serviceDesc} numberOfLines={2}>
                {s.description}
              </Text>
            )}
            <View style={styles.serviceMeta}>
              <View style={styles.durationChip}>
                <Text style={styles.durationText}>⏱ {s.duration_min} min</Text>
              </View>
            </View>
          </View>
          <View style={styles.serviceRight}>
            <Text style={styles.servicePrice}>
              ${s.price.toLocaleString("es-CO")}
            </Text>
            <TouchableOpacity style={styles.bookChip} onPress={() => onBook(s)}>
              <Text style={styles.bookChipText}>Reservar</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </View>
  );
}

// ─── Tab: Reseñas ─────────────────────────────────────────
function ReviewsTab({ reviews }: { reviews: BarberReview[] }) {
  if (!reviews.length) {
    return (
      <View style={styles.emptyTab}>
        <Text style={styles.emptyTabText}>
          Aún no hay reseñas para este barbero.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.tabContent}>
      {reviews.map((r) => {
        const name = r.client?.full_name ?? "Cliente";
        const initials = name
          .split(" ")
          .slice(0, 2)
          .map((w) => w[0])
          .join("")
          .toUpperCase();
        const date = new Date(r.created_at).toLocaleDateString("es-CO", {
          day: "numeric",
          month: "short",
          year: "numeric",
        });

        return (
          <View key={r.id} style={styles.reviewCard}>
            <View style={styles.reviewHeader}>
              <View style={styles.reviewAvatar}>
                {r.client?.avatar_url ? (
                  <Image
                    source={{ uri: r.client.avatar_url }}
                    style={styles.reviewAvatarImg}
                  />
                ) : (
                  <Text style={styles.reviewAvatarInitials}>{initials}</Text>
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.reviewName}>{name}</Text>
                <Text style={styles.reviewDate}>{date}</Text>
              </View>
              <Stars rating={r.rating} />
            </View>
            {r.comment && <Text style={styles.reviewComment}>{r.comment}</Text>}
          </View>
        );
      })}
    </View>
  );
}

// ─── Sección disponibilidad ───────────────────────────────
function AvailabilitySection({
  availability,
}: {
  availability: BarberAvailability[];
}) {
  if (!availability.length) return null;

  const sorted = [...availability].sort(
    (a, b) => a.day_of_week - b.day_of_week,
  );

  const fmt = (t: string) => {
    const [h, m] = t.split(":");
    const hour = parseInt(h);
    const ampm = hour >= 12 ? "pm" : "am";
    const h12 = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${h12}:${m} ${ampm}`;
  };

  return (
    <View style={styles.availSection}>
      <Text style={styles.availTitle}>Horarios de atención</Text>
      <View style={styles.availGrid}>
        {DAY_NAMES.map((day, i) => {
          const slot = sorted.find((s) => s.day_of_week === i);
          return (
            <View
              key={i}
              style={[styles.availDay, !slot && styles.availDayOff]}
            >
              <Text
                style={[styles.availDayName, !slot && styles.availDayNameOff]}
              >
                {day}
              </Text>
              {slot ? (
                <Text style={styles.availTime}>
                  {fmt(slot.start_time)}
                  {"\n"}
                  {fmt(slot.end_time)}
                </Text>
              ) : (
                <Text style={styles.availClosed}>Cerrado</Text>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}

// ─── Pantalla principal ───────────────────────────────────
export default function BarberProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { barber, loading, error } = useBarberProfile(id ?? null);
  const [activeTab, setActiveTab] = useState<"services" | "reviews">(
    "services",
  );
  const scrollY = useRef(new Animated.Value(0)).current;

  // Header parallax
  const headerTranslate = scrollY.interpolate({
    inputRange: [0, HEADER_H],
    outputRange: [0, -HEADER_H / 3],
    extrapolate: "clamp",
  });
  const headerOpacity = scrollY.interpolate({
    inputRange: [HEADER_H - 80, HEADER_H],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  const handleBook = (service?: BarberService) => {
    router.push({
      pathname: "/(client)/booking",
      params: {
        barberId: barber?.id,
        serviceId: service?.id ?? "",
      },
    });
  };

  // ── Loading ──
  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color="#D4A853" />
      </SafeAreaView>
    );
  }

  // ── Error ──
  if (error || !barber) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.errorText}>No se pudo cargar el perfil.</Text>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtnError}
        >
          <Text style={styles.backBtnErrorText}>Volver</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const name = barber.profile?.full_name ?? "Barbero";
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  const minPrice = barber.services?.length
    ? Math.min(...barber.services.map((s) => s.price))
    : null;

  return (
    <View style={styles.container}>
      {/* ── Sticky navbar que aparece al hacer scroll ── */}
      <Animated.View style={[styles.stickyNav, { opacity: headerOpacity }]}>
        <SafeAreaView>
          <View style={styles.stickyNavInner}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.navBack}
            >
              <Text style={styles.navBackText}>←</Text>
            </TouchableOpacity>
            <Text style={styles.stickyNavTitle} numberOfLines={1}>
              {name}
            </Text>
            <View style={{ width: 36 }} />
          </View>
        </SafeAreaView>
      </Animated.View>

      {/* ── Botón atrás flotante (visible cuando el header es visible) ── */}
      <Animated.View
        style={[
          styles.floatingBack,
          {
            opacity: headerOpacity.interpolate({
              inputRange: [0, 1],
              outputRange: [1, 0],
            }),
          },
        ]}
      >
        <SafeAreaView>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.floatingBackBtn}
          >
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>
        </SafeAreaView>
      </Animated.View>

      <Animated.ScrollView
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true },
        )}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header / Banner ── */}
        <Animated.View
          style={[
            styles.headerWrap,
            { transform: [{ translateY: headerTranslate }] },
          ]}
        >
          {barber.profile?.avatar_url ? (
            <Image
              source={{ uri: barber.profile.avatar_url }}
              style={styles.banner}
            />
          ) : (
            <View style={styles.bannerFallback}>
              <Text style={styles.bannerInitials}>{initials}</Text>
            </View>
          )}
          <View style={styles.bannerOverlay} />
        </Animated.View>

        {/* ── Info card sobre el banner ── */}
        <View style={styles.infoCard}>
          {/* Avatar circular */}
          <View style={styles.avatarCircleWrap}>
            {barber.profile?.avatar_url ? (
              <Image
                source={{ uri: barber.profile.avatar_url }}
                style={styles.avatarCircle}
              />
            ) : (
              <View style={[styles.avatarCircle, styles.avatarCircleFallback]}>
                <Text style={styles.avatarCircleInitials}>{initials}</Text>
              </View>
            )}
          </View>

          <View style={styles.infoMain}>
            <Text style={styles.infoName}>{name}</Text>
            <Text style={styles.infoCity}>
              📍 {barber.city}
              {barber.address ? ` · ${barber.address}` : ""}
            </Text>

            <View style={styles.infoStats}>
              <View style={styles.statItem}>
                <Stars rating={barber.rating} />
                <Text style={styles.statValue}>
                  {barber.rating?.toFixed(1)}
                </Text>
                <Text style={styles.statLabel}>
                  ({barber.review_count} reseñas)
                </Text>
              </View>
              {minPrice !== null && <View style={styles.statDivider} />}
              {minPrice !== null && (
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>
                    Desde ${minPrice.toLocaleString("es-CO")}
                  </Text>
                </View>
              )}
            </View>

            {barber.bio && <Text style={styles.infoBio}>{barber.bio}</Text>}
          </View>

          {/* Disponibilidad */}
          <AvailabilitySection availability={barber.availability ?? []} />

          {/* ── Tabs ── */}
          <View style={styles.tabBar}>
            {(["services", "reviews"] as const).map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[
                  styles.tabBtn,
                  activeTab === tab && styles.tabBtnActive,
                ]}
                onPress={() => setActiveTab(tab)}
              >
                <Text
                  style={[
                    styles.tabBtnText,
                    activeTab === tab && styles.tabBtnTextActive,
                  ]}
                >
                  {tab === "services"
                    ? `Servicios (${barber.services?.length ?? 0})`
                    : `Reseñas (${barber.reviews?.length ?? 0})`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {activeTab === "services" ? (
            <ServicesTab services={barber.services ?? []} onBook={handleBook} />
          ) : (
            <ReviewsTab reviews={barber.reviews ?? []} />
          )}

          <View style={{ height: 120 }} />
        </View>
      </Animated.ScrollView>

      {/* ── CTA fijo abajo ── */}
      <View style={styles.ctaBar}>
        <SafeAreaView>
          <TouchableOpacity style={styles.ctaBtn} onPress={() => handleBook()}>
            <Text style={styles.ctaBtnText}>Reservar cita</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </View>
    </View>
  );
}

// ─── Estilos ──────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f0f0f" },
  centered: {
    flex: 1,
    backgroundColor: "#0f0f0f",
    alignItems: "center",
    justifyContent: "center",
  },
  errorText: { color: "#888", fontSize: 15, marginBottom: 16 },
  backBtnError: {
    backgroundColor: "#D4A853",
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 10,
  },
  backBtnErrorText: { color: "#1a0f00", fontWeight: "600" },

  // Sticky nav
  stickyNav: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: "#0f0f0f",
    borderBottomWidth: 0.5,
    borderBottomColor: "#2a2a2a",
  },
  stickyNavInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  stickyNavTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    textAlign: "center",
  },

  // Floating back
  floatingBack: { position: "absolute", top: 0, left: 0, zIndex: 20 },
  floatingBackBtn: {
    margin: 5,
    width: 56,
    height: 56,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 20,
  },
  navBack: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  navBackText: { fontSize: 22, color: "#fff" },

  // Banner / header
  headerWrap: { height: HEADER_H, overflow: "hidden" },
  banner: { width: "100%", height: "100%", resizeMode: "cover" },
  bannerFallback: {
    width: "100%",
    height: "100%",
    backgroundColor: "#1e1e1e",
    alignItems: "center",
    justifyContent: "center",
  },
  bannerInitials: {
    fontSize: 80,
    fontWeight: "700",
    color: "#D4A853",
    opacity: 0.3,
  },
  bannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
  },

  // Info card
  infoCard: {
    backgroundColor: "#0f0f0f",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -24,
    paddingTop: 0,
  },
  avatarCircleWrap: {
    marginTop: -44,
    marginLeft: 20,
    marginBottom: 12,
  },
  avatarCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 3,
    borderColor: "#0f0f0f",
    resizeMode: "cover",
  },
  avatarCircleFallback: {
    backgroundColor: "#2a2a2a",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarCircleInitials: { fontSize: 30, fontWeight: "700", color: "#D4A853" },

  infoMain: { paddingHorizontal: 20, paddingBottom: 16 },
  infoName: { fontSize: 24, fontWeight: "700", color: "#fff", marginBottom: 4 },
  infoCity: { fontSize: 13, color: "#888", marginBottom: 12 },
  infoStats: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  statItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  statValue: { fontSize: 14, fontWeight: "600", color: "#fff" },
  statLabel: { fontSize: 12, color: "#666" },
  statDivider: { width: 1, height: 16, backgroundColor: "#2a2a2a" },
  infoBio: { fontSize: 14, color: "#aaa", lineHeight: 20 },

  // Disponibilidad
  availSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderTopWidth: 0.5,
    borderTopColor: "#1e1e1e",
    paddingTop: 16,
  },
  availTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 12,
  },
  availGrid: { flexDirection: "row", gap: 6 },
  availDay: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "#1e1e1e",
    borderRadius: 10,
    paddingVertical: 8,
    borderWidth: 0.5,
    borderColor: "#2a2a2a",
  },
  availDayOff: { backgroundColor: "#141414", opacity: 0.5 },
  availDayName: {
    fontSize: 11,
    fontWeight: "600",
    color: "#D4A853",
    marginBottom: 4,
  },
  availDayNameOff: { color: "#555" },
  availTime: {
    fontSize: 9,
    color: "#aaa",
    textAlign: "center",
    lineHeight: 13,
  },
  availClosed: { fontSize: 9, color: "#444" },

  // Tabs
  tabBar: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginBottom: 4,
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
  tabBtnText: { fontSize: 13, color: "#888", fontWeight: "500" },
  tabBtnTextActive: { color: "#1a0f00", fontWeight: "700" },

  // Tab content
  tabContent: { paddingHorizontal: 20, paddingTop: 16, gap: 12 },
  emptyTab: { padding: 32, alignItems: "center" },
  emptyTabText: { color: "#555", fontSize: 14, textAlign: "center" },

  // Servicio
  serviceRow: {
    flexDirection: "row",
    backgroundColor: "#1e1e1e",
    borderRadius: 14,
    padding: 14,
    borderWidth: 0.5,
    borderColor: "#2a2a2a",
    gap: 12,
  },
  serviceInfo: { flex: 1 },
  serviceName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 4,
  },
  serviceDesc: { fontSize: 12, color: "#888", lineHeight: 17, marginBottom: 8 },
  serviceMeta: { flexDirection: "row" },
  durationChip: {
    backgroundColor: "#2a2a2a",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  durationText: { fontSize: 11, color: "#aaa" },
  serviceRight: { alignItems: "flex-end", justifyContent: "space-between" },
  servicePrice: { fontSize: 16, fontWeight: "700", color: "#D4A853" },
  bookChip: {
    backgroundColor: "#D4A853",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  bookChipText: { fontSize: 12, fontWeight: "600", color: "#1a0f00" },

  // Reseña
  reviewCard: {
    backgroundColor: "#1e1e1e",
    borderRadius: 14,
    padding: 14,
    borderWidth: 0.5,
    borderColor: "#2a2a2a",
  },
  reviewHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },
  reviewAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#2a2a2a",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  reviewAvatarImg: { width: 40, height: 40 },
  reviewAvatarInitials: { fontSize: 15, fontWeight: "600", color: "#D4A853" },
  reviewName: { fontSize: 14, fontWeight: "600", color: "#fff" },
  reviewDate: { fontSize: 11, color: "#666", marginTop: 1 },
  reviewComment: { fontSize: 13, color: "#aaa", lineHeight: 19 },

  // CTA
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
  },
  ctaBtn: {
    backgroundColor: "#D4A853",
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
  },
  ctaBtnText: { color: "#1a0f00", fontSize: 16, fontWeight: "700" },
});

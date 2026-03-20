// app/(client)/discovery.tsx
// Pantalla principal del cliente — explorar barberos por ciudad

import { router } from "expo-router";
import { useCallback, useState } from "react";
import {
  FlatList,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../hooks/useAuth";
import { useBarbers } from "../../hooks/useBarbers";

// ─── Tipos ────────────────────────────────────────────────
interface Service {
  name: string;
  price: number;
}

interface BarberItem {
  id: string;
  city: string;
  rating: number;
  review_count: number;
  lat: number | null;
  lng: number | null;
  profile: { full_name: string; avatar_url: string | null };
  services: Service[];
}

// ─── Constantes ───────────────────────────────────────────
const CITIES = [
  "Todas",
  "Tuluá",
  "Cali",
  "Bogotá",
  "Medellín",
  "Barranquilla",
  "Bucaramanga",
];
const PRICE_FILTERS = [
  { label: "Cualquier precio", value: null },
  { label: "Hasta $20K", value: 20000 },
  { label: "Hasta $40K", value: 40000 },
  { label: "Hasta $60K", value: 60000 },
];
const SERVICE_FILTERS = [
  { label: "Todos", value: null },
  { label: "Corte", value: "corte" },
  { label: "Barba", value: "barba" },
  { label: "Corte + barba", value: "corte + barba" },
  { label: "Afeitado clásico", value: "afeitado" },
];

// ─── Componente: card de barbero ──────────────────────────
function BarberCard({
  item,
  onPress,
}: {
  item: BarberItem;
  onPress: () => void;
}) {
  const name = item.profile?.full_name ?? "Barbero";
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((w: string) => w[0])
    .join("")
    .toUpperCase();

  const minPrice = item.services?.length
    ? Math.min(...item.services.map((s) => s.price))
    : null;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.85}
    >
      {/* Avatar */}
      <View style={styles.cardAvatarWrap}>
        {item.profile?.avatar_url ? (
          <Image
            source={{ uri: item.profile.avatar_url }}
            style={styles.cardAvatar}
          />
        ) : (
          <View style={styles.cardAvatarFallback}>
            <Text style={styles.cardAvatarInitials}>{initials}</Text>
          </View>
        )}
        {/* Badge rating */}
        <View style={styles.ratingBadge}>
          <Text style={styles.ratingText}>
            ★ {item.rating?.toFixed(1) ?? "—"}
          </Text>
        </View>
      </View>

      {/* Info */}
      <View style={styles.cardBody}>
        <Text style={styles.cardName} numberOfLines={1}>
          {name}
        </Text>
        <Text style={styles.cardCity} numberOfLines={1}>
          📍 {item.city}
        </Text>

        {/* Servicios */}
        {item.services?.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.servicesRow}
          >
            {item.services.slice(0, 4).map((s, i) => (
              <View key={i} style={styles.serviceChip}>
                <Text style={styles.serviceChipText}>{s.name}</Text>
              </View>
            ))}
          </ScrollView>
        )}

        {/* Precio desde */}
        {minPrice !== null && (
          <Text style={styles.cardPrice}>
            Desde{" "}
            <Text style={styles.cardPriceValue}>
              ${minPrice.toLocaleString("es-CO")}
            </Text>
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

// ─── Componente: skeleton loader ──────────────────────────
function SkeletonCard() {
  return (
    <View style={[styles.card, styles.skeletonCard]}>
      <View style={[styles.cardAvatarWrap, styles.skeletonAvatar]} />
      <View style={styles.cardBody}>
        <View style={styles.skeletonLine} />
        <View style={[styles.skeletonLine, { width: "50%", marginTop: 6 }]} />
        <View style={[styles.skeletonLine, { width: "80%", marginTop: 10 }]} />
      </View>
    </View>
  );
}

// ─── Pantalla principal ───────────────────────────────────
export default function DiscoveryScreen() {
  const { profile, signOut } = useAuth();

  const [search, setSearch] = useState("");
  const [city, setCity] = useState("Tuluá");
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [serviceFilter, setService] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const { barbers, loading, refetch } = useBarbers({
    city: city === "Todas" ? undefined : city,
    search,
    maxPrice,
    serviceFilter,
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const activeFilters =
    (maxPrice !== null ? 1 : 0) + (serviceFilter !== null ? 1 : 0);

  return (
    <SafeAreaView style={styles.safe}>
      <FlatList
        data={barbers}
        keyExtractor={(item, index) => item.id || String(index)}
        renderItem={({ item }) => (
          <BarberCard
            item={item}
            onPress={() =>
              router.push({
                pathname: "/(client)/barber-profile",
                params: { id: item.id },
              })
            }
          />
        )}
        ListEmptyComponent={
          loading && !refreshing ? (
            <FlatList
              data={[1, 2, 3]}
              horizontal={false}
              renderItem={() => <SkeletonCard />}
              numColumns={1}
            />
          ) : (
            <View style={styles.empty}>
              <Text>Sin barberos disponibles</Text>
            </View>
          )
        }
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#D4A853"
          />
        }
        ListHeaderComponent={
          <>
            {/* ── Header ── */}
            <View style={styles.header}>
              <View>
                <Text style={styles.headerGreeting}>
                  Hola, {profile?.full_name?.split(" ")[0] ?? "👋"}
                </Text>
                <Text style={styles.headerSub}>¿A qué barbero vas hoy?</Text>
              </View>
              <TouchableOpacity
                style={styles.logoutBtn}
                onPress={() => router.push("/(client)/my-bookings")}
              >
                <Text style={{ color: "#D4A853", fontSize: 13 }}>
                  Mis citas
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={signOut} style={styles.logoutBtn}>
                <Text style={styles.logoutText}>Salir</Text>
              </TouchableOpacity>
            </View>
            {/* ── Buscador ── */}
            <View style={styles.searchRow}>
              <View style={styles.searchBox}>
                <Text style={styles.searchIcon}>🔍</Text>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Buscar barbero..."
                  placeholderTextColor="#666"
                  value={search}
                  onChangeText={setSearch}
                  returnKeyType="search"
                  clearButtonMode="while-editing"
                />
              </View>
              <TouchableOpacity
                style={[
                  styles.filterBtn,
                  activeFilters > 0 && styles.filterBtnActive,
                ]}
                onPress={() => setShowFilters(true)}
              >
                <Text style={styles.filterIcon}>⚙️</Text>
                {activeFilters > 0 && (
                  <View style={styles.filterBadge}>
                    <Text style={styles.filterBadgeText}>{activeFilters}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
            {/* ── Selector de ciudad ── */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.cityRow}
            >
              {CITIES.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[styles.cityChip, city === c && styles.cityChipActive]}
                  onPress={() => setCity(c)}
                >
                  <Text
                    numberOfLines={1}
                    ellipsizeMode="tail"
                    style={[
                      styles.cityChipText,
                      city === c && styles.cityChipTextActive,
                    ]}
                  >
                    {c}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            {/* ── Resultados ── */}
            <View style={styles.resultsHeader}>
              <Text style={styles.resultsCount}>
                {loading
                  ? "Buscando..."
                  : `${barbers.length} barberos en ${city}`}
              </Text>
            </View>
          </>
        }
      />

      {/* ── Modal de filtros ── */}
      <Modal
        visible={showFilters}
        animationType="slide"
        transparent
        onRequestClose={() => setShowFilters(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowFilters(false)}
        >
          <Pressable style={styles.modalSheet} onPress={() => {}}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Filtros</Text>

            {/* Precio */}
            <Text style={styles.filterSection}>Precio máximo</Text>
            <View style={styles.filterOptions}>
              {PRICE_FILTERS.map((p) => (
                <TouchableOpacity
                  key={String(p.value)}
                  style={[
                    styles.filterOption,
                    maxPrice === p.value && styles.filterOptionActive,
                  ]}
                  onPress={() => setMaxPrice(p.value)}
                >
                  <Text
                    style={[
                      styles.filterOptionText,
                      maxPrice === p.value && styles.filterOptionTextActive,
                    ]}
                  >
                    {p.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Servicio */}
            <Text style={styles.filterSection}>Servicio</Text>
            <View style={styles.filterOptions}>
              {SERVICE_FILTERS.map((s) => (
                <TouchableOpacity
                  key={String(s.value)}
                  style={[
                    styles.filterOption,
                    serviceFilter === s.value && styles.filterOptionActive,
                  ]}
                  onPress={() => setService(s.value)}
                >
                  <Text
                    style={[
                      styles.filterOptionText,
                      serviceFilter === s.value &&
                        styles.filterOptionTextActive,
                    ]}
                  >
                    {s.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={styles.applyBtn}
              onPress={() => setShowFilters(false)}
            >
              <Text style={styles.applyBtnText}>
                Aplicar{activeFilters > 0 ? ` (${activeFilters})` : ""}
              </Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Estilos ──────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0f0f0f" },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 12,
  },
  headerGreeting: { fontSize: 22, fontWeight: "700", color: "#fff" },
  headerSub: { fontSize: 13, color: "#888", marginTop: 2 },
  logoutBtn: { padding: 8 },
  logoutText: { color: "#666", fontSize: 13 },

  // Búsqueda
  searchRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 12,
  },
  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1e1e1e",
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  searchIcon: { fontSize: 14, marginRight: 8 },
  searchInput: { flex: 1, height: 44, color: "#fff", fontSize: 15 },
  filterBtn: {
    width: 44,
    height: 44,
    backgroundColor: "#1e1e1e",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  filterBtnActive: { borderColor: "#D4A853", backgroundColor: "#1e1a10" },
  filterIcon: { fontSize: 16 },
  filterBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    backgroundColor: "#D4A853",
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  filterBadgeText: { fontSize: 9, fontWeight: "700", color: "#1a0f00" },

  // Ciudades
  cityRow: { paddingHorizontal: 20, gap: 12, marginBottom: 8 },
  cityChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#1e1e1e",
    borderWidth: 1,
    borderColor: "#2a2a2a",
    maxHeight: 32,
  },
  cityChipActive: { backgroundColor: "#D4A853", borderColor: "#D4A853" },
  cityChipText: { fontSize: 13, color: "#aaa" },
  cityChipTextActive: { color: "#1a0f00", fontWeight: "600" },

  // Resultados
  resultsHeader: { paddingHorizontal: 20, marginBottom: 2, marginTop: 12 },
  resultsCount: { fontSize: 12, color: "#666" },
  list: { paddingHorizontal: 20, paddingBottom: 32, gap: 12 },

  // Card
  card: {
    backgroundColor: "#1e1e1e",
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  cardAvatarWrap: { position: "relative", height: 160 },
  cardAvatar: { width: "100%", height: "100%", resizeMode: "cover" },
  cardAvatarFallback: {
    width: "100%",
    height: "100%",
    backgroundColor: "#2a2a2a",
    alignItems: "center",
    justifyContent: "center",
  },
  cardAvatarInitials: { fontSize: 40, fontWeight: "700", color: "#D4A853" },
  ratingBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(0,0,0,0.75)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#D4A853",
  },
  ratingText: { color: "#D4A853", fontSize: 12, fontWeight: "600" },
  cardBody: { padding: 14 },
  cardName: { fontSize: 17, fontWeight: "700", color: "#fff", marginBottom: 3 },
  cardCity: { fontSize: 12, color: "#888" },
  servicesRow: { marginTop: 10, marginBottom: 6 },
  serviceChip: {
    backgroundColor: "#2a2a2a",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 6,
  },
  serviceChipText: { fontSize: 11, color: "#ccc" },
  cardPrice: { fontSize: 12, color: "#888", marginTop: 4 },
  cardPriceValue: { color: "#D4A853", fontWeight: "600" },

  // Skeleton
  skeletonCard: { padding: 14 },
  skeletonAvatar: { height: 160, backgroundColor: "#2a2a2a", borderRadius: 10 },
  skeletonLine: {
    height: 14,
    backgroundColor: "#2a2a2a",
    borderRadius: 6,
    width: "70%",
  },

  // Empty state
  empty: { alignItems: "center", paddingTop: 60, paddingHorizontal: 32 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
  },
  clearBtn: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: "#D4A853",
    borderRadius: 10,
  },
  clearBtnText: { color: "#1a0f00", fontWeight: "600", fontSize: 14 },

  // Modal filtros
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: "#181818",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: "#444",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 20,
  },
  filterSection: {
    fontSize: 13,
    color: "#888",
    marginBottom: 10,
    marginTop: 16,
  },
  filterOptions: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  filterOption: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "#2a2a2a",
    borderWidth: 1,
    borderColor: "#333",
  },
  filterOptionActive: { borderColor: "#D4A853", backgroundColor: "#1e1a10" },
  filterOptionText: { fontSize: 13, color: "#aaa" },
  filterOptionTextActive: { color: "#D4A853", fontWeight: "600" },
  applyBtn: {
    backgroundColor: "#D4A853",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 28,
  },
  applyBtnText: { color: "#1a0f00", fontSize: 16, fontWeight: "600" },
});

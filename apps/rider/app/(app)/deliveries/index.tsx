import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import axios, { AxiosError } from "axios";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Order } from "@/types";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("en-NG", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function OrderCard({ order, onPress }: { order: Order; onPress: () => void }) {
  const addr = order.delivery_address;
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.cardHeader}>
        <Text style={styles.orderId}>
          #{order.id.slice(0, 8).toUpperCase()}
        </Text>
        <Text style={styles.time}>{formatDate(order.updated_at)}</Text>
      </View>
      <Text style={styles.customerName}>{addr.name}</Text>
      <Text style={styles.address} numberOfLines={2}>
        {addr.address}
        {addr.area ? `, ${addr.area}` : ""}, {addr.city}
      </Text>
      <View style={styles.cardFooter}>
        <Text style={styles.itemCount}>
          {order.items.length} item{order.items.length !== 1 ? "s" : ""}
        </Text>
        <View style={styles.statusPill}>
          <Text style={styles.statusPillText}>Out for delivery</Text>
        </View>
      </View>
    </Pressable>
  );
}

export default function DeliveriesScreen() {
  const router = useRouter();
  const { logout } = useAuth();

  const { data, isLoading, isError, refetch, isRefetching, error } = useQuery<
    Order[]
  >({
    queryKey: ["my-orders"],
    queryFn: async () => {
      const { data } = await api.get<Order[]>("/riders/me/orders");
      return data;
    },
  });

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1B4332" />
      </View>
    );
  }
  console.log(error);

  if (isError) {
    const axiosErr = error as AxiosError;

    console.debug('[Deliveries] query error', {
      status: axiosErr?.response?.status,
      message: axiosErr?.message,
      data: axiosErr?.response?.data,
    });

    if (axiosErr?.response?.status === 403) {
      // If the token is not a rider or session is unauthorized, force sign-out.
      console.debug('[Deliveries] 403 unauthorized; logging out and redirecting');
      logout().catch(() => null);
      router.replace("/(auth)/login");
      return (
        <View style={styles.centered}>
          <Text style={styles.errorText}>Unauthorized: redirecting to login...</Text>
        </View>
      );
    }

    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Failed to load deliveries</Text>
        <Pressable onPress={() => refetch()} style={styles.retryButton}>
          <Text style={styles.retryText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Deliveries</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countBadgeText}>{data?.length ?? 0} active</Text>
        </View>
      </View>

      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        contentContainerStyle={
          data?.length === 0 ? styles.emptyContainer : styles.list
        }
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor="#1B4332"
            colors={["#1B4332"]}
          />
        }
        renderItem={({ item }) => (
          <OrderCard
            order={item}
            onPress={() => router.push(`/(app)/deliveries/${item.id}`)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyTitle}>No active deliveries</Text>
            <Text style={styles.emptySubtitle}>Pull down to refresh</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FEFAE0" },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#FEFAE0",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#1B4332",
  },
  headerTitle: { fontSize: 20, fontWeight: "700", color: "#FEFAE0" },
  countBadge: {
    backgroundColor: "#D4A017",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  countBadgeText: { fontSize: 12, fontWeight: "600", color: "#7a5500" },
  list: { padding: 12, gap: 10 },
  emptyContainer: { flex: 1 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    gap: 4,
    borderWidth: 0.5,
    borderColor: "#F4EAC8",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  orderId: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1B4332",
    fontFamily: "monospace",
  },
  time: { fontSize: 12, color: "#5C5C5C" },
  customerName: { fontSize: 15, fontWeight: "600", color: "#1B1B1B" },
  address: { fontSize: 13, color: "#5C5C5C", lineHeight: 18 },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 6,
  },
  itemCount: { fontSize: 13, color: "#5C5C5C" },
  statusPill: {
    backgroundColor: "#FEFAE0",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 0.5,
    borderColor: "#F4EAC8",
  },
  statusPillText: { fontSize: 11, fontWeight: "600", color: "#7a5500" },
  empty: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 120,
    gap: 8,
  },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 17, fontWeight: "600", color: "#1B1B1B" },
  emptySubtitle: { fontSize: 14, color: "#5C5C5C" },
  errorText: { fontSize: 15, color: "#C4622D" },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "#1B4332",
    borderRadius: 8,
  },
  retryText: { color: "#FEFAE0", fontWeight: "600" },
});

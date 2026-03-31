import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useOrders } from "@/hooks/useOrders";
import { OrderCard } from "@/molecules/OrderCard";
import { LoadingScreen } from "@/atoms/LoadingScreen";
import { CountBadge } from "@/atoms/Badge";
import DeliveryIcon from "../../components/DeliveryIcon";

export default function DeliveriesScreen() {
  const router = useRouter();
  const { data, isLoading, isError, refetch, isRefetching } = useOrders();

  if (isLoading) return <LoadingScreen />;

  if (isError) {
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
        <CountBadge count={data?.length ?? 0} suffix=" active" />
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
            <DeliveryIcon size={48} />
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
  list: { padding: 12, gap: 10 },
  emptyContainer: { flex: 1 },
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

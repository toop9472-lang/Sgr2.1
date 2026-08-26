// طير — Orders (buyer/seller/carrier)
import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { ordersApi } from "../services/tairApi";

const statusMeta = {
  pending: { color: "#0891b2", label: "قيد الانتظار", icon: "time-outline" },
  accepted_by_carrier: { color: "#eab308", label: "قبله الموصل", icon: "checkmark-circle-outline" },
  in_transit: { color: "#f59e0b", label: "في الطريق", icon: "car" },
  delivered: { color: "#10b981", label: "تم التسليم", icon: "checkmark-done-outline" },
  completed: { color: "#065f46", label: "مكتمل", icon: "trophy-outline" },
  disputed: { color: "#dc2626", label: "نزاع", icon: "alert-circle" },
  cancelled: { color: "#94a3b8", label: "ملغى", icon: "close-circle-outline" },
};

const roleLabel = {
  buyer: "كمشتري",
  seller: "كبائع",
  carrier: "كموصل",
  all: "جميع الأدوار",
};

function OrderCard({ order, onPress }) {
  const meta = statusMeta[order.status] || statusMeta.pending;
  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.85}
      onPress={() => onPress(order)}
      data-testid={`order-card-${order.order_id}`}
    >
      <View style={styles.rowBetween}>
        <View
          style={[
            styles.statusPill,
            { backgroundColor: meta.color + "22" },
          ]}
        >
          <Ionicons name={meta.icon} size={13} color={meta.color} />
          <Text style={[styles.statusText, { color: meta.color }]}>{meta.label}</Text>
        </View>
        <Text style={styles.orderId}>#{order.order_id.slice(-6)}</Text>
      </View>

      <View style={styles.priceRow}>
        <Text style={styles.price}>{order.agreed_price_sar} ر.س</Text>
        {order.delivery_fee_hint_sar ? (
          <Text style={styles.deliveryHint}>
            + {order.delivery_fee_hint_sar} ر.س توصيل (إرشادي)
          </Text>
        ) : null}
      </View>

      <View style={styles.partiesRow}>
        <Party icon="storefront-outline" label="البائع" id={order.seller_id} />
        <Party icon="person-outline" label="المشتري" id={order.buyer_id} />
        {order.carrier_id ? (
          <Party icon="car-outline" label="الموصل" id={order.carrier_id} />
        ) : null}
      </View>

      <View style={styles.timestampRow}>
        <Ionicons name="time-outline" size={12} color="#94a3b8" />
        <Text style={styles.timestamp}>
          {order.created_at ? new Date(order.created_at).toLocaleString("ar-SA") : ""}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

function Party({ icon, label, id }) {
  return (
    <View style={styles.party}>
      <Ionicons name={icon} size={14} color="#10b981" />
      <View>
        <Text style={styles.partyLabel}>{label}</Text>
        <Text style={styles.partyId}>#{id?.slice(-6) || "-"}</Text>
      </View>
    </View>
  );
}

export default function OrdersScreen({ user, onOpenOrder }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [role, setRole] = useState("all");

  const load = useCallback(async () => {
    try {
      const userId = user?.user_id || user?.id;
      if (!userId) {
        setOrders([]);
        setLoading(false);
        return;
      }
      const res = await ordersApi.byUser(userId, role);
      setOrders(res.items || []);
    } catch (e) {
      setOrders([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, role]);

  useEffect(() => {
    load();
  }, [load]);

  const renderHeader = (
    <View>
      <LinearGradient
        colors={["#c8fce6", "#a7f3d0"]}
        style={styles.hero}
      >
        <Text style={styles.heroTitle}>طلباتي</Text>
        <Text style={styles.heroSubtitle}>تابع جميع صفقاتك في مكان واحد</Text>
      </LinearGradient>
      <View style={styles.rolesBar}>
        {["all", "buyer", "seller", "carrier"].map((r) => (
          <TouchableOpacity
            key={r}
            style={[styles.roleChip, role === r && styles.roleChipActive]}
            onPress={() => setRole(r)}
            data-testid={`role-filter-${r}`}
          >
            <Text style={[styles.roleText, role === r && styles.roleTextActive]}>
              {roleLabel[r]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={orders}
        keyExtractor={(o) => o.order_id}
        renderItem={({ item }) => <OrderCard order={item} onPress={onOpenOrder} />}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator color="#10b981" size="large" style={{ marginTop: 40 }} />
          ) : (
            <View style={styles.empty}>
              <Ionicons name="cube-outline" size={64} color="#a7f3d0" />
              <Text style={styles.emptyTitle}>لا توجد طلبات</Text>
              <Text style={styles.emptyText}>ستظهر هنا طلباتك من البيع أو الشراء أو التوصيل</Text>
            </View>
          )
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
            tintColor="#10b981"
          />
        }
        contentContainerStyle={{ paddingBottom: 120 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  hero: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 16,
  },
  heroTitle: { fontSize: 24, fontWeight: "800", color: "#065f46", textAlign: "right" },
  heroSubtitle: { fontSize: 13, color: "#0f766e", marginTop: 2, textAlign: "right" },

  rolesBar: {
    flexDirection: "row-reverse",
    padding: 10,
    gap: 6,
    backgroundColor: "#fff",
  },
  roleChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
  },
  roleChipActive: { backgroundColor: "#065f46" },
  roleText: { color: "#475569", fontSize: 12, fontWeight: "700" },
  roleTextActive: { color: "#fff" },

  card: {
    backgroundColor: "#fff",
    marginHorizontal: 14,
    marginTop: 10,
    borderRadius: 16,
    padding: 14,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  rowBetween: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusPill: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusText: { fontSize: 11, fontWeight: "700" },
  orderId: { fontSize: 12, color: "#94a3b8", fontWeight: "700" },

  priceRow: { marginTop: 10 },
  price: { fontSize: 22, fontWeight: "800", color: "#065f46", textAlign: "right" },
  deliveryHint: { fontSize: 11, color: "#64748b", textAlign: "right", marginTop: 2 },

  partiesRow: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },
  party: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 4,
  },
  partyLabel: { fontSize: 10, color: "#94a3b8", fontWeight: "600" },
  partyId: { fontSize: 11, color: "#0f172a", fontWeight: "700" },

  timestampRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 3,
    marginTop: 8,
  },
  timestamp: { fontSize: 10, color: "#94a3b8" },

  empty: { alignItems: "center", padding: 40, gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: "#334155" },
  emptyText: { fontSize: 13, color: "#64748b", textAlign: "center" },
});

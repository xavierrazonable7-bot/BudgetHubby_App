import React, { useCallback } from "react";
import {
  View, Text, StyleSheet, Modal, Pressable,
  FlatList, Animated, Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "@/context/ThemeContext";
import { useNotifications, AppNotification } from "@/context/NotificationContext";

interface Props {
  visible: boolean;
  onClose: () => void;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  if (mins < 1)   return "Just now";
  if (mins < 60)  return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return new Date(iso).toLocaleDateString("en-PH", { month: "short", day: "numeric" });
}

function NotifCard({ item }: { item: AppNotification }) {
  const { theme, isDark } = useTheme();
  const { markRead } = useNotifications();

  return (
    <Pressable
      onPress={() => markRead(item.id)}
      style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}
    >
      <LinearGradient
        colors={isDark ? [item.color + "14", item.color + "07"] : [item.color + "0C", item.color + "04"]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={[
          styles.card,
          {
            borderColor: item.color + (item.read ? "18" : "30"),
            shadowColor: item.color,
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: isDark ? 0.15 : 0.06,
            shadowRadius: 8,
            elevation: 3,
            opacity: item.read ? 0.65 : 1,
          },
        ]}
      >
        {/* Left stripe */}
        <View style={[styles.cardStripe, { backgroundColor: item.read ? theme.border : item.color }]} />

        {/* Icon */}
        <View style={[styles.cardIcon, { backgroundColor: item.color + "20", borderColor: item.color + "35", borderWidth: 1.5 }]}>
          <Ionicons name={item.icon as any} size={18} color={item.color} />
        </View>

        {/* Content */}
        <View style={styles.cardContent}>
          <View style={styles.cardTopRow}>
            <Text style={[styles.cardTitle, { color: item.read ? theme.textSecondary : theme.text }]} numberOfLines={1}>
              {item.title}
            </Text>
            {!item.read && <View style={[styles.unreadDot, { backgroundColor: item.color }]} />}
          </View>
          <Text style={[styles.cardBody, { color: theme.textSecondary }]} numberOfLines={2}>
            {item.body}
          </Text>
          <Text style={[styles.cardTime, { color: theme.textTertiary }]}>{timeAgo(item.createdAt)}</Text>
        </View>
      </LinearGradient>
    </Pressable>
  );
}

export function NotificationsModal({ visible, onClose }: Props) {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { notifications, unreadCount, permStatus, requestPermission, markAllRead } = useNotifications();

  const bgGradient: [string, string, string] = isDark
    ? ["#0E0E0E", "#140810", "#0E0E0E"]
    : ["#F0F0F5", "#EDE8F5", "#F0F0F5"];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      {/* Backdrop */}
      <Pressable style={styles.backdrop} onPress={onClose} />

      {/* Sheet */}
      <LinearGradient
        colors={bgGradient}
        style={[
          styles.sheet,
          { paddingBottom: insets.bottom + 24 },
        ]}
      >
        {/* Handle */}
        <View style={[styles.handle, { backgroundColor: isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.12)" }]} />

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={[styles.bellWrap, { backgroundColor: "#E05A6D18", borderColor: "#E05A6D35", borderWidth: 1 }]}>
              <Ionicons name="notifications" size={18} color="#E05A6D" />
            </View>
            <View>
              <Text style={[styles.headerTitle, { color: theme.text }]}>Notifications</Text>
              <Text style={[styles.headerSub, { color: theme.textTertiary }]}>
                {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
              </Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            {unreadCount > 0 && (
              <Pressable
                onPress={markAllRead}
                style={({ pressed }) => [
                  styles.readAllBtn,
                  { backgroundColor: "#E05A6D18", borderColor: "#E05A6D35", borderWidth: 1, opacity: pressed ? 0.7 : 1 },
                ]}
              >
                <Ionicons name="checkmark-done-outline" size={14} color="#E05A6D" />
                <Text style={[styles.readAllText, { color: "#E05A6D" }]}>All read</Text>
              </Pressable>
            )}
            <Pressable
              onPress={onClose}
              style={[styles.closeBtn, { backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)" }]}
            >
              <Ionicons name="close" size={18} color={theme.textSecondary} />
            </Pressable>
          </View>
        </View>

        {/* Permission Banner */}
        {permStatus !== "granted" && Platform.OS !== "web" && (
          <Pressable
            onPress={requestPermission}
            style={({ pressed }) => [
              styles.permBanner,
              { backgroundColor: isDark ? "#1C1230" : "#F0EBFF", borderColor: "#6366F130", opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <View style={[styles.permIconWrap, { backgroundColor: "#6366F120" }]}>
              <Ionicons name="notifications-off-outline" size={18} color="#6366F1" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.permTitle, { color: theme.text }]}>Enable Device Notifications</Text>
              <Text style={[styles.permBody, { color: theme.textSecondary }]}>
                Tap to allow Timpla to send you task and event reminders.
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#6366F1" />
          </Pressable>
        )}

        {/* Notification List */}
        <FlatList
          data={notifications}
          keyExtractor={(n) => n.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, gap: 10 }}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={[styles.emptyIcon, { backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)" }]}>
                <Ionicons name="notifications-outline" size={32} color={theme.textTertiary} />
              </View>
              <Text style={[styles.emptyTitle, { color: theme.textSecondary }]}>No Notifications</Text>
              <Text style={[styles.emptySub, { color: theme.textTertiary }]}>
                You'll be notified about tasks, events, and budget alerts here.
              </Text>
            </View>
          }
          renderItem={({ item }) => <NotifCard item={item} />}
        />
      </LinearGradient>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: "78%",
    overflow: "hidden",
  },
  handle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  bellWrap: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  headerSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 1 },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  readAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
  },
  readAllText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },

  /* Permission Banner */
  permBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginHorizontal: 20,
    marginBottom: 8,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  permIconWrap: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  permTitle: { fontSize: 13, fontFamily: "Inter_600SemiBold", marginBottom: 2 },
  permBody: { fontSize: 11, fontFamily: "Inter_400Regular", lineHeight: 16 },

  /* Notification card */
  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    borderRadius: 16,
    paddingVertical: 14,
    paddingRight: 14,
    paddingLeft: 16,
    gap: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  cardStripe: {
    position: "absolute",
    left: 0, top: 0, bottom: 0,
    width: 3,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 4,
  },
  cardContent: { flex: 1, gap: 4 },
  cardTopRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  cardTitle: { flex: 1, fontSize: 14, fontFamily: "Inter_600SemiBold" },
  unreadDot: { width: 8, height: 8, borderRadius: 4 },
  cardBody: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18 },
  cardTime: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 },

  /* Empty */
  emptyState: { alignItems: "center", paddingTop: 40, gap: 12 },
  emptyIcon: { width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center" },
  emptyTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  emptySub: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center", maxWidth: 260, lineHeight: 20 },
});

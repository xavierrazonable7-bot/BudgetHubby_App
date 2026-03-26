import React from "react";
import {
  View, Text, StyleSheet, Pressable, ScrollView, Platform,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useTheme } from "@/context/ThemeContext";
import { useNotifications, AppNotification } from "@/context/NotificationContext";

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-PH", { month: "short", day: "numeric" });
}

function NotifCard({ item, index }: { item: AppNotification; index: number }) {
  const { theme, isDark } = useTheme();
  const { markRead } = useNotifications();

  return (
    <Animated.View entering={FadeInDown.delay(index * 50).duration(350)}>
      <Pressable
        onPress={() => markRead(item.id)}
        style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}
      >
        <LinearGradient
          colors={isDark ? [item.color + "12", item.color + "06"] : [item.color + "0A", item.color + "03"]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={[
            styles.card,
            {
              borderColor: item.read ? (isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)") : item.color + "28",
              opacity: item.read ? 0.7 : 1,
            },
          ]}
        >
          <View style={[styles.cardStripe, { backgroundColor: item.read ? (isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)") : item.color }]} />

          <View style={[styles.cardIcon, { backgroundColor: item.color + "18" }]}>
            <Ionicons name={item.icon as any} size={20} color={item.color} />
          </View>

          <View style={styles.cardContent}>
            <View style={styles.cardTitleRow}>
              <Text
                style={[styles.cardTitle, { color: item.read ? theme.textSecondary : theme.text }]}
                numberOfLines={1}
              >
                {item.title}
              </Text>
              {!item.read && <View style={[styles.unreadDot, { backgroundColor: item.color }]} />}
            </View>
            <Text style={[styles.cardBody, { color: theme.textSecondary }]} numberOfLines={3}>
              {item.body}
            </Text>
            <View style={styles.cardFooter}>
              <Text style={[styles.cardTime, { color: theme.textTertiary }]}>{timeAgo(item.createdAt)}</Text>
              {!item.read && (
                <View style={[styles.newBadge, { backgroundColor: item.color + "18" }]}>
                  <Text style={[styles.newBadgeText, { color: item.color }]}>New</Text>
                </View>
              )}
            </View>
          </View>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

export default function NotificationsScreen() {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { notifications, unreadCount, markAllRead, permStatus, requestPermission } = useNotifications();

  const bgGradient: [string, string, string] = isDark
    ? ["#0E0E0E", "#140810", "#0E0E0E"]
    : ["#F0F0F5", "#EDE8F5", "#F0F0F5"];

  return (
    <LinearGradient colors={bgGradient} style={styles.container}>
      <View style={{ paddingTop: Platform.OS === "web" ? 67 : insets.top + 8 }}>
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.backBtn,
              { backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)", opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Ionicons name="arrow-back" size={20} color={theme.text} />
          </Pressable>

          <View style={styles.headerCenter}>
            <Text style={[styles.headerTitle, { color: theme.text }]}>Notifications</Text>
            {unreadCount > 0 && (
              <View style={[styles.headerBadge, { backgroundColor: theme.primary + "20" }]}>
                <Text style={[styles.headerBadgeText, { color: theme.primary }]}>{unreadCount}</Text>
              </View>
            )}
          </View>

          {unreadCount > 0 ? (
            <Pressable
              onPress={markAllRead}
              style={({ pressed }) => [
                styles.markAllBtn,
                { backgroundColor: theme.primary + "14", borderColor: theme.primary + "30", opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <Ionicons name="checkmark-done" size={16} color={theme.primary} />
            </Pressable>
          ) : (
            <View style={{ width: 40 }} />
          )}
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 40 }]}
      >
        {permStatus !== "granted" && Platform.OS !== "web" && (
          <Animated.View entering={FadeInDown.duration(300)}>
            <Pressable
              onPress={requestPermission}
              style={({ pressed }) => [
                styles.permBanner,
                { backgroundColor: isDark ? "#1C1230" : "#F0EBFF", borderColor: "#6366F130", opacity: pressed ? 0.85 : 1 },
              ]}
            >
              <View style={[styles.permIconWrap, { backgroundColor: "#6366F120" }]}>
                <Ionicons name="notifications-off-outline" size={20} color="#6366F1" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.permTitle, { color: theme.text }]}>Enable Notifications</Text>
                <Text style={[styles.permBody, { color: theme.textSecondary }]}>
                  Allow push notifications to get reminders for tasks and events.
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#6366F1" />
            </Pressable>
          </Animated.View>
        )}

        {unreadCount > 0 && (
          <Animated.View entering={FadeInDown.delay(50).duration(300)}>
            <Text style={[styles.sectionLabel, { color: theme.textTertiary }]}>UNREAD</Text>
          </Animated.View>
        )}
        {notifications.filter((n) => !n.read).map((item, idx) => (
          <NotifCard key={item.id} item={item} index={idx} />
        ))}

        {notifications.some((n) => n.read) && (
          <>
            <Animated.View entering={FadeInDown.delay(100).duration(300)}>
              <Text style={[styles.sectionLabel, { color: theme.textTertiary, marginTop: unreadCount > 0 ? 20 : 0 }]}>
                {unreadCount > 0 ? "EARLIER" : "ALL NOTIFICATIONS"}
              </Text>
            </Animated.View>
            {notifications.filter((n) => n.read).map((item, idx) => (
              <NotifCard key={item.id} item={item} index={idx + unreadCount} />
            ))}
          </>
        )}

        {notifications.length === 0 && (
          <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.emptyState}>
            <View style={[styles.emptyIconWrap, { backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)" }]}>
              <Ionicons name="notifications-outline" size={40} color={theme.textTertiary} />
            </View>
            <Text style={[styles.emptyTitle, { color: theme.textSecondary }]}>All Caught Up!</Text>
            <Text style={[styles.emptySub, { color: theme.textTertiary }]}>
              You'll be notified about tasks, events, and budget alerts here.
            </Text>
          </Animated.View>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginBottom: 4,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: "center", justifyContent: "center",
  },
  headerCenter: { flexDirection: "row", alignItems: "center", gap: 8 },
  headerTitle: { fontSize: 20, fontFamily: "Inter_700Bold" },
  headerBadge: {
    minWidth: 22, height: 22, borderRadius: 11,
    alignItems: "center", justifyContent: "center",
    paddingHorizontal: 6,
  },
  headerBadgeText: { fontSize: 12, fontFamily: "Inter_700Bold" },
  markAllBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: "center", justifyContent: "center",
    borderWidth: 1,
  },

  listContent: { paddingHorizontal: 20, gap: 10 },

  sectionLabel: {
    fontSize: 12, fontFamily: "Inter_600SemiBold",
    letterSpacing: 1, marginBottom: 6, marginTop: 4,
  },

  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    borderRadius: 16,
    paddingVertical: 16,
    paddingRight: 16,
    paddingLeft: 18,
    gap: 14,
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
    width: 44, height: 44, borderRadius: 22,
    alignItems: "center", justifyContent: "center",
    marginTop: 2,
  },
  cardContent: { flex: 1, gap: 5 },
  cardTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  cardTitle: { flex: 1, fontSize: 15, fontFamily: "Inter_600SemiBold" },
  unreadDot: { width: 8, height: 8, borderRadius: 4 },
  cardBody: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 19 },
  cardFooter: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 2 },
  cardTime: { fontSize: 12, fontFamily: "Inter_400Regular" },
  newBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  newBadgeText: { fontSize: 10, fontFamily: "Inter_600SemiBold" },

  permBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  permIconWrap: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  permTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold", marginBottom: 2 },
  permBody: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 17 },

  emptyState: { alignItems: "center", paddingTop: 80, gap: 14 },
  emptyIconWrap: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center" },
  emptyTitle: { fontSize: 18, fontFamily: "Inter_600SemiBold" },
  emptySub: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", maxWidth: 280, lineHeight: 21 },
});

import React, { useEffect, useRef, useState } from "react";
import {
  View, Text, StyleSheet, Modal, Pressable,
  ScrollView, Animated, Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
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

function NotifItem({ item, isLast }: { item: AppNotification; isLast: boolean }) {
  const { theme, isDark } = useTheme();
  const { markRead } = useNotifications();

  return (
    <Pressable
      onPress={() => markRead(item.id)}
      style={({ pressed }) => [
        styles.item,
        !isLast && { borderBottomWidth: 1, borderBottomColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)" },
        !item.read && { backgroundColor: isDark ? "rgba(224,90,109,0.06)" : "rgba(224,90,109,0.04)" },
        { opacity: pressed ? 0.8 : 1 },
      ]}
    >
      <View style={[styles.itemIcon, { backgroundColor: item.color + "18" }]}>
        <Ionicons name={item.icon as any} size={18} color={item.color} />
      </View>
      <View style={styles.itemContent}>
        <View style={styles.itemTitleRow}>
          <Text
            style={[styles.itemTitle, { color: item.read ? theme.textSecondary : theme.text }]}
            numberOfLines={1}
          >
            {item.title}
          </Text>
          {!item.read && <View style={[styles.unreadDot, { backgroundColor: item.color }]} />}
        </View>
        <Text style={[styles.itemBody, { color: theme.textSecondary }]} numberOfLines={2}>
          {item.body}
        </Text>
        <Text style={[styles.itemTime, { color: theme.textTertiary }]}>{timeAgo(item.createdAt)}</Text>
      </View>
    </Pressable>
  );
}

export function NotificationsModal({ visible, onClose }: Props) {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { notifications, unreadCount, markAllRead } = useNotifications();

  const [internalVisible, setInternalVisible] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-12)).current;
  const animatingRef = useRef(false);

  useEffect(() => {
    if (visible && !internalVisible) {
      setInternalVisible(true);
      fadeAnim.setValue(0);
      slideAnim.setValue(-12);
      animatingRef.current = true;
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 220, useNativeDriver: true }),
      ]).start(() => { animatingRef.current = false; });
    } else if (!visible && internalVisible) {
      animatingRef.current = true;
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: -8, duration: 150, useNativeDriver: true }),
      ]).start(() => {
        animatingRef.current = false;
        setInternalVisible(false);
      });
    }
    return () => {
      if (animatingRef.current) {
        fadeAnim.stopAnimation();
        slideAnim.stopAnimation();
      }
    };
  }, [visible]);

  const handleClose = () => {
    onClose();
  };

  if (!internalVisible) return null;

  const topOffset = Platform.OS === "web" ? 67 + 56 : insets.top + 60;

  const panelBg = isDark ? theme.surface : "#FFFFFF";
  const panelBorder = isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.08)";
  const dividerColor = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)";

  return (
    <Modal transparent statusBarTranslucent visible={internalVisible} onRequestClose={handleClose}>
      <Animated.View style={[styles.backdropFill, { opacity: fadeAnim }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
      </Animated.View>

      <Animated.View
        style={[
          styles.dropdown,
          {
            top: topOffset,
            backgroundColor: panelBg,
            borderColor: panelBorder,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: isDark ? 0.5 : 0.15,
            shadowRadius: 24,
            elevation: 20,
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <View style={[styles.arrow, { borderBottomColor: panelBg }]} />

        <View style={[styles.header, { borderBottomColor: dividerColor }]}>
          <View>
            <Text style={[styles.headerTitle, { color: theme.text }]}>Notifications</Text>
            {unreadCount > 0 && (
              <Text style={[styles.headerSub, { color: theme.primary }]}>
                {unreadCount} unread
              </Text>
            )}
          </View>
          <View style={styles.headerActions}>
            {unreadCount > 0 && (
              <Pressable
                onPress={markAllRead}
                style={({ pressed }) => [styles.markAllBtn, { opacity: pressed ? 0.6 : 1 }]}
              >
                <Ionicons name="checkmark-done" size={16} color={theme.primary} />
                <Text style={[styles.markAllText, { color: theme.primary }]}>Read all</Text>
              </Pressable>
            )}
            <Pressable
              onPress={handleClose}
              style={({ pressed }) => [
                styles.closeBtn,
                { backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)", opacity: pressed ? 0.6 : 1 },
              ]}
            >
              <Ionicons name="close" size={16} color={theme.textSecondary} />
            </Pressable>
          </View>
        </View>

        {notifications.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIcon, { backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)" }]}>
              <Ionicons name="notifications-outline" size={28} color={theme.textTertiary} />
            </View>
            <Text style={[styles.emptyTitle, { color: theme.textSecondary }]}>All caught up!</Text>
            <Text style={[styles.emptySub, { color: theme.textTertiary }]}>
              No new notifications right now.
            </Text>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            style={styles.listScroll}
            bounces={false}
          >
            {notifications.map((item, idx) => (
              <NotifItem key={item.id} item={item} isLast={idx === notifications.length - 1} />
            ))}
          </ScrollView>
        )}

        {notifications.length > 0 && (
          <View style={[styles.footer, { borderTopColor: dividerColor }]}>
            <Text style={[styles.footerText, { color: theme.textTertiary }]}>
              {notifications.length} notification{notifications.length !== 1 ? "s" : ""}
            </Text>
          </View>
        )}
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdropFill: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  dropdown: {
    position: "absolute",
    right: 16,
    width: 340,
    maxWidth: "92%",
    maxHeight: 420,
    borderRadius: 20,
    borderWidth: 1,
    overflow: "hidden",
  },
  arrow: {
    position: "absolute",
    top: -8,
    right: 26,
    width: 0,
    height: 0,
    borderLeftWidth: 9,
    borderRightWidth: 9,
    borderBottomWidth: 9,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 17, fontFamily: "Inter_700Bold" },
  headerSub: { fontSize: 12, fontFamily: "Inter_500Medium", marginTop: 2 },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  markAllBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  markAllText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  closeBtn: { width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center" },

  listScroll: { maxHeight: 310 },

  item: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 18,
    paddingVertical: 14,
    gap: 12,
  },
  itemIcon: {
    width: 38, height: 38, borderRadius: 19,
    alignItems: "center", justifyContent: "center",
    marginTop: 2,
  },
  itemContent: { flex: 1, gap: 3 },
  itemTitleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  itemTitle: { flex: 1, fontSize: 14, fontFamily: "Inter_600SemiBold" },
  unreadDot: { width: 7, height: 7, borderRadius: 3.5 },
  itemBody: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 17 },
  itemTime: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 1 },

  emptyState: { alignItems: "center", paddingVertical: 36, gap: 10 },
  emptyIcon: { width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center" },
  emptyTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  emptySub: { fontSize: 12, fontFamily: "Inter_400Regular", textAlign: "center", maxWidth: 220 },

  footer: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    alignItems: "center",
    borderTopWidth: 1,
  },
  footerText: { fontSize: 11, fontFamily: "Inter_400Regular" },
});

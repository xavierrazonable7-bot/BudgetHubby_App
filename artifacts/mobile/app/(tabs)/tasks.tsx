import React, { useState, useMemo } from "react";
import {
  View, Text, StyleSheet, FlatList, Pressable,
  Platform, Alert,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInDown } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/context/ThemeContext";
import { useApp, Task, AcademicEvent, TaskPriority } from "@/context/AppContext";
import { ScreenWrapper } from "@/components/ScreenWrapper";
import { EmptyState } from "@/components/ui/EmptyState";

type Tab = "tasks" | "events";
type TaskFilter = "all" | "pending" | "completed";

const PRIORITY_CONFIG: Record<TaskPriority, { color: string; label: string; icon: string }> = {
  high:   { color: "#E05A6D", label: "High",   icon: "flame" },
  medium: { color: "#F59E0B", label: "Medium",  icon: "alert-circle" },
  low:    { color: "#2DD4BF", label: "Low",     icon: "chevron-down-circle" },
};

const EVENT_CONFIG: Record<string, { color: string; icon: string }> = {
  assignment: { color: "#6366F1", icon: "document-text" },
  quiz:       { color: "#F59E0B", icon: "help-circle" },
  exam:       { color: "#E05A6D", icon: "school" },
  personal:   { color: "#2DD4BF", icon: "person-circle" },
};

function daysUntil(dateStr: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function urgencyLabel(days: number): { text: string; color: string } {
  if (days < 0)  return { text: "Overdue",       color: "#E05A6D" };
  if (days === 0) return { text: "Due today",     color: "#F59E0B" };
  if (days === 1) return { text: "Due tomorrow",  color: "#F59E0B" };
  if (days <= 3)  return { text: `In ${days} days`, color: "#A78BFA" };
  return { text: `In ${days} days`, color: "#9CA3AF" };
}

export default function TasksScreen() {
  const { theme, isDark } = useTheme();
  const { tasks, updateTask, deleteTask, events, deleteEvent } = useApp();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<Tab>("tasks");
  const [taskFilter, setTaskFilter] = useState<TaskFilter>("all");

  const filteredTasks = useMemo(() => {
    let list = tasks;
    if (taskFilter === "pending")   list = list.filter((t) => !t.completed);
    if (taskFilter === "completed") list = list.filter((t) => t.completed);
    return list.sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }, [tasks, taskFilter]);

  const sortedEvents = useMemo(() =>
    [...events].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [events]
  );

  const pendingCount = tasks.filter((t) => !t.completed).length;
  const completedCount = tasks.filter((t) => t.completed).length;
  const upcomingCount = events.filter((e) => daysUntil(e.date) >= 0).length;

  const handleToggleTask = (task: Task) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    updateTask(task.id, { completed: !task.completed });
  };

  const handleDeleteTask = (id: string) => {
    Alert.alert("Delete Task", "Remove this task?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteTask(id) },
    ]);
  };

  const handleDeleteEvent = (id: string) => {
    Alert.alert("Delete Event", "Remove this event?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteEvent(id) },
    ]);
  };

  return (
    <ScreenWrapper>
      {/* Header */}
      <View style={[styles.header, { paddingTop: Platform.OS === "web" ? 67 : insets.top + 12 }]}>
        <View>
          <Text style={[styles.screenLabel, { color: theme.textSecondary }]}>Academics</Text>
          <Text style={[styles.title, { color: theme.text }]}>Tasks & Events</Text>
        </View>
        <Pressable
          onPress={() => router.push(tab === "tasks" ? "/add-task" : "/add-event")}
          style={({ pressed }) => [
            styles.addBtn,
            { backgroundColor: theme.primary, shadowColor: theme.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 10, elevation: 6, opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <Ionicons name="add" size={22} color="#fff" />
        </Pressable>
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        {[
          { label: "Pending", value: pendingCount, color: "#F59E0B" },
          { label: "Done", value: completedCount, color: "#2DD4BF" },
          { label: "Events", value: upcomingCount, color: "#6366F1" },
        ].map((s) => (
          <LinearGradient
            key={s.label}
            colors={[s.color + "18", s.color + "08"]}
            style={[styles.statCard, { borderColor: s.color + "28" }]}
          >
            <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>{s.label}</Text>
          </LinearGradient>
        ))}
      </View>

      {/* Tab Toggle */}
      <View style={[styles.tabRow, { backgroundColor: theme.surface, borderColor: isDark ? "rgba(255,255,255,0.07)" : theme.border, marginHorizontal: 20 }]}>
        {(["tasks", "events"] as Tab[]).map((t) => (
          <Pressable key={t} onPress={() => setTab(t)} style={{ flex: 1 }}>
            {tab === t ? (
              <LinearGradient
                colors={isDark ? ["#2A1018", "#2A1820"] : ["#FFE4E8", "#FFF0F2"]}
                style={[styles.tabBtn, { borderWidth: 1, borderColor: theme.primary + "40" }]}
              >
                <Ionicons name={t === "tasks" ? "checkbox" : "calendar"} size={14} color={theme.primary} />
                <Text style={[styles.tabText, { color: theme.primary }]}>{t === "tasks" ? "Tasks" : "Events"}</Text>
              </LinearGradient>
            ) : (
              <View style={[styles.tabBtn, { backgroundColor: "transparent" }]}>
                <Ionicons name={t === "tasks" ? "checkbox-outline" : "calendar-outline"} size={14} color={theme.textTertiary} />
                <Text style={[styles.tabText, { color: theme.textTertiary }]}>{t === "tasks" ? "Tasks" : "Events"}</Text>
              </View>
            )}
          </Pressable>
        ))}
      </View>

      {/* Task Filters */}
      {tab === "tasks" && (
        <View style={styles.filterRow}>
          {(["all", "pending", "completed"] as TaskFilter[]).map((f) => (
            <Pressable
              key={f}
              onPress={() => setTaskFilter(f)}
              style={[
                styles.filterChip,
                taskFilter === f
                  ? { backgroundColor: theme.primary + "20", borderColor: theme.primary + "50" }
                  : { backgroundColor: theme.surface, borderColor: isDark ? "rgba(255,255,255,0.07)" : theme.border },
              ]}
            >
              <Text style={[styles.filterText, { color: taskFilter === f ? theme.primary : theme.textSecondary }]}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      {/* Content */}
      {tab === "tasks" ? (
        <FlatList
          data={filteredTasks}
          keyExtractor={(t) => t.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 100, paddingTop: 8, gap: 10 }}
          ListEmptyComponent={<EmptyState icon="checkbox-outline" title="No tasks" subtitle="Add a task to stay on top of your work" />}
          renderItem={({ item: task, index }) => {
            const pc = PRIORITY_CONFIG[task.priority];
            return (
              <Animated.View entering={FadeInDown.delay(index * 40).duration(280)}>
                <Pressable
                  onLongPress={() => handleDeleteTask(task.id)}
                  style={({ pressed }) => [
                    styles.taskCard,
                    {
                      backgroundColor: theme.surface,
                      borderColor: task.completed ? (isDark ? "rgba(255,255,255,0.04)" : theme.border) : pc.color + "22",
                      shadowColor: task.completed ? "#000" : pc.color,
                      shadowOffset: { width: 0, height: 3 },
                      shadowOpacity: task.completed ? (isDark ? 0.3 : 0.05) : (isDark ? 0.2 : 0.08),
                      shadowRadius: 8, elevation: 3,
                      opacity: pressed ? 0.9 : 1,
                    },
                  ]}
                >
                  <Pressable
                    onPress={() => handleToggleTask(task)}
                    style={[
                      styles.checkbox,
                      task.completed
                        ? { backgroundColor: theme.income, borderColor: theme.income }
                        : { backgroundColor: "transparent", borderColor: pc.color },
                    ]}
                  >
                    {task.completed && <Ionicons name="checkmark" size={14} color="#fff" />}
                  </Pressable>

                  <View style={styles.taskInfo}>
                    <Text style={[styles.taskTitle, { color: task.completed ? theme.textTertiary : theme.text, textDecorationLine: task.completed ? "line-through" : "none" }]}>
                      {task.title}
                    </Text>
                    {task.description ? (
                      <Text style={[styles.taskDesc, { color: theme.textTertiary }]} numberOfLines={1}>{task.description}</Text>
                    ) : null}
                    <View style={styles.taskMeta}>
                      <View style={[styles.priorityBadge, { backgroundColor: pc.color + "18", borderColor: pc.color + "30" }]}>
                        <Ionicons name={pc.icon as any} size={10} color={pc.color} />
                        <Text style={[styles.priorityText, { color: pc.color }]}>{pc.label}</Text>
                      </View>
                      {task.deadline && (
                        <Text style={[styles.deadlineText, { color: daysUntil(task.deadline) < 0 ? theme.expense : theme.textTertiary }]}>
                          {urgencyLabel(daysUntil(task.deadline)).text}
                        </Text>
                      )}
                    </View>
                  </View>

                  <Pressable onPress={() => handleDeleteTask(task.id)} style={styles.deleteBtn}>
                    <Ionicons name="trash-outline" size={15} color={theme.textTertiary} />
                  </Pressable>
                </Pressable>
              </Animated.View>
            );
          }}
        />
      ) : (
        <FlatList
          data={sortedEvents}
          keyExtractor={(e) => e.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 100, paddingTop: 8, gap: 10 }}
          ListEmptyComponent={<EmptyState icon="calendar-outline" title="No events" subtitle="Add assignments, quizzes, or exams" />}
          renderItem={({ item: event, index }) => {
            const ec = EVENT_CONFIG[event.type] ?? { color: "#9CA3AF", icon: "calendar" };
            const days = daysUntil(event.date);
            const urg = urgencyLabel(days);
            return (
              <Animated.View entering={FadeInDown.delay(index * 40).duration(280)}>
                <LinearGradient
                  colors={[ec.color + "18", ec.color + "08"]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  style={[styles.eventCard, { borderColor: ec.color + "28", shadowColor: ec.color, shadowOffset: { width: 0, height: 3 }, shadowOpacity: isDark ? 0.2 : 0.08, shadowRadius: 8, elevation: 3 }]}
                >
                  <View style={[styles.eventIcon, { backgroundColor: ec.color + "20", borderWidth: 1, borderColor: ec.color + "30" }]}>
                    <Ionicons name={ec.icon as any} size={20} color={ec.color} />
                  </View>
                  <View style={styles.eventInfo}>
                    <View style={styles.eventTopRow}>
                      <Text style={[styles.eventTitle, { color: theme.text }]}>{event.title}</Text>
                      <View style={[styles.urgencyBadge, { backgroundColor: urg.color + "20" }]}>
                        <Text style={[styles.urgencyText, { color: urg.color }]}>{urg.text}</Text>
                      </View>
                    </View>
                    {event.description ? (
                      <Text style={[styles.eventDesc, { color: theme.textTertiary }]} numberOfLines={1}>{event.description}</Text>
                    ) : null}
                    <View style={styles.eventMeta}>
                      <View style={[styles.typeBadge, { backgroundColor: ec.color + "15" }]}>
                        <Text style={[styles.typeText, { color: ec.color }]}>{event.type.charAt(0).toUpperCase() + event.type.slice(1)}</Text>
                      </View>
                      <Text style={[styles.eventDate, { color: theme.textTertiary }]}>
                        {new Date(event.date).toLocaleDateString("en-PH", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </Text>
                    </View>
                  </View>
                  <Pressable onPress={() => handleDeleteEvent(event.id)} style={styles.deleteBtn}>
                    <Ionicons name="trash-outline" size={15} color={theme.textTertiary} />
                  </Pressable>
                </LinearGradient>
              </Animated.View>
            );
          }}
        />
      )}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", paddingHorizontal: 20, paddingBottom: 16 },
  screenLabel: { fontSize: 13, fontFamily: "Inter_400Regular", marginBottom: 2 },
  title: { fontSize: 28, fontFamily: "Inter_700Bold", letterSpacing: -0.4 },
  addBtn: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  statsRow: { flexDirection: "row", paddingHorizontal: 20, gap: 10, marginBottom: 16 },
  statCard: { flex: 1, borderRadius: 14, padding: 14, alignItems: "center", gap: 4, borderWidth: 1 },
  statValue: { fontSize: 22, fontFamily: "Inter_700Bold" },
  statLabel: { fontSize: 11, fontFamily: "Inter_400Regular" },
  tabRow: { flexDirection: "row", borderRadius: 14, padding: 4, marginBottom: 14, borderWidth: 1 },
  tabBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 10, borderRadius: 10, gap: 6 },
  tabText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  filterRow: { flexDirection: "row", paddingHorizontal: 20, paddingBottom: 12, gap: 8 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  filterText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  taskCard: { flexDirection: "row", alignItems: "center", borderRadius: 16, padding: 14, gap: 12, borderWidth: 1 },
  checkbox: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  taskInfo: { flex: 1, gap: 4 },
  taskTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  taskDesc: { fontSize: 12, fontFamily: "Inter_400Regular" },
  taskMeta: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 2 },
  priorityBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8, borderWidth: 1 },
  priorityText: { fontSize: 10, fontFamily: "Inter_600SemiBold" },
  deadlineText: { fontSize: 11, fontFamily: "Inter_400Regular" },
  deleteBtn: { padding: 6 },
  eventCard: { flexDirection: "row", alignItems: "flex-start", borderRadius: 16, padding: 14, gap: 12, borderWidth: 1 },
  eventIcon: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", marginTop: 2 },
  eventInfo: { flex: 1, gap: 5 },
  eventTopRow: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  eventTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold", flex: 1 },
  urgencyBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  urgencyText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  eventDesc: { fontSize: 12, fontFamily: "Inter_400Regular" },
  eventMeta: { flexDirection: "row", alignItems: "center", gap: 8 },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  typeText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  eventDate: { fontSize: 11, fontFamily: "Inter_400Regular" },
});

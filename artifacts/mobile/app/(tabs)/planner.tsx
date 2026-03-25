import React, { useState, useMemo } from "react";
import {
  View, Text, StyleSheet, FlatList, Pressable,
  Platform, Alert, ScrollView,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInDown } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/context/ThemeContext";
import { useApp, Task, AcademicEvent, Note, TaskPriority } from "@/context/AppContext";
import { ScreenWrapper } from "@/components/ScreenWrapper";
import { EmptyState } from "@/components/ui/EmptyState";
import { generateId } from "@/utils/format";

// ─── Types ────────────────────────────────────────────────────────────────────
type PlannerTab = "tasks" | "events" | "notes";
type TaskFilter = "all" | "pending" | "completed";

// ─── Config ───────────────────────────────────────────────────────────────────
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
  const now = new Date(); now.setHours(0, 0, 0, 0);
  const target = new Date(dateStr); target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function urgencyLabel(days: number): { text: string; color: string } {
  if (days < 0)   return { text: "Overdue",        color: "#E05A6D" };
  if (days === 0) return { text: "Due today",      color: "#F59E0B" };
  if (days === 1) return { text: "Due tomorrow",   color: "#F59E0B" };
  if (days <= 3)  return { text: `In ${days} days`, color: "#A78BFA" };
  return { text: `In ${days} days`, color: "#9CA3AF" };
}

// ─── Sub-screens ──────────────────────────────────────────────────────────────
function TasksPane() {
  const { theme, isDark } = useTheme();
  const { tasks, updateTask, deleteTask } = useApp();
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<TaskFilter>("all");

  const filtered = useMemo(() => {
    let list = tasks;
    if (filter === "pending")   list = list.filter((t) => !t.completed);
    if (filter === "completed") list = list.filter((t) => t.completed);
    return list.sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      const order: Record<TaskPriority, number> = { high: 0, medium: 1, low: 2 };
      return order[a.priority] - order[b.priority];
    });
  }, [tasks, filter]);

  const handleToggle = (task: Task) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    updateTask(task.id, { completed: !task.completed });
  };

  const handleDelete = (id: string) => {
    Alert.alert("Delete Task", "Remove this task?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteTask(id) },
    ]);
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Filter chips */}
      <View style={styles.filterRow}>
        {(["all", "pending", "completed"] as TaskFilter[]).map((f) => (
          <Pressable
            key={f}
            onPress={() => setFilter(f)}
            style={[
              styles.filterChip,
              filter === f
                ? { backgroundColor: theme.primary + "20", borderColor: theme.primary + "50" }
                : { backgroundColor: theme.surface, borderColor: isDark ? "rgba(255,255,255,0.07)" : theme.border },
            ]}
          >
            <Text style={[styles.filterText, { color: filter === f ? theme.primary : theme.textSecondary }]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </Pressable>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(t) => t.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 110, gap: 10 }}
        ListEmptyComponent={
          <EmptyState icon="checkbox-outline" title="No tasks" subtitle="Tap + to add a task" />
        }
        renderItem={({ item: task, index }) => {
          const pc = PRIORITY_CONFIG[task.priority];
          return (
            <Animated.View entering={FadeInDown.delay(index * 40).duration(280)}>
              <Pressable
                onPress={() => handleToggle(task)}
                onLongPress={() => handleDelete(task.id)}
                style={({ pressed }) => [
                  styles.taskCard,
                  {
                    backgroundColor: theme.surface,
                    borderColor: task.completed ? (isDark ? "rgba(255,255,255,0.04)" : theme.border) : pc.color + "22",
                    shadowColor: task.completed ? "#000" : pc.color,
                    shadowOffset: { width: 0, height: 3 }, shadowOpacity: task.completed ? (isDark ? 0.3 : 0.05) : (isDark ? 0.2 : 0.08),
                    shadowRadius: 8, elevation: 3, opacity: pressed ? 0.9 : 1,
                  },
                ]}
              >
                <View style={[
                  styles.checkCircle,
                  task.completed
                    ? { backgroundColor: theme.income, borderColor: theme.income }
                    : { backgroundColor: "transparent", borderColor: pc.color },
                ]}>
                  {task.completed && <Ionicons name="checkmark" size={13} color="#fff" />}
                </View>
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
                <Pressable onPress={() => handleDelete(task.id)} style={styles.deleteBtn} hitSlop={8}>
                  <Ionicons name="trash-outline" size={15} color={theme.textTertiary} />
                </Pressable>
              </Pressable>
            </Animated.View>
          );
        }}
      />
    </View>
  );
}

function EventsPane() {
  const { theme, isDark } = useTheme();
  const { events, deleteEvent } = useApp();
  const insets = useSafeAreaInsets();

  const sorted = useMemo(() =>
    [...events].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [events]
  );

  const handleDelete = (id: string) => {
    Alert.alert("Delete Event", "Remove this event?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteEvent(id) },
    ]);
  };

  return (
    <FlatList
      data={sorted}
      keyExtractor={(e) => e.id}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 110, gap: 10 }}
      ListEmptyComponent={
        <EmptyState icon="calendar-outline" title="No events" subtitle="Tap + to add an assignment, quiz, or exam" />
      }
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
              <View style={[styles.eventIconWrap, { backgroundColor: ec.color + "20", borderWidth: 1, borderColor: ec.color + "30" }]}>
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
                    <Text style={[styles.typeText, { color: ec.color }]}>
                      {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
                    </Text>
                  </View>
                  <Text style={[styles.eventDate, { color: theme.textTertiary }]}>
                    {new Date(event.date).toLocaleDateString("en-PH", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </Text>
                </View>
              </View>
              <Pressable onPress={() => handleDelete(event.id)} style={styles.deleteBtn} hitSlop={8}>
                <Ionicons name="trash-outline" size={15} color={theme.textTertiary} />
              </Pressable>
            </LinearGradient>
          </Animated.View>
        );
      }}
    />
  );
}

function NotesPane() {
  const { theme, isDark } = useTheme();
  const { notes, deleteNote, updateNote } = useApp();
  const insets = useSafeAreaInsets();

  const handleDelete = (id: string) => {
    Alert.alert("Delete Note", "Remove this note?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteNote(id) },
    ]);
  };

  const toggleItem = (note: Note, itemId: string) => {
    if (!note.items) return;
    updateNote(note.id, {
      items: note.items.map((i) => i.id === itemId ? { ...i, done: !i.done } : i),
    });
  };

  return (
    <FlatList
      data={notes}
      keyExtractor={(n) => n.id}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 110, gap: 12 }}
      ListEmptyComponent={
        <EmptyState icon="document-text-outline" title="No notes yet" subtitle="Tap + to create a note or checklist" />
      }
      renderItem={({ item: note, index }) => (
        <Animated.View entering={FadeInDown.delay(index * 50).duration(300)}>
          <LinearGradient
            colors={isDark ? [note.color + "18", note.color + "08"] : [note.color + "10", note.color + "04"]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={[styles.noteCard, { borderColor: note.color + "28", shadowColor: note.color, shadowOffset: { width: 0, height: 4 }, shadowOpacity: isDark ? 0.2 : 0.08, shadowRadius: 10, elevation: 4 }]}
          >
            <View style={styles.noteHeader}>
              <View style={[styles.noteTypeIcon, { backgroundColor: note.color + "20", borderWidth: 1, borderColor: note.color + "30" }]}>
                <Ionicons name={note.type === "checklist" ? "checkmark-circle-outline" : "document-text-outline"} size={16} color={note.color} />
              </View>
              <Text style={[styles.noteTitle, { color: theme.text }]} numberOfLines={1}>{note.title}</Text>
              <Pressable onPress={() => router.push({ pathname: "/add-note", params: { noteId: note.id } })} style={styles.deleteBtn} hitSlop={8}>
                <Ionicons name="pencil-outline" size={15} color={theme.textTertiary} />
              </Pressable>
              <Pressable onPress={() => handleDelete(note.id)} style={styles.deleteBtn} hitSlop={8}>
                <Ionicons name="trash-outline" size={15} color={theme.textTertiary} />
              </Pressable>
            </View>
            {note.type === "text" && note.content ? (
              <Text style={[styles.noteContent, { color: theme.textSecondary }]} numberOfLines={3}>{note.content}</Text>
            ) : note.type === "checklist" && note.items ? (
              <View style={{ gap: 7 }}>
                {note.items.slice(0, 4).map((item) => (
                  <Pressable key={item.id} onPress={() => toggleItem(note, item.id)} style={styles.checkItem}>
                    <View style={[styles.noteCheckBox, item.done ? { backgroundColor: note.color, borderColor: note.color } : { borderColor: note.color + "60" }]}>
                      {item.done && <Ionicons name="checkmark" size={10} color="#fff" />}
                    </View>
                    <Text style={[styles.checkText, { color: item.done ? theme.textTertiary : theme.textSecondary, textDecorationLine: item.done ? "line-through" : "none" }]}>
                      {item.text}
                    </Text>
                  </Pressable>
                ))}
                {note.items.length > 4 && (
                  <Text style={[{ fontSize: 11, fontFamily: "Inter_400Regular", color: theme.textTertiary }]}>+{note.items.length - 4} more</Text>
                )}
              </View>
            ) : null}
            <Text style={[styles.noteDate, { color: theme.textTertiary }]}>
              {new Date(note.updatedAt).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}
            </Text>
          </LinearGradient>
        </Animated.View>
      )}
    />
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
const TABS: { key: PlannerTab; label: string; icon: string; activeIcon: string }[] = [
  { key: "tasks",  label: "Tasks",  icon: "checkbox-outline",       activeIcon: "checkbox" },
  { key: "events", label: "Events", icon: "calendar-outline",       activeIcon: "calendar" },
  { key: "notes",  label: "Notes",  icon: "document-text-outline",  activeIcon: "document-text" },
];

export default function PlannerScreen() {
  const { theme, isDark } = useTheme();
  const { tasks, events, notes } = useApp();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<PlannerTab>("tasks");

  const pendingTasks  = tasks.filter((t) => !t.completed).length;
  const upcomingEvents = events.filter((e) => daysUntil(e.date) >= 0).length;
  const notesCount    = notes.length;

  const addRoutes: Record<PlannerTab, string> = {
    tasks:  "/add-task",
    events: "/add-event",
    notes:  "/add-note",
  };

  const COUNTS: Record<PlannerTab, number> = {
    tasks:  pendingTasks,
    events: upcomingEvents,
    notes:  notesCount,
  };

  const STAT_COLORS: Record<PlannerTab, string> = {
    tasks:  "#F59E0B",
    events: "#6366F1",
    notes:  "#F59E0B",
  };

  return (
    <ScreenWrapper>
      {/* Header */}
      <View style={[styles.header, { paddingTop: Platform.OS === "web" ? 67 : insets.top + 12 }]}>
        <View>
          <Text style={[styles.screenLabel, { color: theme.textSecondary }]}>Academic</Text>
          <Text style={[styles.title, { color: theme.text }]}>Planner</Text>
        </View>
        <Pressable
          onPress={() => router.push(addRoutes[activeTab] as any)}
          style={({ pressed }) => [
            styles.addBtn,
            { backgroundColor: theme.primary, shadowColor: theme.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 10, elevation: 6, opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <Ionicons name="add" size={22} color="#fff" />
        </Pressable>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsRow}>
        {[
          { label: "Pending Tasks",   value: pendingTasks,   color: "#F59E0B" },
          { label: "Upcoming Events", value: upcomingEvents, color: "#6366F1" },
          { label: "Notes",           value: notesCount,     color: "#2DD4BF" },
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

      {/* Tab Selector */}
      <View style={[styles.tabBar, { backgroundColor: theme.surface, borderColor: isDark ? "rgba(255,255,255,0.07)" : theme.border, marginHorizontal: 20 }]}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          const count = COUNTS[tab.key];
          return (
            <Pressable
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              style={{ flex: 1 }}
            >
              {isActive ? (
                <LinearGradient
                  colors={isDark ? ["#2A1018", "#2A1820"] : ["#FFE4E8", "#FFF0F2"]}
                  style={[styles.tabBtn, { borderWidth: 1, borderColor: theme.primary + "40" }]}
                >
                  <Ionicons name={tab.activeIcon as any} size={15} color={theme.primary} />
                  <Text style={[styles.tabLabel, { color: theme.primary }]}>{tab.label}</Text>
                  {count > 0 && (
                    <View style={[styles.tabBadge, { backgroundColor: theme.primary }]}>
                      <Text style={styles.tabBadgeText}>{count}</Text>
                    </View>
                  )}
                </LinearGradient>
              ) : (
                <View style={[styles.tabBtn, { backgroundColor: "transparent" }]}>
                  <Ionicons name={tab.icon as any} size={15} color={theme.textTertiary} />
                  <Text style={[styles.tabLabel, { color: theme.textTertiary }]}>{tab.label}</Text>
                  {count > 0 && (
                    <View style={[styles.tabBadge, { backgroundColor: theme.textTertiary + "50" }]}>
                      <Text style={[styles.tabBadgeText, { color: theme.surface }]}>{count}</Text>
                    </View>
                  )}
                </View>
              )}
            </Pressable>
          );
        })}
      </View>

      {/* Content */}
      <View style={{ flex: 1, paddingTop: 10 }}>
        {activeTab === "tasks"  && <TasksPane />}
        {activeTab === "events" && <EventsPane />}
        {activeTab === "notes"  && <NotesPane />}
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", paddingHorizontal: 20, paddingBottom: 14 },
  screenLabel: { fontSize: 13, fontFamily: "Inter_400Regular", marginBottom: 2 },
  title: { fontSize: 28, fontFamily: "Inter_700Bold", letterSpacing: -0.4 },
  addBtn: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  statsRow: { flexDirection: "row", paddingHorizontal: 20, gap: 8, marginBottom: 14 },
  statCard: { flex: 1, borderRadius: 14, padding: 12, alignItems: "center", gap: 3, borderWidth: 1 },
  statValue: { fontSize: 20, fontFamily: "Inter_700Bold" },
  statLabel: { fontSize: 10, fontFamily: "Inter_400Regular", textAlign: "center" },
  tabBar: { flexDirection: "row", borderRadius: 14, padding: 4, marginBottom: 4, borderWidth: 1 },
  tabBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 10, borderRadius: 10, gap: 5 },
  tabLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  tabBadge: { width: 18, height: 18, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  tabBadgeText: { fontSize: 10, fontFamily: "Inter_700Bold", color: "#fff" },
  filterRow: { flexDirection: "row", paddingHorizontal: 20, paddingBottom: 10, gap: 8 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  filterText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  // Task card
  taskCard: { flexDirection: "row", alignItems: "center", borderRadius: 16, padding: 14, gap: 12, borderWidth: 1 },
  checkCircle: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  taskInfo: { flex: 1, gap: 4 },
  taskTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  taskDesc: { fontSize: 12, fontFamily: "Inter_400Regular" },
  taskMeta: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 2 },
  priorityBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8, borderWidth: 1 },
  priorityText: { fontSize: 10, fontFamily: "Inter_600SemiBold" },
  deadlineText: { fontSize: 11, fontFamily: "Inter_400Regular" },
  deleteBtn: { padding: 4 },
  // Event card
  eventCard: { flexDirection: "row", alignItems: "flex-start", borderRadius: 16, padding: 14, gap: 12, borderWidth: 1 },
  eventIconWrap: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", marginTop: 2 },
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
  // Note card
  noteCard: { borderRadius: 18, borderWidth: 1, padding: 16, gap: 10 },
  noteHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  noteTypeIcon: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  noteTitle: { flex: 1, fontSize: 16, fontFamily: "Inter_700Bold" },
  noteContent: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 20 },
  noteDate: { fontSize: 11, fontFamily: "Inter_400Regular" },
  checkItem: { flexDirection: "row", alignItems: "center", gap: 10 },
  noteCheckBox: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, alignItems: "center", justifyContent: "center", backgroundColor: "transparent" },
  checkText: { fontSize: 14, fontFamily: "Inter_400Regular", flex: 1 },
});

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
import { useApp, Task, AcademicEvent, Note, TaskPriority } from "@/context/AppContext";
import { ScreenWrapper } from "@/components/ScreenWrapper";
import { EmptyState } from "@/components/ui/EmptyState";

// ─── Types ────────────────────────────────────────────────────────────────────
type PlannerTab  = "tasks" | "events" | "notes";
type TaskFilter  = "all" | "pending" | "completed";

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
  if (days < 0)   return { text: "Overdue",         color: "#E05A6D" };
  if (days === 0) return { text: "Due today",        color: "#F59E0B" };
  if (days === 1) return { text: "Due tomorrow",     color: "#F59E0B" };
  if (days <= 3)  return { text: `In ${days} days`,  color: "#A78BFA" };
  return           { text: `In ${days} days`,         color: "#9CA3AF" };
}

// ─── Tasks Pane ───────────────────────────────────────────────────────────────
function TasksPane() {
  const { theme, isDark } = useTheme();
  const { tasks, updateTask, deleteTask } = useApp();
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<TaskFilter>("all");

  const filtered = useMemo(() => {
    let list = tasks;
    if (filter === "pending")   list = list.filter((t) => !t.completed);
    if (filter === "completed") list = list.filter((t) =>  t.completed);
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

  const handleDelete = (id: string) =>
    Alert.alert("Delete Task", "Remove this task?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteTask(id) },
    ]);

  const TASK_FILTERS: { key: TaskFilter; label: string; icon: string; count: number }[] = [
    { key: "all",       label: "All",     icon: "layers-outline",           count: tasks.length },
    { key: "pending",   label: "Pending", icon: "time-outline",             count: tasks.filter(t => !t.completed).length },
    { key: "completed", label: "Done",    icon: "checkmark-circle-outline", count: tasks.filter(t =>  t.completed).length },
  ];

  return (
    <View style={{ flex: 1 }}>
      {/* Full-width segmented filter */}
      <View style={[
        styles.segmentWrap,
        { backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)", borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)" },
      ]}>
        {TASK_FILTERS.map((f) => {
          const active = filter === f.key;
          return (
            <Pressable
              key={f.key}
              onPress={() => setFilter(f.key)}
              style={({ pressed }) => [
                styles.segmentBtn,
                active
                  ? { backgroundColor: theme.primary + "1C", borderColor: theme.primary + "55" }
                  : { borderColor: "transparent" },
                { opacity: pressed ? 0.8 : 1 },
              ]}
            >
              <Ionicons name={f.icon as any} size={13} color={active ? theme.primary : theme.textTertiary} />
              <Text style={[styles.segmentLabel, { color: active ? theme.primary : theme.textSecondary, fontFamily: active ? "Inter_700Bold" : "Inter_500Medium" }]}>
                {f.label}
              </Text>
              {f.count > 0 && (
                <View style={[styles.segmentBadge, { backgroundColor: active ? theme.primary : (isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)") }]}>
                  <Text style={[styles.segmentBadgeText, { color: active ? "#fff" : theme.textTertiary }]}>{f.count}</Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(t) => t.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: insets.bottom + 110,
          gap: 10,
        }}
        ListEmptyComponent={
          <EmptyState icon="checkbox-outline" title="No tasks" subtitle="Tap + to add a task" />
        }
        renderItem={({ item: task, index }) => {
          const pc  = PRIORITY_CONFIG[task.priority];
          const urg = task.deadline ? urgencyLabel(daysUntil(task.deadline)) : null;
          const iconColor = task.completed ? theme.textTertiary : pc.color;

          return (
            <Animated.View entering={FadeInDown.delay(index * 40).duration(280)}>
              <View
                style={[
                  styles.taskCard,
                  {
                    backgroundColor: theme.surface,
                    borderColor: task.completed
                      ? isDark ? "rgba(255,255,255,0.05)" : theme.border
                      : pc.color + "25",
                    shadowColor: task.completed ? "#000" : pc.color,
                    shadowOffset: { width: 0, height: 3 },
                    shadowOpacity: task.completed ? (isDark ? 0.15 : 0.04) : (isDark ? 0.2 : 0.08),
                    shadowRadius: 8,
                    elevation: 3,
                  },
                ]}
              >
                {/* Left accent stripe */}
                <View style={[styles.taskStripe, { backgroundColor: iconColor }]} />

                {/* Priority icon — left block (matches event card style) */}
                <View
                  style={[
                    styles.taskIconBlock,
                    {
                      backgroundColor: iconColor + "18",
                      borderWidth: 1,
                      borderColor: iconColor + "30",
                      shadowColor: iconColor,
                      shadowOffset: { width: 0, height: 0 },
                      shadowOpacity: isDark ? 0.45 : 0.15,
                      shadowRadius: 8,
                    },
                  ]}
                >
                  <Ionicons name={pc.icon as any} size={20} color={iconColor} />
                </View>

                {/* Content */}
                <View style={styles.taskContent}>
                  <Text
                    style={[
                      styles.taskTitle,
                      {
                        color: task.completed ? theme.textTertiary : theme.text,
                        textDecorationLine: task.completed ? "line-through" : "none",
                      },
                    ]}
                    numberOfLines={2}
                  >
                    {task.title}
                  </Text>

                  {task.description ? (
                    <Text style={[styles.taskDesc, { color: theme.textTertiary }]} numberOfLines={1}>
                      {task.description}
                    </Text>
                  ) : null}

                  <View style={styles.taskFooter}>
                    <View style={[styles.priorityBadge, { backgroundColor: iconColor + "18", borderColor: iconColor + "30" }]}>
                      <Ionicons name={pc.icon as any} size={10} color={iconColor} />
                      <Text style={[styles.priorityText, { color: iconColor }]}>{pc.label}</Text>
                    </View>
                    {urg && !task.completed && (
                      <View style={[styles.urgencyBadge, { backgroundColor: urg.color + "18" }]}>
                        <Ionicons name="time-outline" size={10} color={urg.color} />
                        <Text style={[styles.urgencyText, { color: urg.color }]}>{urg.text}</Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Right: check toggle + delete stacked */}
                <View style={styles.taskRightCol}>
                  <Pressable onPress={() => handleToggle(task)} hitSlop={8}>
                    <View
                      style={[
                        styles.checkCircle,
                        task.completed
                          ? { backgroundColor: theme.income, borderColor: theme.income }
                          : { backgroundColor: "transparent", borderColor: pc.color, borderWidth: 2 },
                      ]}
                    >
                      {task.completed && <Ionicons name="checkmark" size={13} color="#fff" />}
                    </View>
                  </Pressable>
                  <Pressable
                    onPress={() => handleDelete(task.id)}
                    style={[styles.actionBtn, { backgroundColor: theme.expense + "12" }]}
                    hitSlop={8}
                  >
                    <Ionicons name="trash-outline" size={14} color={theme.expense} />
                  </Pressable>
                </View>
              </View>
            </Animated.View>
          );
        }}
      />
    </View>
  );
}

// ─── Events Pane ──────────────────────────────────────────────────────────────
function EventsPane() {
  const { theme, isDark } = useTheme();
  const { events, deleteEvent } = useApp();
  const insets = useSafeAreaInsets();

  const sorted = useMemo(
    () => [...events].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [events],
  );

  const handleDelete = (id: string) =>
    Alert.alert("Delete Event", "Remove this event?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteEvent(id) },
    ]);

  return (
    <FlatList
      data={sorted}
      keyExtractor={(e) => e.id}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{
        paddingHorizontal: 20,
        paddingBottom: insets.bottom + 110,
        gap: 10,
      }}
      ListEmptyComponent={
        <EmptyState
          icon="calendar-outline"
          title="No events"
          subtitle="Tap + to add an assignment, quiz, or exam"
        />
      }
      renderItem={({ item: event, index }) => {
        const ec   = EVENT_CONFIG[event.type] ?? { color: "#9CA3AF", icon: "calendar" };
        const days = daysUntil(event.date);
        const urg  = urgencyLabel(days);
        return (
          <Animated.View entering={FadeInDown.delay(index * 40).duration(280)}>
            <LinearGradient
              colors={isDark ? [ec.color + "16", ec.color + "06"] : [ec.color + "0E", ec.color + "04"]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={[
                styles.eventCard,
                {
                  borderColor: ec.color + "28",
                  shadowColor: ec.color,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: isDark ? 0.2 : 0.07,
                  shadowRadius: 10,
                  elevation: 4,
                },
              ]}
            >
              {/* Left accent stripe */}
              <View style={[styles.eventStripe, { backgroundColor: ec.color }]} />

              {/* Icon block */}
              <View
                style={[
                  styles.eventIconBlock,
                  {
                    backgroundColor: ec.color + "18",
                    borderWidth: 1,
                    borderColor: ec.color + "30",
                    shadowColor: ec.color,
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: isDark ? 0.45 : 0.15,
                    shadowRadius: 8,
                  },
                ]}
              >
                <Ionicons name={ec.icon as any} size={20} color={ec.color} />
              </View>

              {/* Info */}
              <View style={styles.eventContent}>
                <View style={styles.eventTopRow}>
                  <Text style={[styles.eventTitle, { color: theme.text }]} numberOfLines={1}>
                    {event.title}
                  </Text>
                  <View style={[styles.urgencyPill, { backgroundColor: urg.color + "1C" }]}>
                    <Text style={[styles.urgencyPillText, { color: urg.color }]}>{urg.text}</Text>
                  </View>
                </View>

                {event.description ? (
                  <Text
                    style={[styles.eventDesc, { color: theme.textTertiary }]}
                    numberOfLines={1}
                  >
                    {event.description}
                  </Text>
                ) : null}

                <View style={styles.eventFooter}>
                  <View style={[styles.typePill, { backgroundColor: ec.color + "18" }]}>
                    <Ionicons name={ec.icon as any} size={10} color={ec.color} />
                    <Text style={[styles.typePillText, { color: ec.color }]}>
                      {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
                    </Text>
                  </View>
                  <View style={styles.eventDateRow}>
                    <Ionicons name="calendar-outline" size={11} color={theme.textTertiary} />
                    <Text style={[styles.eventDateText, { color: theme.textTertiary }]}>
                      {new Date(event.date).toLocaleDateString("en-PH", {
                        month: "short", day: "numeric",
                      })}
                      {" · "}
                      {new Date(event.date).toLocaleTimeString("en-PH", {
                        hour: "2-digit", minute: "2-digit",
                      })}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Delete */}
              <Pressable
                onPress={() => handleDelete(event.id)}
                style={[styles.actionBtn, { backgroundColor: theme.expense + "12" }]}
                hitSlop={8}
              >
                <Ionicons name="trash-outline" size={15} color={theme.expense} />
              </Pressable>
            </LinearGradient>
          </Animated.View>
        );
      }}
    />
  );
}

// ─── Notes Pane ───────────────────────────────────────────────────────────────
function NotesPane() {
  const { theme, isDark } = useTheme();
  const { notes, deleteNote, updateNote } = useApp();
  const insets = useSafeAreaInsets();

  const handleDelete = (id: string) =>
    Alert.alert("Delete Note", "Remove this note?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteNote(id) },
    ]);

  const toggleItem = (note: Note, itemId: string) => {
    if (!note.items) return;
    updateNote(note.id, {
      items: note.items.map((i) => (i.id === itemId ? { ...i, done: !i.done } : i)),
    });
  };

  return (
    <FlatList
      data={notes}
      keyExtractor={(n) => n.id}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{
        paddingHorizontal: 20,
        paddingBottom: insets.bottom + 110,
        gap: 12,
      }}
      ListEmptyComponent={
        <EmptyState
          icon="document-text-outline"
          title="No notes yet"
          subtitle="Tap + to create a note or checklist"
        />
      }
      renderItem={({ item: note, index }) => {
        const doneCount = note.items?.filter((i) => i.done).length ?? 0;
        const totalCount = note.items?.length ?? 0;

        return (
          <Animated.View entering={FadeInDown.delay(index * 50).duration(300)}>
            <LinearGradient
              colors={
                isDark
                  ? [note.color + "18", note.color + "08"]
                  : [note.color + "10", note.color + "04"]
              }
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={[
                styles.noteCard,
                {
                  borderColor: note.color + "28",
                  shadowColor: note.color,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: isDark ? 0.18 : 0.06,
                  shadowRadius: 10,
                  elevation: 4,
                },
              ]}
            >
              {/* Left stripe */}
              <View style={[styles.noteStripe, { backgroundColor: note.color }]} />

              {/* Header row */}
              <View style={styles.noteHeader}>
                <View
                  style={[
                    styles.noteIconWrap,
                    {
                      backgroundColor: note.color + "18",
                      borderWidth: 1,
                      borderColor: note.color + "30",
                      shadowColor: note.color,
                      shadowOffset: { width: 0, height: 0 },
                      shadowOpacity: isDark ? 0.45 : 0.15,
                      shadowRadius: 8,
                    },
                  ]}
                >
                  <Ionicons
                    name={
                      note.type === "checklist"
                        ? "checkmark-circle-outline"
                        : "document-text-outline"
                    }
                    size={20}
                    color={note.color}
                  />
                </View>

                <View style={styles.noteTitleWrap}>
                  <Text style={[styles.noteTitle, { color: theme.text }]} numberOfLines={1}>
                    {note.title}
                  </Text>
                  {note.type === "checklist" && totalCount > 0 && (
                    <Text style={[styles.noteProgress, { color: note.color }]}>
                      {doneCount}/{totalCount} done
                    </Text>
                  )}
                </View>

                <View style={styles.noteActions}>
                  <Pressable
                    onPress={() =>
                      router.push({ pathname: "/add-note", params: { noteId: note.id } })
                    }
                    style={[styles.noteActionBtn, { backgroundColor: theme.primary + "14" }]}
                    hitSlop={8}
                  >
                    <Ionicons name="pencil-outline" size={14} color={theme.primary} />
                  </Pressable>
                  <Pressable
                    onPress={() => handleDelete(note.id)}
                    style={[styles.noteActionBtn, { backgroundColor: theme.expense + "14" }]}
                    hitSlop={8}
                  >
                    <Ionicons name="trash-outline" size={14} color={theme.expense} />
                  </Pressable>
                </View>
              </View>

              {/* Content */}
              {note.type === "text" && note.content ? (
                <Text
                  style={[styles.noteContent, { color: theme.textSecondary }]}
                  numberOfLines={3}
                >
                  {note.content}
                </Text>
              ) : note.type === "checklist" && note.items ? (
                <View style={{ gap: 8, marginTop: 4 }}>
                  {note.items.slice(0, 4).map((item) => (
                    <Pressable
                      key={item.id}
                      onPress={() => toggleItem(note, item.id)}
                      style={styles.checkRow}
                    >
                      <View
                        style={[
                          styles.checkBox,
                          item.done
                            ? { backgroundColor: note.color, borderColor: note.color }
                            : { borderColor: note.color + "55", backgroundColor: "transparent" },
                        ]}
                      >
                        {item.done && <Ionicons name="checkmark" size={10} color="#fff" />}
                      </View>
                      <Text
                        style={[
                          styles.checkText,
                          {
                            color: item.done ? theme.textTertiary : theme.textSecondary,
                            textDecorationLine: item.done ? "line-through" : "none",
                          },
                        ]}
                        numberOfLines={1}
                      >
                        {item.text}
                      </Text>
                    </Pressable>
                  ))}
                  {note.items.length > 4 && (
                    <Text style={[{ fontSize: 11, fontFamily: "Inter_400Regular", color: theme.textTertiary }]}>
                      +{note.items.length - 4} more items
                    </Text>
                  )}
                </View>
              ) : null}

              {/* Footer */}
              <View style={styles.noteFooter}>
                <Ionicons name="time-outline" size={11} color={theme.textTertiary} />
                <Text style={[styles.noteDate, { color: theme.textTertiary }]}>
                  {new Date(note.updatedAt).toLocaleDateString("en-PH", {
                    month: "short", day: "numeric", year: "numeric",
                  })}
                </Text>
              </View>
            </LinearGradient>
          </Animated.View>
        );
      }}
    />
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
const TABS: { key: PlannerTab; label: string; icon: string; activeIcon: string }[] = [
  { key: "tasks",  label: "Tasks",  icon: "checkbox-outline",      activeIcon: "checkbox" },
  { key: "events", label: "Events", icon: "calendar-outline",      activeIcon: "calendar" },
  { key: "notes",  label: "Notes",  icon: "document-text-outline", activeIcon: "document-text" },
];

export default function PlannerScreen() {
  const { theme, isDark } = useTheme();
  const { tasks, events, notes } = useApp();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<PlannerTab>("tasks");

  const pendingTasks   = tasks.filter((t) => !t.completed).length;
  const upcomingEvents = events.filter((e) => daysUntil(e.date) >= 0).length;
  const notesCount     = notes.length;

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

  return (
    <ScreenWrapper>
      {/* ── Header ── */}
      <View
        style={[
          styles.header,
          { paddingTop: Platform.OS === "web" ? 67 : insets.top + 12 },
        ]}
      >
        <View>
          <Text style={[styles.screenLabel, { color: theme.textSecondary }]}>Academic</Text>
          <Text style={[styles.title, { color: theme.text }]}>Planner</Text>
        </View>
        <Pressable
          onPress={() => router.push(addRoutes[activeTab] as any)}
          style={({ pressed }) => [
            styles.addBtn,
            {
              backgroundColor: theme.primary,
              shadowColor: theme.primary,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.4,
              shadowRadius: 10,
              elevation: 6,
              opacity: pressed ? 0.85 : 1,
            },
          ]}
        >
          <Ionicons name="add" size={22} color="#fff" />
        </Pressable>
      </View>

      {/* ── Quick Stats ── */}
      <View style={styles.statsRow}>
        {[
          { label: "Pending",  value: pendingTasks,   color: "#F59E0B", icon: "time-outline" },
          { label: "Upcoming", value: upcomingEvents,  color: "#6366F1", icon: "calendar-outline" },
          { label: "Notes",    value: notesCount,      color: "#2DD4BF", icon: "document-text-outline" },
        ].map((s) => (
          <LinearGradient
            key={s.label}
            colors={[s.color + "1C", s.color + "0A"]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={[styles.statCard, { borderColor: s.color + "28" }]}
          >
            <View style={[styles.statIconWrap, { backgroundColor: s.color + "18" }]}>
              <Ionicons name={s.icon as any} size={16} color={s.color} />
            </View>
            <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>{s.label}</Text>
          </LinearGradient>
        ))}
      </View>

      {/* ── Tab Bar ── */}
      <View
        style={[
          styles.tabBar,
          {
            backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)",
            borderColor: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)",
            marginHorizontal: 20,
          },
        ]}
      >
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
                  colors={isDark ? ["#2A1018", "#1E1028"] : ["#FFE4E8", "#F0E8FF"]}
                  style={[styles.tabBtn, { borderWidth: 1, borderColor: theme.primary + "45" }]}
                >
                  <Ionicons name={tab.activeIcon as any} size={15} color={theme.primary} />
                  <Text style={[styles.tabLabel, { color: theme.primary }]}>{tab.label}</Text>
                  {count > 0 && (
                    <View style={[styles.tabBadge, { backgroundColor: theme.primary }]}>
                      <Text style={styles.tabBadgeText}>{count > 99 ? "99+" : count}</Text>
                    </View>
                  )}
                </LinearGradient>
              ) : (
                <View style={[styles.tabBtn, { backgroundColor: "transparent" }]}>
                  <Ionicons name={tab.icon as any} size={15} color={theme.textTertiary} />
                  <Text style={[styles.tabLabel, { color: theme.textTertiary }]}>{tab.label}</Text>
                  {count > 0 && (
                    <View style={[styles.tabBadge, { backgroundColor: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)" }]}>
                      <Text style={[styles.tabBadgeText, { color: theme.textSecondary }]}>
                        {count > 99 ? "99+" : count}
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </Pressable>
          );
        })}
      </View>

      {/* ── Content ── */}
      <View style={{ flex: 1, paddingTop: 12 }}>
        {activeTab === "tasks"  && <TasksPane />}
        {activeTab === "events" && <EventsPane />}
        {activeTab === "notes"  && <NotesPane />}
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  /* Screen */
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  screenLabel: { fontSize: 13, fontFamily: "Inter_400Regular", marginBottom: 2 },
  title: { fontSize: 28, fontFamily: "Inter_700Bold", letterSpacing: -0.4 },
  addBtn: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: "center", justifyContent: "center",
  },

  /* Stats */
  statsRow: { flexDirection: "row", paddingHorizontal: 20, gap: 10, marginBottom: 16 },
  statCard: { flex: 1, borderRadius: 16, padding: 14, alignItems: "center", gap: 6, borderWidth: 1 },
  statIconWrap: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: "center", justifyContent: "center", marginBottom: 2,
  },
  statValue: { fontSize: 22, fontFamily: "Inter_700Bold" },
  statLabel: { fontSize: 10, fontFamily: "Inter_500Medium", textAlign: "center" },

  /* Tab bar */
  tabBar: {
    flexDirection: "row",
    borderRadius: 14,
    padding: 4,
    marginBottom: 4,
    borderWidth: 1,
  },
  tabBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 11,
    gap: 5,
  },
  tabLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  tabBadge: { width: 18, height: 18, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  tabBadgeText: { fontSize: 10, fontFamily: "Inter_700Bold", color: "#fff" },

  /* Segmented filter (full-width) */
  segmentWrap: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginBottom: 10,
    borderRadius: 14,
    padding: 4,
    borderWidth: 1,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 9,
    borderRadius: 11,
    borderWidth: 1,
  },
  segmentLabel: { fontSize: 13 },
  segmentBadge: {
    minWidth: 18, height: 18, borderRadius: 9,
    alignItems: "center", justifyContent: "center",
    paddingHorizontal: 4,
  },
  segmentBadgeText: { fontSize: 10, fontFamily: "Inter_700Bold" },

  /* Task card */
  taskCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 18,
    paddingVertical: 14,
    paddingRight: 12,
    paddingLeft: 16,
    gap: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  taskStripe: {
    position: "absolute",
    left: 0, top: 0, bottom: 0,
    width: 4,
    borderTopLeftRadius: 18,
    borderBottomLeftRadius: 18,
  },
  taskIconBlock: {
    width: 46, height: 46, borderRadius: 23,
    alignItems: "center", justifyContent: "center",
    marginLeft: 8,
  },
  taskRightCol: {
    alignItems: "center",
    gap: 8,
  },
  checkCircle: {
    width: 26, height: 26, borderRadius: 13,
    alignItems: "center", justifyContent: "center",
    borderWidth: 2,
  },
  taskContent: { flex: 1, gap: 5 },
  taskTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold", lineHeight: 20 },
  taskDesc: { fontSize: 12, fontFamily: "Inter_400Regular" },
  taskFooter: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  priorityBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1,
  },
  priorityText: { fontSize: 10, fontFamily: "Inter_600SemiBold" },
  urgencyBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
  },
  urgencyText: { fontSize: 10, fontFamily: "Inter_600SemiBold" },
  actionBtn: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: "center", justifyContent: "center",
  },

  /* Event card */
  eventCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 18,
    paddingVertical: 14,
    paddingRight: 12,
    paddingLeft: 16,
    gap: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  eventStripe: {
    position: "absolute",
    left: 0, top: 0, bottom: 0,
    width: 4,
    borderTopLeftRadius: 18,
    borderBottomLeftRadius: 18,
  },
  eventIconBlock: {
    width: 46, height: 46, borderRadius: 23,
    alignItems: "center", justifyContent: "center",
    marginLeft: 8,
  },
  eventContent: { flex: 1, gap: 5 },
  eventTopRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  eventTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold", flex: 1 },
  urgencyPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  urgencyPillText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  eventDesc: { fontSize: 12, fontFamily: "Inter_400Regular" },
  eventFooter: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  typePill: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
  },
  typePillText: { fontSize: 10, fontFamily: "Inter_600SemiBold" },
  eventDateRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  eventDateText: { fontSize: 11, fontFamily: "Inter_400Regular" },

  /* Note card */
  noteCard: {
    borderRadius: 18, borderWidth: 1,
    paddingVertical: 14, paddingRight: 14, paddingLeft: 18,
    gap: 10, overflow: "hidden",
  },
  noteStripe: {
    position: "absolute",
    left: 0, top: 0, bottom: 0,
    width: 4,
    borderTopLeftRadius: 18,
    borderBottomLeftRadius: 18,
  },
  noteHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  noteIconWrap: {
    width: 46, height: 46, borderRadius: 23,
    alignItems: "center", justifyContent: "center",
  },
  noteTitleWrap: { flex: 1, gap: 2 },
  noteTitle: { fontSize: 15, fontFamily: "Inter_700Bold" },
  noteProgress: { fontSize: 11, fontFamily: "Inter_500Medium" },
  noteActions: { flexDirection: "row", gap: 6 },
  noteActionBtn: { width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  noteContent: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 19 },
  checkRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  checkBox: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 1.5, alignItems: "center", justifyContent: "center",
  },
  checkText: { fontSize: 13, fontFamily: "Inter_400Regular", flex: 1 },
  noteFooter: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  noteDate: { fontSize: 11, fontFamily: "Inter_400Regular" },
});

import React, { useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  KeyboardAvoidingView, Platform, Alert,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "@/context/ThemeContext";
import { useApp, TaskPriority } from "@/context/AppContext";
import { Input } from "@/components/ui/Input";
import { DatePickerModal, DateField } from "@/components/ui/DatePickerModal";

const PRIORITIES: { key: TaskPriority; label: string; icon: string; color: string; desc: string }[] = [
  { key: "high",   label: "High",   icon: "flame",              color: "#E05A6D", desc: "Urgent" },
  { key: "medium", label: "Medium", icon: "alert-circle",       color: "#F59E0B", desc: "Normal" },
  { key: "low",    label: "Low",    icon: "chevron-down-circle", color: "#2DD4BF", desc: "Later" },
];

export default function AddTaskScreen() {
  const { theme, isDark } = useTheme();
  const { addTask } = useApp();
  const insets = useSafeAreaInsets();

  const [title, setTitle]           = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority]     = useState<TaskPriority>("medium");
  const [hasDeadline, setHasDeadline] = useState(false);
  const [deadline, setDeadline]     = useState(new Date());
  const [pickerOpen, setPickerOpen] = useState(false);

  const handleSave = () => {
    if (!title.trim()) {
      Alert.alert("Missing title", "Please enter a task title.");
      return;
    }
    addTask({
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      completed: false,
      deadline: hasDeadline ? deadline.toISOString() : undefined,
    });
    router.back();
  };

  const activePriority = PRIORITIES.find((p) => p.key === priority)!;

  return (
    <LinearGradient
      colors={isDark ? ["#0E0E0E", "#140810", "#0E0E0E"] : ["#F0F0F5", "#EDE8F5", "#F0F0F5"]}
      style={styles.container}
    >
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>

        {/* ── Header ── */}
        <View
          style={[
            styles.header,
            {
              paddingTop: Platform.OS === "web" ? 67 : insets.top + 12,
              borderBottomColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
            },
          ]}
        >
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [styles.iconBtn, { backgroundColor: theme.surface, opacity: pressed ? 0.6 : 1 }]}
          >
            <Ionicons name="arrow-back" size={20} color={theme.text} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={[styles.headerLabel, { color: theme.textSecondary }]}>New</Text>
            <Text style={[styles.headerTitle, { color: theme.text }]}>Add Task</Text>
          </View>
          <Pressable
            onPress={handleSave}
            style={({ pressed }) => [
              styles.saveBtn,
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
            <Ionicons name="checkmark" size={20} color="#fff" />
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + 40 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Task Title */}
          <Input
            label="Task Title"
            value={title}
            onChangeText={setTitle}
            placeholder="What do you need to do?"
            leftIcon="create-outline"
          />

          {/* Description */}
          <Input
            label="Description (optional)"
            value={description}
            onChangeText={setDescription}
            placeholder="Add more details..."
            multiline
            style={{ minHeight: 80, textAlignVertical: "top" }}
          />

          {/* Priority */}
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>Priority Level</Text>
            <View style={styles.priorityRow}>
              {PRIORITIES.map((p) => {
                const active = priority === p.key;
                return (
                  <Pressable
                    key={p.key}
                    onPress={() => setPriority(p.key)}
                    style={({ pressed }) => ({ flex: 1, opacity: pressed ? 0.85 : 1 })}
                  >
                    {active ? (
                      <LinearGradient
                        colors={[p.color + "28", p.color + "14"]}
                        style={[styles.priorityBtn, { borderColor: p.color + "55", borderWidth: 1.5 }]}
                      >
                        <View style={[styles.priorityIconWrap, { backgroundColor: p.color + "20" }]}>
                          <Ionicons name={p.icon as any} size={20} color={p.color} />
                        </View>
                        <Text style={[styles.priorityLabel, { color: p.color }]}>{p.label}</Text>
                        <Text style={[styles.priorityDesc, { color: p.color + "99" }]}>{p.desc}</Text>
                      </LinearGradient>
                    ) : (
                      <View
                        style={[
                          styles.priorityBtn,
                          {
                            backgroundColor: theme.surface,
                            borderColor: isDark ? "rgba(255,255,255,0.06)" : theme.border,
                            borderWidth: 1,
                          },
                        ]}
                      >
                        <View style={[styles.priorityIconWrap, { backgroundColor: theme.border + "50" }]}>
                          <Ionicons name={p.icon as any} size={20} color={theme.textTertiary} />
                        </View>
                        <Text style={[styles.priorityLabel, { color: theme.textTertiary }]}>{p.label}</Text>
                        <Text style={[styles.priorityDesc, { color: theme.textTertiary + "80" }]}>{p.desc}</Text>
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Deadline Toggle */}
          <Pressable
            onPress={() => setHasDeadline((p) => !p)}
            style={[
              styles.toggleRow,
              {
                backgroundColor: theme.surface,
                borderColor: hasDeadline
                  ? theme.primary + "40"
                  : isDark ? "rgba(255,255,255,0.06)" : theme.border,
                borderWidth: hasDeadline ? 1.5 : 1,
              },
            ]}
          >
            <View
              style={[
                styles.toggleIconWrap,
                { backgroundColor: (hasDeadline ? theme.primary : theme.textTertiary) + "18" },
              ]}
            >
              <Ionicons
                name="calendar-outline"
                size={20}
                color={hasDeadline ? theme.primary : theme.textTertiary}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.toggleLabel, { color: theme.text }]}>Set Deadline</Text>
              <Text style={[styles.toggleSub, { color: theme.textSecondary }]}>
                {hasDeadline
                  ? deadline.toLocaleDateString("en-PH", { month: "long", day: "numeric", year: "numeric" })
                  : "Add a due date to this task"}
              </Text>
            </View>
            <View
              style={[
                styles.toggleSwitch,
                { backgroundColor: hasDeadline ? theme.primary : isDark ? "rgba(255,255,255,0.08)" : "#E5E7EB" },
              ]}
            >
              <View style={[styles.toggleThumb, { transform: [{ translateX: hasDeadline ? 20 : 2 }] }]} />
            </View>
          </Pressable>

          {/* Deadline Date Picker */}
          {hasDeadline && (
            <>
              <DateField
                label="Deadline Date"
                value={deadline}
                onPress={() => setPickerOpen(true)}
                accentColor={activePriority.color}
              />
              <DatePickerModal
                visible={pickerOpen}
                value={deadline}
                onChange={setDeadline}
                onClose={() => setPickerOpen(false)}
                minDate={new Date()}
              />
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  headerLabel: { fontSize: 12, fontFamily: "Inter_400Regular" },
  headerTitle: { fontSize: 20, fontFamily: "Inter_700Bold" },
  saveBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  body: { padding: 20, gap: 18 },
  section: { gap: 10 },
  sectionLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  priorityRow: { flexDirection: "row", gap: 10 },
  priorityBtn: {
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 16,
    gap: 6,
  },
  priorityIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  priorityLabel: { fontSize: 12, fontFamily: "Inter_700Bold" },
  priorityDesc: { fontSize: 10, fontFamily: "Inter_400Regular" },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
    borderRadius: 18,
  },
  toggleIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  toggleLabel: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  toggleSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  toggleSwitch: {
    width: 46,
    height: 26,
    borderRadius: 13,
    justifyContent: "center",
    position: "relative",
  },
  toggleThumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#fff",
    position: "absolute",
  },
});

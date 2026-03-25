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

const PRIORITIES: { key: TaskPriority; label: string; icon: string; color: string }[] = [
  { key: "high",   label: "High",   icon: "flame",         color: "#E05A6D" },
  { key: "medium", label: "Medium", icon: "alert-circle",  color: "#F59E0B" },
  { key: "low",    label: "Low",    icon: "chevron-down-circle", color: "#2DD4BF" },
];

function formatDateLocal(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default function AddTaskScreen() {
  const { theme, isDark } = useTheme();
  const { addTask } = useApp();
  const insets = useSafeAreaInsets();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [deadline, setDeadline] = useState(formatDateLocal(new Date()));
  const [hasDeadline, setHasDeadline] = useState(false);

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
      deadline: hasDeadline ? new Date(deadline).toISOString() : undefined,
    });
    router.back();
  };

  return (
    <LinearGradient
      colors={isDark ? ["#0E0E0E", "#140810", "#0E0E0E"] : ["#F0F0F5", "#EDE8F5", "#F0F0F5"]}
      style={styles.container}
    >
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: Platform.OS === "web" ? 67 : insets.top + 12, borderBottomColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)" }]}>
          <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.6 : 1 }]}>
            <Ionicons name="arrow-back" size={22} color={theme.text} />
          </Pressable>
          <View>
            <Text style={[styles.headerLabel, { color: theme.textSecondary }]}>New</Text>
            <Text style={[styles.headerTitle, { color: theme.text }]}>Add Task</Text>
          </View>
          <Pressable
            onPress={handleSave}
            style={({ pressed }) => [
              styles.saveBtn,
              { backgroundColor: theme.primary, shadowColor: theme.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 10, elevation: 6, opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <Ionicons name="checkmark" size={20} color="#fff" />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + 40 }]} showsVerticalScrollIndicator={false}>

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
            <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>Priority</Text>
            <View style={styles.priorityRow}>
              {PRIORITIES.map((p) => (
                <Pressable
                  key={p.key}
                  onPress={() => setPriority(p.key)}
                  style={({ pressed }) => ({ flex: 1, opacity: pressed ? 0.85 : 1 })}
                >
                  {priority === p.key ? (
                    <LinearGradient
                      colors={[p.color + "28", p.color + "14"]}
                      style={[styles.priorityBtn, { borderColor: p.color + "50", borderWidth: 1 }]}
                    >
                      <Ionicons name={p.icon as any} size={18} color={p.color} />
                      <Text style={[styles.priorityLabel, { color: p.color }]}>{p.label}</Text>
                    </LinearGradient>
                  ) : (
                    <View style={[styles.priorityBtn, { backgroundColor: theme.surface, borderColor: isDark ? "rgba(255,255,255,0.06)" : theme.border, borderWidth: 1 }]}>
                      <Ionicons name={p.icon as any} size={18} color={theme.textTertiary} />
                      <Text style={[styles.priorityLabel, { color: theme.textTertiary }]}>{p.label}</Text>
                    </View>
                  )}
                </Pressable>
              ))}
            </View>
          </View>

          {/* Deadline Toggle */}
          <View style={[styles.toggleRow, { backgroundColor: theme.surface, borderColor: isDark ? "rgba(255,255,255,0.06)" : theme.border }]}>
            <View style={styles.toggleInfo}>
              <Ionicons name="calendar-outline" size={20} color={hasDeadline ? theme.primary : theme.textTertiary} />
              <View>
                <Text style={[styles.toggleLabel, { color: theme.text }]}>Set Deadline</Text>
                <Text style={[styles.toggleSub, { color: theme.textSecondary }]}>Add a due date to this task</Text>
              </View>
            </View>
            <Pressable
              onPress={() => setHasDeadline((p) => !p)}
              style={[styles.toggle, { backgroundColor: hasDeadline ? theme.primary : (isDark ? "rgba(255,255,255,0.08)" : "#E5E7EB") }]}
            >
              <View style={[styles.toggleThumb, { transform: [{ translateX: hasDeadline ? 20 : 2 }] }]} />
            </Pressable>
          </View>

          {/* Deadline Date Input */}
          {hasDeadline && (
            <Input
              label="Deadline Date"
              value={deadline}
              onChangeText={setDeadline}
              placeholder="YYYY-MM-DD"
              leftIcon="calendar-outline"
              keyboardType="numeric"
            />
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1 },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerLabel: { fontSize: 12, fontFamily: "Inter_400Regular" },
  headerTitle: { fontSize: 20, fontFamily: "Inter_700Bold" },
  saveBtn: { marginLeft: "auto", width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  body: { padding: 20, gap: 16 },
  section: { gap: 10 },
  sectionLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  priorityRow: { flexDirection: "row", gap: 10 },
  priorityBtn: { alignItems: "center", paddingVertical: 14, borderRadius: 14, gap: 6 },
  priorityLabel: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  toggleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, borderRadius: 16, borderWidth: 1 },
  toggleInfo: { flexDirection: "row", alignItems: "center", gap: 12 },
  toggleLabel: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  toggleSub: { fontSize: 12, fontFamily: "Inter_400Regular" },
  toggle: { width: 46, height: 26, borderRadius: 13, justifyContent: "center", position: "relative" },
  toggleThumb: { width: 22, height: 22, borderRadius: 11, backgroundColor: "#fff", position: "absolute" },
});

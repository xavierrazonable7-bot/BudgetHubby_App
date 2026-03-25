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
import { useApp, EventType } from "@/context/AppContext";
import { Input } from "@/components/ui/Input";

const EVENT_TYPES: { key: EventType; label: string; icon: string; color: string }[] = [
  { key: "assignment", label: "Assignment", icon: "document-text", color: "#6366F1" },
  { key: "quiz",       label: "Quiz",       icon: "help-circle",   color: "#F59E0B" },
  { key: "exam",       label: "Exam",       icon: "school",        color: "#E05A6D" },
  { key: "personal",   label: "Personal",   icon: "person-circle", color: "#2DD4BF" },
];

function formatDateTimeLocal(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function AddEventScreen() {
  const { theme, isDark } = useTheme();
  const { addEvent } = useApp();
  const insets = useSafeAreaInsets();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<EventType>("assignment");
  const [dateStr, setDateStr] = useState(formatDateTimeLocal(new Date()));

  const handleSave = () => {
    if (!title.trim()) {
      Alert.alert("Missing title", "Please enter an event title.");
      return;
    }
    const parsed = new Date(dateStr);
    if (isNaN(parsed.getTime())) {
      Alert.alert("Invalid date", "Please enter a valid date (YYYY-MM-DDTHH:MM).");
      return;
    }
    addEvent({
      title: title.trim(),
      description: description.trim() || undefined,
      type,
      date: parsed.toISOString(),
    });
    router.back();
  };

  const selectedType = EVENT_TYPES.find((t) => t.key === type)!;

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
            <Text style={[styles.headerTitle, { color: theme.text }]}>Add Event</Text>
          </View>
          <Pressable
            onPress={handleSave}
            style={({ pressed }) => [
              styles.saveBtn,
              { backgroundColor: selectedType.color, shadowColor: selectedType.color, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 10, elevation: 6, opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <Ionicons name="checkmark" size={20} color="#fff" />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + 40 }]} showsVerticalScrollIndicator={false}>

          {/* Preview Badge */}
          <LinearGradient
            colors={[selectedType.color + "20", selectedType.color + "10"]}
            style={[styles.previewBadge, { borderColor: selectedType.color + "35" }]}
          >
            <View style={[styles.previewIcon, { backgroundColor: selectedType.color + "20" }]}>
              <Ionicons name={selectedType.icon as any} size={28} color={selectedType.color} />
            </View>
            <View>
              <Text style={[styles.previewType, { color: selectedType.color }]}>{selectedType.label}</Text>
              <Text style={[styles.previewTitle, { color: theme.text }]}>{title || "Event title"}</Text>
            </View>
          </LinearGradient>

          {/* Event Type */}
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>Event Type</Text>
            <View style={styles.typeGrid}>
              {EVENT_TYPES.map((et) => (
                <Pressable key={et.key} onPress={() => setType(et.key)} style={({ pressed }) => ({ flex: 1, opacity: pressed ? 0.85 : 1 })}>
                  {type === et.key ? (
                    <LinearGradient
                      colors={[et.color + "28", et.color + "14"]}
                      style={[styles.typeBtn, { borderColor: et.color + "50", borderWidth: 1 }]}
                    >
                      <Ionicons name={et.icon as any} size={20} color={et.color} />
                      <Text style={[styles.typeLabel, { color: et.color }]}>{et.label}</Text>
                    </LinearGradient>
                  ) : (
                    <View style={[styles.typeBtn, { backgroundColor: theme.surface, borderColor: isDark ? "rgba(255,255,255,0.06)" : theme.border, borderWidth: 1 }]}>
                      <Ionicons name={et.icon as any} size={20} color={theme.textTertiary} />
                      <Text style={[styles.typeLabel, { color: theme.textTertiary }]}>{et.label}</Text>
                    </View>
                  )}
                </Pressable>
              ))}
            </View>
          </View>

          {/* Title */}
          <Input
            label="Event Title"
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Math Final Exam"
            leftIcon="create-outline"
          />

          {/* Description */}
          <Input
            label="Description (optional)"
            value={description}
            onChangeText={setDescription}
            placeholder="Coverage, notes, reminders..."
            multiline
            style={{ minHeight: 80, textAlignVertical: "top" }}
          />

          {/* Date & Time */}
          <Input
            label="Date & Time (YYYY-MM-DDTHH:MM)"
            value={dateStr}
            onChangeText={setDateStr}
            placeholder="2025-01-15T09:00"
            leftIcon="calendar-outline"
            keyboardType="default"
          />
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
  previewBadge: { flexDirection: "row", alignItems: "center", gap: 16, borderRadius: 18, borderWidth: 1, padding: 18 },
  previewIcon: { width: 52, height: 52, borderRadius: 26, alignItems: "center", justifyContent: "center" },
  previewType: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 0.5, marginBottom: 2 },
  previewTitle: { fontSize: 17, fontFamily: "Inter_700Bold" },
  section: { gap: 10 },
  sectionLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  typeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  typeBtn: { alignItems: "center", paddingVertical: 14, paddingHorizontal: 8, borderRadius: 14, gap: 6, minWidth: 70 },
  typeLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
});

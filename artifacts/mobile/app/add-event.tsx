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
import { DatePickerModal, DateField } from "@/components/ui/DatePickerModal";

const EVENT_TYPES: { key: EventType; label: string; icon: string; color: string; desc: string }[] = [
  { key: "assignment", label: "Assignment", icon: "document-text", color: "#6366F1", desc: "Homework" },
  { key: "quiz",       label: "Quiz",       icon: "help-circle",   color: "#F59E0B", desc: "Short test" },
  { key: "exam",       label: "Exam",       icon: "school",        color: "#E05A6D", desc: "Major exam" },
  { key: "personal",   label: "Personal",   icon: "person-circle", color: "#2DD4BF", desc: "My event" },
];

export default function AddEventScreen() {
  const { theme, isDark } = useTheme();
  const { addEvent } = useApp();
  const insets = useSafeAreaInsets();

  const [title, setTitle]           = useState("");
  const [description, setDescription] = useState("");
  const [type, setType]             = useState<EventType>("assignment");
  const [eventDate, setEventDate]   = useState(new Date());
  const [pickerOpen, setPickerOpen] = useState(false);

  const selectedType = EVENT_TYPES.find((t) => t.key === type)!;

  const handleSave = () => {
    if (!title.trim()) {
      Alert.alert("Missing title", "Please enter an event title.");
      return;
    }
    addEvent({
      title: title.trim(),
      description: description.trim() || undefined,
      type,
      date: eventDate.toISOString(),
    });
    router.back();
  };

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
            style={({ pressed }) => [
              styles.iconBtn,
              { backgroundColor: theme.surface, opacity: pressed ? 0.6 : 1 },
            ]}
          >
            <Ionicons name="arrow-back" size={20} color={theme.text} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={[styles.headerLabel, { color: theme.textSecondary }]}>New</Text>
            <Text style={[styles.headerTitle, { color: theme.text }]}>Add Event</Text>
          </View>
          <Pressable
            onPress={handleSave}
            style={({ pressed }) => [
              styles.saveBtn,
              {
                backgroundColor: selectedType.color,
                shadowColor: selectedType.color,
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
          {/* Preview Banner */}
          <LinearGradient
            colors={[selectedType.color + "22", selectedType.color + "0C"]}
            style={[styles.previewBanner, { borderColor: selectedType.color + "35" }]}
          >
            <View
              style={[
                styles.previewIconWrap,
                {
                  backgroundColor: selectedType.color + "22",
                  borderWidth: 1.5,
                  borderColor: selectedType.color + "40",
                },
              ]}
            >
              <Ionicons name={selectedType.icon as any} size={30} color={selectedType.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.previewType, { color: selectedType.color }]}>
                {selectedType.label}
              </Text>
              <Text style={[styles.previewTitle, { color: theme.text }]} numberOfLines={1}>
                {title || "Event title"}
              </Text>
              <Text style={[styles.previewDate, { color: theme.textSecondary }]}>
                {eventDate.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}
                {" · "}
                {eventDate.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" })}
              </Text>
            </View>
          </LinearGradient>

          {/* Event Type */}
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>Event Type</Text>
            <View style={styles.typeGrid}>
              {EVENT_TYPES.map((et) => {
                const active = type === et.key;
                return (
                  <Pressable
                    key={et.key}
                    onPress={() => setType(et.key)}
                    style={({ pressed }) => ({ flex: 1, opacity: pressed ? 0.85 : 1, minWidth: 72 })}
                  >
                    {active ? (
                      <LinearGradient
                        colors={[et.color + "28", et.color + "14"]}
                        style={[styles.typeBtn, { borderColor: et.color + "55", borderWidth: 1.5 }]}
                      >
                        <View style={[styles.typeIconWrap, { backgroundColor: et.color + "22" }]}>
                          <Ionicons name={et.icon as any} size={22} color={et.color} />
                        </View>
                        <Text style={[styles.typeLabel, { color: et.color }]}>{et.label}</Text>
                        <Text style={[styles.typeDesc, { color: et.color + "99" }]}>{et.desc}</Text>
                      </LinearGradient>
                    ) : (
                      <View
                        style={[
                          styles.typeBtn,
                          {
                            backgroundColor: theme.surface,
                            borderColor: isDark ? "rgba(255,255,255,0.06)" : theme.border,
                            borderWidth: 1,
                          },
                        ]}
                      >
                        <View style={[styles.typeIconWrap, { backgroundColor: theme.border + "50" }]}>
                          <Ionicons name={et.icon as any} size={22} color={theme.textTertiary} />
                        </View>
                        <Text style={[styles.typeLabel, { color: theme.textTertiary }]}>{et.label}</Text>
                        <Text style={[styles.typeDesc, { color: theme.textTertiary + "80" }]}>{et.desc}</Text>
                      </View>
                    )}
                  </Pressable>
                );
              })}
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

          {/* Date & Time Picker */}
          <DateField
            label="Date & Time"
            value={eventDate}
            onPress={() => setPickerOpen(true)}
            showTime
            accentColor={selectedType.color}
          />

          <DatePickerModal
            visible={pickerOpen}
            value={eventDate}
            onChange={setEventDate}
            onClose={() => setPickerOpen(false)}
            showTime
          />
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
  /* Preview */
  previewBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
  },
  previewIconWrap: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: "center",
    justifyContent: "center",
  },
  previewType: { fontSize: 11, fontFamily: "Inter_700Bold", letterSpacing: 0.8, marginBottom: 2 },
  previewTitle: { fontSize: 17, fontFamily: "Inter_700Bold" },
  previewDate: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 3 },
  /* Type grid */
  section: { gap: 10 },
  sectionLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  typeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  typeBtn: {
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 6,
    borderRadius: 16,
    gap: 6,
  },
  typeIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  typeLabel: { fontSize: 11, fontFamily: "Inter_700Bold" },
  typeDesc: { fontSize: 10, fontFamily: "Inter_400Regular" },
});

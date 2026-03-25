import React, { useState, useEffect } from "react";
import {
  View, Text, StyleSheet, ScrollView, Pressable, TextInput,
  KeyboardAvoidingView, Platform, Alert,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "@/context/ThemeContext";
import { useApp, NoteType, ChecklistItem } from "@/context/AppContext";
import { generateId } from "@/utils/format";

const NOTE_COLORS = [
  { value: "#E05A6D", label: "Red" },
  { value: "#6366F1", label: "Indigo" },
  { value: "#F59E0B", label: "Amber" },
  { value: "#2DD4BF", label: "Teal" },
  { value: "#10B981", label: "Green" },
  { value: "#A78BFA", label: "Violet" },
];

export default function AddNoteScreen() {
  const { theme, isDark } = useTheme();
  const { notes, addNote, updateNote } = useApp();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ noteId?: string }>();
  const editNote = params.noteId ? notes.find((n) => n.id === params.noteId) : undefined;

  const [title, setTitle] = useState(editNote?.title ?? "");
  const [type, setType] = useState<NoteType>(editNote?.type ?? "text");
  const [content, setContent] = useState(editNote?.content ?? "");
  const [color, setColor] = useState(editNote?.color ?? "#F59E0B");
  const [items, setItems] = useState<ChecklistItem[]>(editNote?.items ?? [{ id: generateId(), text: "", done: false }]);
  const [newItemText, setNewItemText] = useState("");

  const handleSave = () => {
    if (!title.trim()) {
      Alert.alert("Missing title", "Please enter a note title.");
      return;
    }
    const noteData = {
      title: title.trim(),
      type,
      color,
      content: type === "text" ? content.trim() : undefined,
      items: type === "checklist" ? items.filter((i) => i.text.trim()) : undefined,
    };
    if (editNote) {
      updateNote(editNote.id, noteData);
    } else {
      addNote(noteData);
    }
    router.back();
  };

  const addItem = () => {
    if (!newItemText.trim()) return;
    setItems((prev) => [...prev, { id: generateId(), text: newItemText.trim(), done: false }]);
    setNewItemText("");
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const toggleItem = (id: string) => {
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, done: !i.done } : i));
  };

  const updateItemText = (id: string, text: string) => {
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, text } : i));
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
            <Text style={[styles.headerLabel, { color: theme.textSecondary }]}>{editNote ? "Editing" : "New"}</Text>
            <Text style={[styles.headerTitle, { color: theme.text }]}>{editNote ? "Edit Note" : "Add Note"}</Text>
          </View>
          <Pressable
            onPress={handleSave}
            style={({ pressed }) => [
              styles.saveBtn,
              { backgroundColor: color, shadowColor: color, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 10, elevation: 6, opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <Ionicons name="checkmark" size={20} color="#fff" />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + 40 }]} showsVerticalScrollIndicator={false}>

          {/* Title */}
          <View style={[styles.inputWrap, { backgroundColor: theme.surface, borderColor: isDark ? "rgba(255,255,255,0.06)" : theme.border }]}>
            <TextInput
              style={[styles.titleInput, { color: theme.text }]}
              placeholder="Note title"
              placeholderTextColor={theme.textTertiary}
              value={title}
              onChangeText={setTitle}
            />
          </View>

          {/* Type Toggle */}
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>Note Type</Text>
            <View style={[styles.typeToggle, { backgroundColor: theme.surface, borderColor: isDark ? "rgba(255,255,255,0.06)" : theme.border }]}>
              {(["text", "checklist"] as NoteType[]).map((t) => (
                <Pressable key={t} onPress={() => setType(t)} style={{ flex: 1 }}>
                  {type === t ? (
                    <LinearGradient
                      colors={[color + "28", color + "14"]}
                      style={[styles.typeBtn, { borderWidth: 1, borderColor: color + "40" }]}
                    >
                      <Ionicons name={t === "text" ? "document-text" : "checkmark-circle"} size={16} color={color} />
                      <Text style={[styles.typeBtnLabel, { color }]}>{t === "text" ? "Text Note" : "Checklist"}</Text>
                    </LinearGradient>
                  ) : (
                    <View style={[styles.typeBtn, { backgroundColor: "transparent" }]}>
                      <Ionicons name={t === "text" ? "document-text-outline" : "checkmark-circle-outline"} size={16} color={theme.textTertiary} />
                      <Text style={[styles.typeBtnLabel, { color: theme.textTertiary }]}>{t === "text" ? "Text Note" : "Checklist"}</Text>
                    </View>
                  )}
                </Pressable>
              ))}
            </View>
          </View>

          {/* Color Picker */}
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>Color</Text>
            <View style={styles.colorRow}>
              {NOTE_COLORS.map((c) => (
                <Pressable key={c.value} onPress={() => setColor(c.value)} style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
                  <View style={[styles.colorSwatch, { backgroundColor: c.value, borderWidth: color === c.value ? 3 : 0, borderColor: "#fff", shadowColor: c.value, shadowOffset: { width: 0, height: 2 }, shadowOpacity: color === c.value ? 0.6 : 0, shadowRadius: 6, elevation: color === c.value ? 4 : 0 }]}>
                    {color === c.value && <Ionicons name="checkmark" size={16} color="#fff" />}
                  </View>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Content */}
          {type === "text" ? (
            <View style={[styles.contentWrap, { backgroundColor: theme.surface, borderColor: isDark ? "rgba(255,255,255,0.06)" : theme.border }]}>
              <TextInput
                style={[styles.contentInput, { color: theme.text }]}
                placeholder="Start writing your note..."
                placeholderTextColor={theme.textTertiary}
                multiline
                value={content}
                onChangeText={setContent}
              />
            </View>
          ) : (
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>Checklist Items</Text>
              <View style={{ gap: 8 }}>
                {items.map((item) => (
                  <View key={item.id} style={[styles.checklistRow, { backgroundColor: theme.surface, borderColor: isDark ? "rgba(255,255,255,0.06)" : theme.border }]}>
                    <Pressable onPress={() => toggleItem(item.id)} style={[styles.checkBox, item.done ? { backgroundColor: color, borderColor: color } : { backgroundColor: "transparent", borderColor: color + "70" }]}>
                      {item.done && <Ionicons name="checkmark" size={12} color="#fff" />}
                    </Pressable>
                    <TextInput
                      style={[styles.checkInput, { color: item.done ? theme.textTertiary : theme.text, textDecorationLine: item.done ? "line-through" : "none" }]}
                      placeholder="Item..."
                      placeholderTextColor={theme.textTertiary}
                      value={item.text}
                      onChangeText={(t) => updateItemText(item.id, t)}
                    />
                    <Pressable onPress={() => removeItem(item.id)}>
                      <Ionicons name="close" size={18} color={theme.textTertiary} />
                    </Pressable>
                  </View>
                ))}
                {/* Add item row */}
                <View style={[styles.checklistRow, { backgroundColor: theme.surface, borderColor: color + "30", borderStyle: "dashed" }]}>
                  <Ionicons name="add-circle-outline" size={20} color={color} />
                  <TextInput
                    style={[styles.checkInput, { color: theme.text }]}
                    placeholder="Add item..."
                    placeholderTextColor={theme.textTertiary}
                    value={newItemText}
                    onChangeText={setNewItemText}
                    onSubmitEditing={addItem}
                    returnKeyType="done"
                  />
                  {newItemText.trim() ? (
                    <Pressable onPress={addItem}>
                      <Ionicons name="checkmark-circle" size={20} color={color} />
                    </Pressable>
                  ) : null}
                </View>
              </View>
            </View>
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
  inputWrap: { borderRadius: 14, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 12 },
  titleInput: { fontSize: 20, fontFamily: "Inter_700Bold" },
  section: { gap: 10 },
  sectionLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  typeToggle: { flexDirection: "row", borderRadius: 14, padding: 4, borderWidth: 1 },
  typeBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 10, borderRadius: 10, gap: 6 },
  typeBtnLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  colorRow: { flexDirection: "row", gap: 12 },
  colorSwatch: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  contentWrap: { borderRadius: 14, borderWidth: 1, padding: 16, minHeight: 160 },
  contentInput: { fontSize: 15, fontFamily: "Inter_400Regular", lineHeight: 22, minHeight: 140 },
  checklistRow: { flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 12, borderWidth: 1, padding: 12 },
  checkBox: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  checkInput: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular" },
});

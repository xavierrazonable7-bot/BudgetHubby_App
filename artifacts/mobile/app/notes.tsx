import React, { useState } from "react";
import {
  View, Text, StyleSheet, FlatList, Pressable,
  Platform, Alert,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useTheme } from "@/context/ThemeContext";
import { useApp, Note } from "@/context/AppContext";
import { ScreenWrapper } from "@/components/ScreenWrapper";
import { EmptyState } from "@/components/ui/EmptyState";

const NOTE_COLORS = ["#E05A6D", "#6366F1", "#F59E0B", "#2DD4BF", "#10B981", "#A78BFA"];

export default function NotesScreen() {
  const { theme, isDark } = useTheme();
  const { notes, deleteNote, updateNote } = useApp();
  const insets = useSafeAreaInsets();

  const handleDelete = (id: string) => {
    Alert.alert("Delete Note", "Remove this note?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteNote(id) },
    ]);
  };

  const toggleChecklistItem = (note: Note, itemId: string) => {
    if (note.type !== "checklist" || !note.items) return;
    const updated = note.items.map((item) =>
      item.id === itemId ? { ...item, done: !item.done } : item
    );
    updateNote(note.id, { items: updated });
  };

  return (
    <ScreenWrapper>
      {/* Header */}
      <View style={[styles.header, { paddingTop: Platform.OS === "web" ? 67 : insets.top + 12 }]}>
        <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.6 : 1 }]}>
          <Ionicons name="arrow-back" size={22} color={theme.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={[styles.screenLabel, { color: theme.textSecondary }]}>Saved notes</Text>
          <Text style={[styles.title, { color: theme.text }]}>Notes</Text>
        </View>
        <Pressable
          onPress={() => router.push("/add-note")}
          style={({ pressed }) => [
            styles.addBtn,
            { backgroundColor: "#F59E0B", shadowColor: "#F59E0B", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 10, elevation: 6, opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <Ionicons name="add" size={22} color="#fff" />
        </Pressable>
      </View>

      <FlatList
        data={notes}
        keyExtractor={(n) => n.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 40, paddingTop: 8, gap: 12 }}
        ListEmptyComponent={<EmptyState icon="document-text-outline" title="No notes yet" subtitle="Tap + to create your first note" />}
        renderItem={({ item: note, index }) => (
          <Animated.View entering={FadeInDown.delay(index * 50).duration(300)}>
            <LinearGradient
              colors={isDark ? [note.color + "18", note.color + "08"] : [note.color + "12", note.color + "05"]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={[
                styles.noteCard,
                { borderColor: note.color + "28", shadowColor: note.color, shadowOffset: { width: 0, height: 4 }, shadowOpacity: isDark ? 0.2 : 0.08, shadowRadius: 10, elevation: 4 },
              ]}
            >
              {/* Card Header */}
              <View style={styles.noteHeader}>
                <View style={[styles.noteTypeIcon, { backgroundColor: note.color + "20", borderWidth: 1, borderColor: note.color + "30" }]}>
                  <Ionicons name={note.type === "checklist" ? "checkmark-circle-outline" : "document-text-outline"} size={16} color={note.color} />
                </View>
                <Text style={[styles.noteTitle, { color: theme.text }]} numberOfLines={1}>{note.title}</Text>
                <View style={styles.noteActions}>
                  <Pressable onPress={() => router.push({ pathname: "/add-note", params: { noteId: note.id } })} style={styles.actionBtn}>
                    <Ionicons name="pencil-outline" size={16} color={theme.textTertiary} />
                  </Pressable>
                  <Pressable onPress={() => handleDelete(note.id)} style={styles.actionBtn}>
                    <Ionicons name="trash-outline" size={16} color={theme.textTertiary} />
                  </Pressable>
                </View>
              </View>

              {/* Content */}
              {note.type === "text" && note.content ? (
                <Text style={[styles.noteContent, { color: theme.textSecondary }]} numberOfLines={4}>{note.content}</Text>
              ) : note.type === "checklist" && note.items ? (
                <View style={styles.checklistItems}>
                  {note.items.slice(0, 5).map((item) => (
                    <Pressable key={item.id} onPress={() => toggleChecklistItem(note, item.id)} style={styles.checkItem}>
                      <View style={[styles.checkBox, item.done ? { backgroundColor: note.color, borderColor: note.color } : { backgroundColor: "transparent", borderColor: note.color + "60" }]}>
                        {item.done && <Ionicons name="checkmark" size={10} color="#fff" />}
                      </View>
                      <Text style={[styles.checkText, { color: item.done ? theme.textTertiary : theme.textSecondary, textDecorationLine: item.done ? "line-through" : "none" }]}>
                        {item.text}
                      </Text>
                    </Pressable>
                  ))}
                  {note.items.length > 5 && (
                    <Text style={[styles.moreItems, { color: theme.textTertiary }]}>+{note.items.length - 5} more items</Text>
                  )}
                </View>
              ) : null}

              {/* Footer */}
              <Text style={[styles.noteDate, { color: theme.textTertiary }]}>
                {new Date(note.updatedAt).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}
              </Text>
            </LinearGradient>
          </Animated.View>
        )}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 20, paddingBottom: 16 },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  screenLabel: { fontSize: 13, fontFamily: "Inter_400Regular", marginBottom: 2 },
  title: { fontSize: 28, fontFamily: "Inter_700Bold", letterSpacing: -0.4 },
  addBtn: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  noteCard: { borderRadius: 18, borderWidth: 1, padding: 16, gap: 10 },
  noteHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  noteTypeIcon: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  noteTitle: { flex: 1, fontSize: 16, fontFamily: "Inter_700Bold" },
  noteActions: { flexDirection: "row", gap: 4 },
  actionBtn: { padding: 6 },
  noteContent: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 20 },
  checklistItems: { gap: 8 },
  checkItem: { flexDirection: "row", alignItems: "center", gap: 10 },
  checkBox: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  checkText: { fontSize: 14, fontFamily: "Inter_400Regular", flex: 1 },
  moreItems: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 4 },
  noteDate: { fontSize: 11, fontFamily: "Inter_400Regular" },
});

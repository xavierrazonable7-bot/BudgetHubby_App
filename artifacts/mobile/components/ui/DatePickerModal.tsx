import React, { useState } from "react";
import {
  View, Text, StyleSheet, Modal, Pressable, ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/context/ThemeContext";

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];
const DAY_NAMES = ["Su","Mo","Tu","We","Th","Fr","Sa"];

interface DatePickerModalProps {
  visible: boolean;
  value: Date;
  onChange: (date: Date) => void;
  onClose: () => void;
  showTime?: boolean;
  minDate?: Date;
}

export function DatePickerModal({
  visible, value, onChange, onClose, showTime = false, minDate,
}: DatePickerModalProps) {
  const { theme, isDark } = useTheme();

  const [viewYear, setViewYear]   = useState(value.getFullYear());
  const [viewMonth, setViewMonth] = useState(value.getMonth());
  const [hour, setHour]           = useState(value.getHours());
  const [minute, setMinute]       = useState(value.getMinutes());

  const selectedDate = value;

  function daysInMonth(year: number, month: number) {
    return new Date(year, month + 1, 0).getDate();
  }
  function firstDayOfMonth(year: number, month: number) {
    return new Date(year, month, 1).getDay();
  }

  const totalDays  = daysInMonth(viewYear, viewMonth);
  const startDay   = firstDayOfMonth(viewYear, viewMonth);
  const cells      = Array.from({ length: startDay + totalDays });

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  }

  function selectDay(day: number) {
    const d = new Date(viewYear, viewMonth, day, hour, minute, 0, 0);
    onChange(d);
  }

  function isSelected(day: number) {
    return (
      selectedDate.getFullYear() === viewYear &&
      selectedDate.getMonth()    === viewMonth &&
      selectedDate.getDate()     === day
    );
  }

  function isDisabled(day: number) {
    if (!minDate) return false;
    const d = new Date(viewYear, viewMonth, day);
    const m = new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate());
    return d < m;
  }

  function isToday(day: number) {
    const now = new Date();
    return now.getFullYear() === viewYear && now.getMonth() === viewMonth && now.getDate() === day;
  }

  function adjustHour(delta: number) {
    const h = ((hour + delta) + 24) % 24;
    setHour(h);
    const d = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), h, minute);
    onChange(d);
  }
  function adjustMinute(delta: number) {
    const m = ((minute + delta) + 60) % 60;
    setMinute(m);
    const d = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), hour, m);
    onChange(d);
  }

  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={[
            styles.sheet,
            {
              backgroundColor: isDark ? "#1A1A2E" : "#FFFFFF",
              borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 16 },
              shadowOpacity: isDark ? 0.6 : 0.2,
              shadowRadius: 30,
              elevation: 20,
            },
          ]}
        >
          {/* Month Navigation */}
          <View style={styles.monthRow}>
            <Pressable onPress={prevMonth} style={[styles.navBtn, { backgroundColor: theme.surface }]} hitSlop={8}>
              <Ionicons name="chevron-back" size={18} color={theme.text} />
            </Pressable>
            <Text style={[styles.monthLabel, { color: theme.text }]}>
              {MONTH_NAMES[viewMonth]} {viewYear}
            </Text>
            <Pressable onPress={nextMonth} style={[styles.navBtn, { backgroundColor: theme.surface }]} hitSlop={8}>
              <Ionicons name="chevron-forward" size={18} color={theme.text} />
            </Pressable>
          </View>

          {/* Day Headers */}
          <View style={styles.dayHeaders}>
            {DAY_NAMES.map((d) => (
              <Text key={d} style={[styles.dayHeader, { color: theme.textTertiary }]}>{d}</Text>
            ))}
          </View>

          {/* Calendar Grid */}
          <View style={styles.grid}>
            {cells.map((_, idx) => {
              const day = idx - startDay + 1;
              const valid = day >= 1 && day <= totalDays;
              if (!valid) return <View key={idx} style={styles.cell} />;

              const sel  = isSelected(day);
              const dis  = isDisabled(day);
              const tod  = isToday(day);

              return (
                <Pressable
                  key={idx}
                  onPress={() => !dis && selectDay(day)}
                  style={({ pressed }) => [
                    styles.cell,
                    sel && { backgroundColor: theme.primary, borderRadius: 12 },
                    !sel && tod && { borderRadius: 12, borderWidth: 1.5, borderColor: theme.primary + "60" },
                    { opacity: dis ? 0.28 : pressed ? 0.7 : 1 },
                  ]}
                >
                  <Text
                    style={[
                      styles.dayNum,
                      { color: sel ? "#fff" : tod ? theme.primary : theme.text },
                      sel && { fontFamily: "Inter_700Bold" },
                    ]}
                  >
                    {day}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Time Picker */}
          {showTime && (
            <View style={[styles.timePicker, { borderTopColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)" }]}>
              <View style={[styles.timeLabel, { backgroundColor: theme.surface, borderRadius: 8 }]}>
                <Ionicons name="time-outline" size={14} color={theme.textSecondary} />
                <Text style={[styles.timeLabelText, { color: theme.textSecondary }]}>Time</Text>
              </View>
              {/* Hour */}
              <View style={styles.timeUnit}>
                <Pressable onPress={() => adjustHour(1)} hitSlop={8}>
                  <Ionicons name="chevron-up" size={18} color={theme.primary} />
                </Pressable>
                <View style={[styles.timeBox, { backgroundColor: theme.surface, borderColor: isDark ? "rgba(255,255,255,0.08)" : theme.border }]}>
                  <Text style={[styles.timeNum, { color: theme.text }]}>{pad(hour)}</Text>
                </View>
                <Pressable onPress={() => adjustHour(-1)} hitSlop={8}>
                  <Ionicons name="chevron-down" size={18} color={theme.primary} />
                </Pressable>
              </View>

              <Text style={[styles.timeSep, { color: theme.textSecondary }]}>:</Text>

              {/* Minute */}
              <View style={styles.timeUnit}>
                <Pressable onPress={() => adjustMinute(5)} hitSlop={8}>
                  <Ionicons name="chevron-up" size={18} color={theme.primary} />
                </Pressable>
                <View style={[styles.timeBox, { backgroundColor: theme.surface, borderColor: isDark ? "rgba(255,255,255,0.08)" : theme.border }]}>
                  <Text style={[styles.timeNum, { color: theme.text }]}>{pad(minute)}</Text>
                </View>
                <Pressable onPress={() => adjustMinute(-5)} hitSlop={8}>
                  <Ionicons name="chevron-down" size={18} color={theme.primary} />
                </Pressable>
              </View>
            </View>
          )}

          {/* Done */}
          <Pressable
            onPress={onClose}
            style={({ pressed }) => [
              styles.doneBtn,
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
            <Ionicons name="checkmark" size={16} color="#fff" />
            <Text style={styles.doneBtnText}>Confirm</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

/* ── Trigger field ─────────────────────────────────────────────────────────── */
interface DateFieldProps {
  label: string;
  value: Date;
  onPress: () => void;
  showTime?: boolean;
  accentColor?: string;
}

export function DateField({ label, value, onPress, showTime = false, accentColor }: DateFieldProps) {
  const { theme, isDark } = useTheme();

  const dateStr = value.toLocaleDateString("en-PH", {
    weekday: "short", month: "long", day: "numeric", year: "numeric",
  });
  const timeStr = value.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" });

  const accent = accentColor ?? theme.primary;

  return (
    <View style={fieldStyles.wrap}>
      <Text style={[fieldStyles.label, { color: theme.textSecondary }]}>{label}</Text>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          fieldStyles.field,
          {
            backgroundColor: theme.surface,
            borderColor: isDark ? "rgba(255,255,255,0.09)" : theme.border,
            opacity: pressed ? 0.85 : 1,
          },
        ]}
      >
        <View style={[fieldStyles.iconWrap, { backgroundColor: accent + "18" }]}>
          <Ionicons name="calendar" size={18} color={accent} />
        </View>
        <View style={fieldStyles.textWrap}>
          <Text style={[fieldStyles.dateText, { color: theme.text }]}>{dateStr}</Text>
          {showTime && (
            <Text style={[fieldStyles.timeText, { color: theme.textSecondary }]}>{timeStr}</Text>
          )}
        </View>
        <View style={[fieldStyles.chevronWrap, { backgroundColor: accent + "12" }]}>
          <Ionicons name="chevron-forward" size={15} color={accent} />
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  sheet: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    gap: 12,
  },
  monthRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  monthLabel: { fontSize: 16, fontFamily: "Inter_700Bold" },
  dayHeaders: { flexDirection: "row", marginBottom: 6 },
  dayHeader: {
    flex: 1,
    textAlign: "center",
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
  },
  grid: { flexDirection: "row", flexWrap: "wrap" },
  cell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  dayNum: { fontSize: 13, fontFamily: "Inter_500Medium" },
  /* Time */
  timePicker: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingTop: 14,
    borderTopWidth: 1,
    marginTop: 4,
  },
  timeLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  timeLabelText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  timeUnit: { alignItems: "center", gap: 6 },
  timeBox: {
    width: 52,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  timeNum: { fontSize: 20, fontFamily: "Inter_700Bold" },
  timeSep: { fontSize: 22, fontFamily: "Inter_700Bold", marginTop: -4 },
  /* Done */
  doneBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 16,
    marginTop: 4,
  },
  doneBtnText: { fontSize: 15, fontFamily: "Inter_700Bold", color: "#fff" },
});

const fieldStyles = StyleSheet.create({
  wrap: { gap: 8 },
  label: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  field: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  textWrap: { flex: 1, gap: 3 },
  dateText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  timeText: { fontSize: 12, fontFamily: "Inter_400Regular" },
  chevronWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
});

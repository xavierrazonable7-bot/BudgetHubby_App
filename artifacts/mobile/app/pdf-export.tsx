import React, { useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, Pressable, Platform, Alert,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useTheme } from "@/context/ThemeContext";
import { useApp } from "@/context/AppContext";
import { formatCurrency } from "@/utils/format";

const SECTION_OPTIONS = [
  { key: "summary",      label: "Financial Summary", icon: "stats-chart-outline", color: "#E05A6D" },
  { key: "transactions", label: "Transactions",       icon: "receipt-outline",    color: "#6366F1" },
  { key: "tasks",        label: "Tasks",              icon: "checkbox-outline",   color: "#F59E0B" },
  { key: "study",        label: "Study Sessions",     icon: "timer-outline",      color: "#2DD4BF" },
];

async function generateAndSharePDF(html: string) {
  if (Platform.OS === "web") {
    const w = window.open("", "_blank");
    if (w) { w.document.write(html); w.document.close(); }
    return;
  }
  const Print = await import("expo-print");
  const Sharing = await import("expo-sharing");
  const { uri } = await Print.printToFileAsync({ html });
  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(uri, { mimeType: "application/pdf", UTI: "com.adobe.pdf" });
  } else {
    await Print.printAsync({ uri });
  }
}

export default function PdfExportScreen() {
  const { theme, isDark } = useTheme();
  const { userName, transactions, tasks, studySessions, wallets, totalBalance, monthlyIncome, monthlyExpenses } = useApp();
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<Record<string, boolean>>({ summary: true, transactions: true, tasks: true, study: false });
  const [loading, setLoading] = useState(false);

  const toggleSection = (key: string) => setSelected((p) => ({ ...p, [key]: !p[key] }));

  const buildHTML = () => {
    const now = new Date();
    const dateStr = now.toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" });
    const completedTasks = tasks.filter((t) => t.completed).length;
    const totalStudy = studySessions.reduce((s, ss) => s + ss.duration, 0);

    let html = `
<!DOCTYPE html><html><head><meta charset="utf-8"/>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1a1a1a; background: #fff; padding: 40px; }
  .header { background: linear-gradient(135deg, #C0394D, #E05A6D); color: #fff; padding: 32px; border-radius: 16px; margin-bottom: 32px; }
  .header h1 { font-size: 28px; font-weight: 800; letter-spacing: -0.5px; }
  .header p { font-size: 14px; opacity: 0.8; margin-top: 4px; }
  .header .meta { margin-top: 16px; font-size: 13px; opacity: 0.9; }
  .section { margin-bottom: 28px; }
  .section-title { font-size: 18px; font-weight: 700; color: #1a1a1a; border-left: 4px solid #E05A6D; padding-left: 12px; margin-bottom: 16px; }
  .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
  .stat-box { background: #f9f9f9; border: 1px solid #eee; border-radius: 12px; padding: 16px; text-align: center; }
  .stat-box .value { font-size: 22px; font-weight: 700; color: #E05A6D; }
  .stat-box .label { font-size: 12px; color: #666; margin-top: 4px; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th { background: #f3f3f3; text-align: left; padding: 10px 12px; font-weight: 600; color: #444; }
  td { padding: 10px 12px; border-bottom: 1px solid #f0f0f0; color: #333; }
  tr:last-child td { border-bottom: none; }
  .badge { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; }
  .badge-income { background: #d1fae5; color: #065f46; }
  .badge-expense { background: #fee2e2; color: #991b1b; }
  .badge-high { background: #fee2e2; color: #991b1b; }
  .badge-medium { background: #fef3c7; color: #92400e; }
  .badge-low { background: #d1fae5; color: #065f46; }
  .badge-done { background: #d1fae5; color: #065f46; }
  .badge-pending { background: #f3f4f6; color: #6b7280; }
  .footer { margin-top: 40px; text-align: center; color: #aaa; font-size: 12px; border-top: 1px solid #eee; padding-top: 20px; }
</style>
</head><body>

<div class="header">
  <h1>BudgetBuddy Report</h1>
  <p>Philippine Peso Financial & Study Summary</p>
  <div class="meta">
    <strong>Name:</strong> ${userName || "Student"} &nbsp;&nbsp;
    <strong>Generated:</strong> ${dateStr}
  </div>
</div>`;

    if (selected.summary) {
      html += `
<div class="section">
  <div class="section-title">Financial Summary</div>
  <div class="stats-grid">
    <div class="stat-box"><div class="value">${formatCurrency(totalBalance)}</div><div class="label">Total Balance</div></div>
    <div class="stat-box"><div class="value" style="color:#2DD4BF">${formatCurrency(monthlyIncome)}</div><div class="label">Monthly Income</div></div>
    <div class="stat-box"><div class="value" style="color:#E05A6D">${formatCurrency(monthlyExpenses)}</div><div class="label">Monthly Expenses</div></div>
  </div>
</div>`;
    }

    if (selected.transactions && transactions.length > 0) {
      html += `
<div class="section">
  <div class="section-title">Transactions (${transactions.length} total)</div>
  <table>
    <thead><tr><th>Date</th><th>Category</th><th>Note</th><th>Type</th><th>Amount</th></tr></thead>
    <tbody>
      ${transactions.slice(0, 30).map((t) => `
        <tr>
          <td>${new Date(t.date).toLocaleDateString("en-PH")}</td>
          <td>${t.category}</td>
          <td>${t.note || "—"}</td>
          <td><span class="badge badge-${t.type}">${t.type}</span></td>
          <td style="font-weight:600;color:${t.type === "income" ? "#2DD4BF" : "#E05A6D"}">${t.type === "income" ? "+" : "-"}${formatCurrency(t.amount)}</td>
        </tr>`).join("")}
    </tbody>
  </table>
  ${transactions.length > 30 ? `<p style="margin-top:8px;font-size:12px;color:#999">Showing latest 30 of ${transactions.length} transactions</p>` : ""}
</div>`;
    }

    if (selected.tasks && tasks.length > 0) {
      html += `
<div class="section">
  <div class="section-title">Tasks (${completedTasks}/${tasks.length} completed)</div>
  <table>
    <thead><tr><th>Task</th><th>Priority</th><th>Deadline</th><th>Status</th></tr></thead>
    <tbody>
      ${tasks.map((t) => `
        <tr>
          <td>${t.title}</td>
          <td><span class="badge badge-${t.priority}">${t.priority}</span></td>
          <td>${t.deadline ? new Date(t.deadline).toLocaleDateString("en-PH") : "—"}</td>
          <td><span class="badge badge-${t.completed ? "done" : "pending"}">${t.completed ? "Done" : "Pending"}</span></td>
        </tr>`).join("")}
    </tbody>
  </table>
</div>`;
    }

    if (selected.study && studySessions.length > 0) {
      html += `
<div class="section">
  <div class="section-title">Study Sessions (${studySessions.length} sessions · ${totalStudy} min total)</div>
  <table>
    <thead><tr><th>Date</th><th>Duration</th><th>Pomodoros</th></tr></thead>
    <tbody>
      ${studySessions.slice(0, 20).map((s) => `
        <tr>
          <td>${new Date(s.date).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}</td>
          <td>${s.duration} min</td>
          <td>${s.completedPomodoros} 🍅</td>
        </tr>`).join("")}
    </tbody>
  </table>
</div>`;
    }

    html += `<div class="footer">Generated by BudgetBuddy · Your all-in-one student finance app 🇵🇭</div></body></html>`;
    return html;
  };

  const handleExport = async () => {
    const anySel = Object.values(selected).some(Boolean);
    if (!anySel) {
      Alert.alert("Nothing selected", "Please select at least one section to export.");
      return;
    }
    setLoading(true);
    try {
      await generateAndSharePDF(buildHTML());
    } catch (e) {
      Alert.alert("Export failed", "Could not generate PDF. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={isDark ? ["#0E0E0E", "#140810", "#0E0E0E"] : ["#F0F0F5", "#EDE8F5", "#F0F0F5"]}
      style={styles.container}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40, paddingTop: Platform.OS === "web" ? 67 : insets.top + 12 }}
      >
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(300)} style={styles.header}>
          <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.6 : 1 }]}>
            <Ionicons name="arrow-back" size={22} color={theme.text} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={[styles.screenLabel, { color: theme.textSecondary }]}>Share your data</Text>
            <Text style={[styles.title, { color: theme.text }]}>Export PDF</Text>
          </View>
        </Animated.View>

        {/* Hero */}
        <Animated.View entering={FadeInDown.delay(60).duration(350)} style={{ paddingHorizontal: 20, marginBottom: 28 }}>
          <LinearGradient
            colors={["#6B1DE0", "#A78BFA", "#6366F1"]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={[styles.heroBanner, { shadowColor: "#6366F1", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 20, elevation: 10 }]}
          >
            <View style={styles.heroDecoA} />
            <View style={styles.heroDecoB} />
            <Ionicons name="document-text" size={40} color="rgba(255,255,255,0.9)" />
            <Text style={styles.heroTitle}>Professional Report</Text>
            <Text style={styles.heroSub}>Export a clean, well-formatted PDF of your financial and study data to share or archive.</Text>
          </LinearGradient>
        </Animated.View>

        {/* Section Picker */}
        <Animated.View entering={FadeInDown.delay(120).duration(350)} style={{ paddingHorizontal: 20, marginBottom: 24 }}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Choose Sections</Text>
          <Text style={[styles.sectionSub, { color: theme.textSecondary }]}>Select what to include in the export</Text>
          <View style={styles.optionsGrid}>
            {SECTION_OPTIONS.map((opt) => {
              const on = selected[opt.key];
              return (
                <Pressable key={opt.key} onPress={() => toggleSection(opt.key)} style={({ pressed }) => ({ flex: 1, minWidth: "45%", opacity: pressed ? 0.85 : 1 })}>
                  <LinearGradient
                    colors={on ? [opt.color + "20", opt.color + "10"] : [isDark ? "#1A1A1A" : "#FAFAFA", isDark ? "#1A1A1A" : "#FAFAFA"]}
                    style={[styles.optionCard, { borderColor: on ? opt.color + "40" : (isDark ? "rgba(255,255,255,0.06)" : theme.border), borderWidth: 1 }]}
                  >
                    <View style={[styles.optionIcon, { backgroundColor: opt.color + "20" }]}>
                      <Ionicons name={opt.icon as any} size={20} color={on ? opt.color : theme.textTertiary} />
                    </View>
                    <Text style={[styles.optionLabel, { color: on ? theme.text : theme.textSecondary }]}>{opt.label}</Text>
                    {on && <View style={[styles.checkMark, { backgroundColor: opt.color }]}><Ionicons name="checkmark" size={10} color="#fff" /></View>}
                  </LinearGradient>
                </Pressable>
              );
            })}
          </View>
        </Animated.View>

        {/* Preview Stats */}
        <Animated.View entering={FadeInDown.delay(180).duration(350)} style={{ paddingHorizontal: 20, marginBottom: 28 }}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Report Preview</Text>
          <View style={[styles.previewCard, { backgroundColor: theme.surface, borderColor: isDark ? "rgba(255,255,255,0.05)" : theme.border }]}>
            {[
              { label: "Transactions", value: transactions.length, show: selected.transactions },
              { label: "Tasks", value: tasks.length, show: selected.tasks },
              { label: "Study Sessions", value: studySessions.length, show: selected.study },
              { label: "Wallets", value: wallets.length, show: selected.summary },
            ].map((row) => (
              <View key={row.label} style={[styles.previewRow, { borderBottomColor: isDark ? "rgba(255,255,255,0.04)" : theme.border }]}>
                <Text style={[styles.previewLabel, { color: theme.textSecondary }]}>{row.label}</Text>
                <Text style={[styles.previewVal, { color: row.show ? theme.text : theme.textTertiary }]}>
                  {row.show ? row.value : "—"}
                </Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Export Button */}
        <Animated.View entering={FadeInDown.delay(240).duration(350)} style={{ paddingHorizontal: 20 }}>
          <Pressable
            onPress={handleExport}
            disabled={loading}
            style={({ pressed }) => ({ opacity: pressed || loading ? 0.85 : 1 })}
          >
            <LinearGradient
              colors={["#6B1DE0", "#A78BFA"]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={[styles.exportBtn, { shadowColor: "#6366F1", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.5, shadowRadius: 16, elevation: 10 }]}
            >
              <Ionicons name={loading ? "hourglass-outline" : "share-outline"} size={22} color="#fff" />
              <Text style={styles.exportBtnText}>{loading ? "Generating PDF…" : "Export & Share PDF"}</Text>
            </LinearGradient>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 20, paddingBottom: 16 },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  screenLabel: { fontSize: 13, fontFamily: "Inter_400Regular", marginBottom: 2 },
  title: { fontSize: 28, fontFamily: "Inter_700Bold", letterSpacing: -0.4 },
  heroBanner: { borderRadius: 22, padding: 28, alignItems: "center", gap: 10, overflow: "hidden", position: "relative" },
  heroDecoA: { position: "absolute", width: 120, height: 120, borderRadius: 60, backgroundColor: "rgba(255,255,255,0.08)", top: -30, right: -20 },
  heroDecoB: { position: "absolute", width: 70, height: 70, borderRadius: 35, backgroundColor: "rgba(255,255,255,0.05)", bottom: -10, left: 20 },
  heroTitle: { fontSize: 20, fontFamily: "Inter_700Bold", color: "#fff" },
  heroSub: { fontSize: 13, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.75)", textAlign: "center", lineHeight: 19 },
  sectionTitle: { fontSize: 18, fontFamily: "Inter_700Bold", marginBottom: 4 },
  sectionSub: { fontSize: 13, fontFamily: "Inter_400Regular", marginBottom: 14 },
  optionsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  optionCard: { borderRadius: 16, padding: 16, alignItems: "center", gap: 10, position: "relative" },
  optionIcon: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  optionLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold", textAlign: "center" },
  checkMark: { position: "absolute", top: 10, right: 10, width: 20, height: 20, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  previewCard: { borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  previewRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  previewLabel: { fontSize: 14, fontFamily: "Inter_400Regular" },
  previewVal: { fontSize: 14, fontFamily: "Inter_700Bold" },
  exportBtn: { borderRadius: 18, paddingVertical: 18, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10 },
  exportBtnText: { fontSize: 17, fontFamily: "Inter_700Bold", color: "#fff" },
});

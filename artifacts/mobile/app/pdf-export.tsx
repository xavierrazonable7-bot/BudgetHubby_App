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

/* ─── Section options ─────────────────────────────────────────────────────── */
const SECTION_OPTIONS = [
  { key: "summary",      label: "Financial Summary", icon: "stats-chart-outline", color: "#E05A6D" },
  { key: "transactions", label: "Transactions",       icon: "receipt-outline",    color: "#6366F1" },
  { key: "tasks",        label: "Tasks",              icon: "checkbox-outline",   color: "#F59E0B" },
  { key: "study",        label: "Study Sessions",     icon: "timer-outline",      color: "#2DD4BF" },
];

type Format = "pdf" | "excel" | "csv";
const FORMAT_OPTIONS: { key: Format; label: string; icon: string; color: string; ext: string }[] = [
  { key: "pdf",   label: "PDF",   icon: "document-text-outline", color: "#E05A6D", ext: ".pdf" },
  { key: "excel", label: "Excel", icon: "grid-outline",          color: "#2DD4BF", ext: ".xlsx" },
  { key: "csv",   label: "CSV",   icon: "list-outline",          color: "#F59E0B", ext: ".csv" },
];

/* ─── PDF helpers ─────────────────────────────────────────────────────────── */
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

/* ─── Excel helpers ───────────────────────────────────────────────────────── */
async function generateAndShareExcel(
  worksheets: { name: string; rows: (string | number)[][] }[]
) {
  if (Platform.OS === "web") {
    Alert.alert("Excel export is not supported in the web preview. Please use a device.");
    return;
  }
  const XLSX = (await import("xlsx")).default;
  const FileSystem = await import("expo-file-system");
  const Sharing = await import("expo-sharing");

  const wb = XLSX.utils.book_new();
  for (const ws of worksheets) {
    const sheet = XLSX.utils.aoa_to_sheet(ws.rows);
    XLSX.utils.book_append_sheet(wb, sheet, ws.name);
  }
  const wbout: string = XLSX.write(wb, { type: "base64", bookType: "xlsx" });
  const fileUri = (FileSystem.documentDirectory ?? "") + "Timpla_Export.xlsx";
  await FileSystem.writeAsStringAsync(fileUri, wbout, { encoding: FileSystem.EncodingType.Base64 });
  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(fileUri, {
      mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      UTI: "com.microsoft.excel.xlsx",
    });
  } else {
    Alert.alert("Saved", `File saved to: ${fileUri}`);
  }
}

/* ─── CSV helpers ─────────────────────────────────────────────────────────── */
function escapeCSV(value: string | number): string {
  const s = String(value ?? "");
  return `"${s.replace(/"/g, '""')}"`;
}

function rowToCSV(row: (string | number)[]): string {
  return row.map(escapeCSV).join(",");
}

async function generateAndShareCSV(rows: (string | number)[][], filename: string) {
  if (Platform.OS === "web") {
    const csv = rows.map(rowToCSV).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
    return;
  }
  const FileSystem = await import("expo-file-system");
  const Sharing = await import("expo-sharing");
  const csv = rows.map(rowToCSV).join("\n");
  const fileUri = (FileSystem.documentDirectory ?? "") + filename;
  await FileSystem.writeAsStringAsync(fileUri, csv, { encoding: FileSystem.EncodingType.UTF8 });
  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(fileUri, { mimeType: "text/csv", UTI: "public.comma-separated-values-text" });
  } else {
    Alert.alert("Saved", `File saved to: ${fileUri}`);
  }
}

/* ─── Screen ──────────────────────────────────────────────────────────────── */
export default function PdfExportScreen() {
  const { theme, isDark } = useTheme();
  const { userName, transactions, tasks, studySessions, wallets, totalBalance, monthlyIncome, monthlyExpenses } = useApp();
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<Record<string, boolean>>({ summary: true, transactions: true, tasks: true, study: false });
  const [format, setFormat] = useState<Format>("pdf");
  const [loading, setLoading] = useState(false);

  const toggleSection = (key: string) => setSelected((p) => ({ ...p, [key]: !p[key] }));

  /* ── Build PDF HTML ─────────────────────────────────────────────────────── */
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
  .header-top { display: flex; align-items: center; justify-content: space-between; }
  .header h1 { font-size: 28px; font-weight: 800; letter-spacing: -0.5px; }
  .header .tagline { font-size: 14px; opacity: 0.8; margin-top: 4px; }
  .header .divider { border: 0; border-top: 1px solid rgba(255,255,255,0.3); margin: 16px 0; }
  .header .meta-grid { display: flex; gap: 32px; font-size: 13px; opacity: 0.9; }
  .header .meta-grid span strong { display: block; font-size: 11px; opacity: 0.7; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px; }
  .header .badge-ph { background: rgba(255,255,255,0.2); border-radius: 6px; padding: 4px 10px; font-size: 12px; font-weight: 700; }
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
  <div class="header-top">
    <h1>Timpla</h1>
    <span class="badge-ph">🇵🇭 Philippine Peso</span>
  </div>
  <div class="tagline">Financial &amp; Study Report</div>
  <hr class="divider"/>
  <div class="meta-grid">
    <span><strong>Prepared for</strong>${userName || "Student"}</span>
    <span><strong>Generated on</strong>${dateStr}</span>
    <span><strong>Sections</strong>${Object.values(selected).filter(Boolean).length} included</span>
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
  <div class="section-title">Tasks (${tasks.filter((t) => t.completed).length}/${tasks.length} completed)</div>
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
          <td>${s.completedPomodoros}</td>
        </tr>`).join("")}
    </tbody>
  </table>
</div>`;
    }

    html += `<div class="footer">Generated by Timpla · Your all-in-one student finance &amp; study app 🇵🇭</div></body></html>`;
    return html;
  };

  /* ── Build Excel worksheets ─────────────────────────────────────────────── */
  const buildExcelData = () => {
    const sheets: { name: string; rows: (string | number)[][] }[] = [];

    if (selected.summary) {
      sheets.push({
        name: "Summary",
        rows: [
          ["Timpla — Financial Summary"],
          ["Prepared for", userName || "Student"],
          ["Generated", new Date().toLocaleDateString("en-PH")],
          [],
          ["Metric", "Amount (PHP)"],
          ["Total Balance", totalBalance],
          ["Monthly Income", monthlyIncome],
          ["Monthly Expenses", monthlyExpenses],
          ["Net this month", monthlyIncome - monthlyExpenses],
          [],
          ["Wallets", wallets.length],
          ["Total Transactions", transactions.length],
          ["Total Tasks", tasks.length],
          ["Completed Tasks", tasks.filter((t) => t.completed).length],
          ["Study Sessions", studySessions.length],
          ["Total Study Time (min)", studySessions.reduce((s, ss) => s + ss.duration, 0)],
        ],
      });
    }

    if (selected.transactions && transactions.length > 0) {
      sheets.push({
        name: "Transactions",
        rows: [
          ["Date", "Category", "Note", "Type", "Amount (PHP)", "Wallet"],
          ...transactions.map((t) => [
            new Date(t.date).toLocaleDateString("en-PH"),
            t.category,
            t.note || "",
            t.type,
            t.type === "income" ? t.amount : -t.amount,
            t.walletId || "",
          ]),
        ],
      });
    }

    if (selected.tasks && tasks.length > 0) {
      sheets.push({
        name: "Tasks",
        rows: [
          ["Title", "Priority", "Deadline", "Status"],
          ...tasks.map((t) => [
            t.title,
            t.priority,
            t.deadline ? new Date(t.deadline).toLocaleDateString("en-PH") : "",
            t.completed ? "Done" : "Pending",
          ]),
        ],
      });
    }

    if (selected.study && studySessions.length > 0) {
      sheets.push({
        name: "Study Sessions",
        rows: [
          ["Date", "Duration (min)", "Pomodoros"],
          ...studySessions.map((s) => [
            new Date(s.date).toLocaleDateString("en-PH"),
            s.duration,
            s.completedPomodoros,
          ]),
        ],
      });
    }

    return sheets;
  };

  /* ── Build CSV rows (all sections merged with section headers) ──────────── */
  const buildCSVData = (): (string | number)[][] => {
    const rows: (string | number)[][] = [];
    const dateStr = new Date().toLocaleDateString("en-PH");

    rows.push(["Timpla Data Export"]);
    rows.push(["Prepared for", userName || "Student"]);
    rows.push(["Generated", dateStr]);
    rows.push([]);

    if (selected.summary) {
      rows.push(["FINANCIAL SUMMARY"]);
      rows.push(["Total Balance (PHP)", totalBalance]);
      rows.push(["Monthly Income (PHP)", monthlyIncome]);
      rows.push(["Monthly Expenses (PHP)", monthlyExpenses]);
      rows.push(["Net this month (PHP)", monthlyIncome - monthlyExpenses]);
      rows.push([]);
    }

    if (selected.transactions && transactions.length > 0) {
      rows.push(["TRANSACTIONS"]);
      rows.push(["Date", "Category", "Note", "Type", "Amount (PHP)"]);
      for (const t of transactions) {
        rows.push([
          new Date(t.date).toLocaleDateString("en-PH"),
          t.category,
          t.note || "",
          t.type,
          t.type === "income" ? t.amount : -t.amount,
        ]);
      }
      rows.push([]);
    }

    if (selected.tasks && tasks.length > 0) {
      rows.push(["TASKS"]);
      rows.push(["Title", "Priority", "Deadline", "Status"]);
      for (const t of tasks) {
        rows.push([
          t.title,
          t.priority,
          t.deadline ? new Date(t.deadline).toLocaleDateString("en-PH") : "",
          t.completed ? "Done" : "Pending",
        ]);
      }
      rows.push([]);
    }

    if (selected.study && studySessions.length > 0) {
      rows.push(["STUDY SESSIONS"]);
      rows.push(["Date", "Duration (min)", "Pomodoros"]);
      for (const s of studySessions) {
        rows.push([
          new Date(s.date).toLocaleDateString("en-PH"),
          s.duration,
          s.completedPomodoros,
        ]);
      }
    }

    return rows;
  };

  /* ── Export handler ─────────────────────────────────────────────────────── */
  const handleExport = async () => {
    const anySel = Object.values(selected).some(Boolean);
    if (!anySel) {
      Alert.alert("Nothing selected", "Please select at least one section to export.");
      return;
    }
    setLoading(true);
    try {
      if (format === "pdf") {
        await generateAndSharePDF(buildHTML());
      } else if (format === "excel") {
        const sheets = buildExcelData();
        if (sheets.length === 0) {
          Alert.alert("No data", "The selected sections have no data to export.");
          return;
        }
        await generateAndShareExcel(sheets);
      } else {
        const rows = buildCSVData();
        if (rows.length <= 4) {
          Alert.alert("No data", "The selected sections have no data to export.");
          return;
        }
        await generateAndShareCSV(rows, "Timpla_Export.csv");
      }
    } catch (e) {
      console.error(e);
      Alert.alert("Export failed", "Could not generate the file. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  /* ── Labels & colors by format ──────────────────────────────────────────── */
  const currentFmt = FORMAT_OPTIONS.find((f) => f.key === format)!;
  const exportLabel = loading ? `Generating ${currentFmt.label}…` : `Export & Share ${currentFmt.label}`;

  return (
    <LinearGradient
      colors={isDark ? ["#0E0E0E", "#140810", "#0E0E0E"] : ["#F0F0F5", "#EDE8F5", "#F0F0F5"]}
      style={styles.container}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40, paddingTop: Platform.OS === "web" ? 67 : insets.top + 12 }}
      >
        {/* ── Header ── */}
        <Animated.View entering={FadeInDown.duration(300)} style={styles.header}>
          <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.6 : 1 }]}>
            <Ionicons name="arrow-back" size={22} color={theme.text} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={[styles.screenLabel, { color: theme.textSecondary }]}>Share your data</Text>
            <Text style={[styles.title, { color: theme.text }]}>Export Data</Text>
          </View>
        </Animated.View>

        {/* ── Hero banner ── */}
        <Animated.View entering={FadeInDown.delay(60).duration(350)} style={{ paddingHorizontal: 20, marginBottom: 24 }}>
          <LinearGradient
            colors={["#6B1DE0", "#A78BFA", "#6366F1"]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={[styles.heroBanner, { shadowColor: "#6366F1", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 20, elevation: 10 }]}
          >
            <View style={styles.heroDecoA} />
            <View style={styles.heroDecoB} />
            <Ionicons name="cloud-download-outline" size={40} color="rgba(255,255,255,0.9)" />
            <Text style={styles.heroTitle}>Professional Export</Text>
            <Text style={styles.heroSub}>Export your financial and study data as PDF, Excel, or CSV — clean, organized, and ready to share.</Text>
          </LinearGradient>
        </Animated.View>

        {/* ── Format selector ── */}
        <Animated.View entering={FadeInDown.delay(100).duration(350)} style={{ paddingHorizontal: 20, marginBottom: 22 }}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Export Format</Text>
          <Text style={[styles.sectionSub, { color: theme.textSecondary }]}>Choose the file format</Text>
          <View style={styles.formatRow}>
            {FORMAT_OPTIONS.map((f) => {
              const active = format === f.key;
              return (
                <Pressable
                  key={f.key}
                  onPress={() => setFormat(f.key)}
                  style={({ pressed }) => ({ flex: 1, opacity: pressed ? 0.85 : 1 })}
                >
                  <LinearGradient
                    colors={active ? [f.color + "22", f.color + "10"] : [isDark ? "#1A1A1A" : "#FAFAFA", isDark ? "#1A1A1A" : "#FAFAFA"]}
                    style={[styles.formatCard, { borderColor: active ? f.color + "55" : (isDark ? "rgba(255,255,255,0.07)" : theme.border), borderWidth: 1.5 }]}
                  >
                    <View style={[styles.formatIcon, { backgroundColor: f.color + (active ? "28" : "14") }]}>
                      <Ionicons name={f.icon as any} size={20} color={active ? f.color : theme.textTertiary} />
                    </View>
                    <Text style={[styles.formatLabel, { color: active ? f.color : theme.textSecondary, fontFamily: active ? "Inter_700Bold" : "Inter_500Medium" }]}>
                      {f.label}
                    </Text>
                    {active && (
                      <View style={[styles.formatDot, { backgroundColor: f.color }]} />
                    )}
                  </LinearGradient>
                </Pressable>
              );
            })}
          </View>
        </Animated.View>

        {/* ── Section picker ── */}
        <Animated.View entering={FadeInDown.delay(140).duration(350)} style={{ paddingHorizontal: 20, marginBottom: 22 }}>
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

        {/* ── Preview stats ── */}
        <Animated.View entering={FadeInDown.delay(180).duration(350)} style={{ paddingHorizontal: 20, marginBottom: 28 }}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Report Preview</Text>
          <View style={[styles.previewCard, { backgroundColor: theme.surface, borderColor: isDark ? "rgba(255,255,255,0.05)" : theme.border }]}>
            {[
              { label: "Transactions", value: transactions.length, show: selected.transactions },
              { label: "Tasks",        value: tasks.length,        show: selected.tasks },
              { label: "Study Sessions", value: studySessions.length, show: selected.study },
              { label: "Wallets",      value: wallets.length,      show: selected.summary },
            ].map((row, i, arr) => (
              <View key={row.label} style={[styles.previewRow, { borderBottomColor: isDark ? "rgba(255,255,255,0.04)" : theme.border, borderBottomWidth: i < arr.length - 1 ? 1 : 0 }]}>
                <Text style={[styles.previewLabel, { color: theme.textSecondary }]}>{row.label}</Text>
                <Text style={[styles.previewVal, { color: row.show ? theme.text : theme.textTertiary }]}>
                  {row.show ? row.value : "—"}
                </Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* ── Export button ── */}
        <Animated.View entering={FadeInDown.delay(220).duration(350)} style={{ paddingHorizontal: 20 }}>
          <Pressable
            onPress={handleExport}
            disabled={loading}
            style={({ pressed }) => ({ opacity: pressed || loading ? 0.85 : 1 })}
          >
            <LinearGradient
              colors={[currentFmt.color + "EE", currentFmt.color + "AA"]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={[styles.exportBtn, { shadowColor: currentFmt.color, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.5, shadowRadius: 16, elevation: 10 }]}
            >
              <Ionicons name={loading ? "hourglass-outline" : (currentFmt.icon as any)} size={22} color="#fff" />
              <Text style={styles.exportBtnText}>{exportLabel}</Text>
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
  formatRow: { flexDirection: "row", gap: 10 },
  formatCard: { borderRadius: 16, padding: 14, alignItems: "center", gap: 8, position: "relative" },
  formatIcon: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center" },
  formatLabel: { fontSize: 13 },
  formatDot: { width: 6, height: 6, borderRadius: 3 },
  optionsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  optionCard: { borderRadius: 16, padding: 16, alignItems: "center", gap: 10, position: "relative" },
  optionIcon: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  optionLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold", textAlign: "center" },
  checkMark: { position: "absolute", top: 10, right: 10, width: 20, height: 20, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  previewCard: { borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  previewRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14 },
  previewLabel: { fontSize: 14, fontFamily: "Inter_400Regular" },
  previewVal: { fontSize: 14, fontFamily: "Inter_700Bold" },
  exportBtn: { borderRadius: 18, paddingVertical: 18, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10 },
  exportBtnText: { fontSize: 17, fontFamily: "Inter_700Bold", color: "#fff" },
});

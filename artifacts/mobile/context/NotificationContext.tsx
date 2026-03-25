import React, {
  createContext, useContext, useState, useEffect, useCallback, useRef,
} from "react";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useApp } from "./AppContext";

// ─── Types ────────────────────────────────────────────────────────────────────
export type NotifType  = "task" | "event" | "budget" | "system";
export type PermStatus = "granted" | "denied" | "undetermined";

export interface AppNotification {
  id:        string;
  title:     string;
  body:      string;
  type:      NotifType;
  color:     string;
  icon:      string;
  createdAt: string;
  read:      boolean;
}

interface NotificationContextType {
  notifications:      AppNotification[];
  unreadCount:        number;
  permStatus:         PermStatus;
  requestPermission:  () => Promise<void>;
  markAllRead:        () => void;
  markRead:           (id: string) => void;
  refreshNotifications: () => void;
}

// ─── Handler (must be set at module level) ───────────────────────────────────
if (Platform.OS !== "web") {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert:  true,
      shouldPlaySound:  true,
      shouldSetBadge:   true,
      shouldShowBanner: true,
      shouldShowList:   true,
    }),
  });
}

// ─── Storage key ─────────────────────────────────────────────────────────────
const READ_KEY = "@timpla_notif_read_ids";

// ─── Smart notification builder ───────────────────────────────────────────────
function buildNotifications(
  tasks:           any[],
  events:          any[],
  monthlyIncome:   number,
  monthlyExpenses: number,
  readIds:         Set<string>,
): AppNotification[] {
  const list: AppNotification[] = [];
  const now = new Date(); now.setHours(0, 0, 0, 0);
  const tomorrow = new Date(now); tomorrow.setDate(now.getDate() + 1);

  const add = (
    id: string, title: string, body: string,
    type: NotifType, color: string, icon: string,
  ) => list.push({ id, title, body, type, color, icon, createdAt: new Date().toISOString(), read: readIds.has(id) });

  // Overdue tasks
  const overdue = tasks.filter((t) => {
    if (t.completed || !t.deadline) return false;
    const d = new Date(t.deadline); d.setHours(0, 0, 0, 0);
    return d < now;
  });
  if (overdue.length > 0) {
    const sample = overdue.slice(0, 2).map((t) => `"${t.title}"`).join(", ");
    const extra = overdue.length > 2 ? ` +${overdue.length - 2} more` : "";
    add(
      "overdue-tasks",
      `${overdue.length} Overdue Task${overdue.length > 1 ? "s" : ""}`,
      `${sample}${extra} ${overdue.length > 1 ? "are" : "is"} past deadline.`,
      "task", "#E05A6D", "alert-circle",
    );
  }

  // Tasks due today
  tasks.filter((t) => {
    if (t.completed || !t.deadline) return false;
    const d = new Date(t.deadline); d.setHours(0, 0, 0, 0);
    return d.getTime() === now.getTime();
  }).forEach((t) =>
    add(`task-today-${t.id}`, "Task Due Today",
      `"${t.title}" is due today. Don't forget to complete it!`,
      "task", "#F59E0B", "time"),
  );

  // Events today
  events.filter((e) => {
    const d = new Date(e.date); d.setHours(0, 0, 0, 0);
    return d.getTime() === now.getTime();
  }).forEach((e) =>
    add(`event-today-${e.id}`, "Event Today",
      `"${e.title}" is scheduled for today at ${new Date(e.date).toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" })}.`,
      "event", "#6366F1", "calendar"),
  );

  // Events tomorrow
  events.filter((e) => {
    const d = new Date(e.date); d.setHours(0, 0, 0, 0);
    return d.getTime() === tomorrow.getTime();
  }).forEach((e) =>
    add(`event-tomorrow-${e.id}`, "Event Tomorrow",
      `"${e.title}" is coming up tomorrow. Be prepared!`,
      "event", "#6366F1", "calendar-outline"),
  );

  // Budget alerts
  if (monthlyIncome > 0) {
    const ratio = monthlyExpenses / monthlyIncome;
    if (ratio >= 1) {
      add("over-budget", "Over Budget",
        `You've exceeded your monthly income. Review your spending.`,
        "budget", "#E05A6D", "warning");
    } else if (ratio >= 0.8) {
      add("budget-warning", "Budget Alert",
        `You've used ${Math.round(ratio * 100)}% of your monthly income. Spend mindfully.`,
        "budget", "#F59E0B", "trending-up");
    }
  }

  // Welcome (fallback)
  if (list.length === 0) {
    add("welcome-timpla", "Welcome to Timpla!",
      "Track your budget, plan tasks, and stay productive. You're all set!",
      "system", "#6366F1", "sparkles");
  }

  return list;
}

// ─── Schedule device notifications ───────────────────────────────────────────
async function scheduleDeviceNotifications(tasks: any[], events: any[]) {
  if (Platform.OS === "web") return;
  try {
    // Cancel app-managed notifications (prefix: "timpla-")
    const existing = await Notifications.getAllScheduledNotificationsAsync();
    for (const n of existing) {
      if ((n.content.data as any)?.timpla) {
        await Notifications.cancelScheduledNotificationAsync(n.identifier);
      }
    }

    const now = new Date();

    // Schedule notifications for upcoming events (30 min before)
    for (const event of events) {
      const eventDate = new Date(event.date);
      const triggerDate = new Date(eventDate.getTime() - 30 * 60 * 1000);
      if (triggerDate > now) {
        await Notifications.scheduleNotificationAsync({
          identifier: `timpla-event-${event.id}`,
          content: {
            title: "Event Starting Soon",
            body: `"${event.title}" begins in 30 minutes. Get ready!`,
            data: { timpla: true, type: "event", id: event.id },
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: triggerDate,
          },
        });
      }
    }

    // Schedule notifications for task due dates (at 9 AM on due day)
    for (const task of tasks) {
      if (task.completed || !task.deadline) continue;
      const dueDate = new Date(task.deadline);
      dueDate.setHours(9, 0, 0, 0);
      if (dueDate > now) {
        await Notifications.scheduleNotificationAsync({
          identifier: `timpla-task-${task.id}`,
          content: {
            title: "Task Due Today",
            body: `"${task.title}" is due today. Get it done!`,
            data: { timpla: true, type: "task", id: task.id },
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: dueDate,
          },
        });
      }
    }

    // Daily budget reminder at 9 AM
    await Notifications.scheduleNotificationAsync({
      identifier: "timpla-daily-reminder",
      content: {
        title: "Timpla Daily Check-in",
        body: "Review your budget and tasks to stay on track today.",
        data: { timpla: true, type: "system" },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: 9,
        minute: 0,
      },
    });
  } catch (e) {
    // Scheduling errors are non-fatal
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────
const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { tasks, events, monthlyIncome, monthlyExpenses } = useApp();

  const [permStatus, setPermStatus]     = useState<PermStatus>("undetermined");
  const [readIds, setReadIds]           = useState<Set<string>>(new Set());
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const scheduledRef                    = useRef(false);

  // Load saved read IDs from storage
  useEffect(() => {
    AsyncStorage.getItem(READ_KEY).then((raw) => {
      if (raw) {
        try { setReadIds(new Set(JSON.parse(raw))); } catch {}
      }
    });
    // Check current permission status
    if (Platform.OS !== "web") {
      Notifications.getPermissionsAsync().then(({ status }) =>
        setPermStatus(status as PermStatus)
      );
    } else {
      setPermStatus("granted");
    }
  }, []);

  // Re-generate in-app notifications when data or readIds change
  const refreshNotifications = useCallback(() => {
    setNotifications(buildNotifications(tasks, events, monthlyIncome, monthlyExpenses, readIds));
  }, [tasks, events, monthlyIncome, monthlyExpenses, readIds]);

  useEffect(() => { refreshNotifications(); }, [refreshNotifications]);

  // Schedule device notifications once permission is granted and data is loaded
  useEffect(() => {
    if (permStatus === "granted" && !scheduledRef.current) {
      scheduledRef.current = true;
      scheduleDeviceNotifications(tasks, events);
    }
  }, [permStatus, tasks, events]);

  // Re-schedule when tasks/events change
  useEffect(() => {
    if (permStatus === "granted" && scheduledRef.current) {
      scheduleDeviceNotifications(tasks, events);
    }
  }, [tasks, events]);

  const requestPermission = useCallback(async () => {
    if (Platform.OS === "web") { setPermStatus("granted"); return; }
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      setPermStatus(status as PermStatus);
      if (status === "granted") {
        scheduleDeviceNotifications(tasks, events);
      }
    } catch {}
  }, [tasks, events]);

  const saveReadIds = useCallback((ids: Set<string>) => {
    setReadIds(ids);
    AsyncStorage.setItem(READ_KEY, JSON.stringify([...ids]));
  }, []);

  const markAllRead = useCallback(() => {
    const newIds = new Set([...readIds, ...notifications.map((n) => n.id)]);
    saveReadIds(newIds);
  }, [readIds, notifications, saveReadIds]);

  const markRead = useCallback((id: string) => {
    const newIds = new Set([...readIds, id]);
    saveReadIds(newIds);
  }, [readIds, saveReadIds]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationContext.Provider value={{
      notifications, unreadCount, permStatus,
      requestPermission, markAllRead, markRead, refreshNotifications,
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications must be used inside NotificationProvider");
  return ctx;
}

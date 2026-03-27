import React, {
  createContext, useContext, useState, useEffect, useCallback, useRef,
} from "react";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useApp, AcademicEvent, Task } from "./AppContext";

export type NotifType  = "task" | "event" | "budget" | "system";
export type PermStatus = "granted" | "denied" | "undetermined";

export interface NotifNavData {
  screen: string;
  tab?: string;
  id?: string;
}

export interface AppNotification {
  id:        string;
  title:     string;
  body:      string;
  type:      NotifType;
  color:     string;
  icon:      string;
  createdAt: string;
  read:      boolean;
  navData?:  NotifNavData;
}

export interface NotifPreferences {
  enabled:     boolean;
  events:      boolean;
  tasks:       boolean;
  budget:      boolean;
  exam:        boolean;
  quiz:        boolean;
  assignment:  boolean;
}

const DEFAULT_PREFS: NotifPreferences = {
  enabled: true, events: true, tasks: true, budget: true,
  exam: true, quiz: true, assignment: true,
};

interface NotificationContextType {
  notifications:        AppNotification[];
  unreadCount:          number;
  permStatus:           PermStatus;
  preferences:          NotifPreferences;
  requestPermission:    () => Promise<void>;
  markAllRead:          () => void;
  markRead:             (id: string) => void;
  refreshNotifications: () => void;
  updatePreferences:    (updates: Partial<NotifPreferences>) => void;
  navigateToNotification: (notification: AppNotification) => void;
}

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

const READ_KEY  = "@timpla_notif_read_ids";
const PREFS_KEY = "@timpla_notif_prefs";

const EVENT_META: Record<string, { label: string; color: string; icon: string }> = {
  exam:       { label: "Exam",       color: "#E05A6D", icon: "school" },
  quiz:       { label: "Quiz",       color: "#F59E0B", icon: "help-circle" },
  assignment: { label: "Assignment", color: "#6366F1", icon: "document-text" },
  personal:   { label: "Event",      color: "#2DD4BF", icon: "calendar" },
};

function getEventMeta(type: string) {
  return EVENT_META[type] || EVENT_META.personal;
}

function isEventTypeEnabled(type: string, prefs: NotifPreferences): boolean {
  if (type === "exam") return prefs.exam;
  if (type === "quiz") return prefs.quiz;
  if (type === "assignment") return prefs.assignment;
  return true;
}

function formatEventTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" });
}

function buildNotifications(
  tasks: Task[],
  events: AcademicEvent[],
  monthlyIncome: number,
  monthlyExpenses: number,
  readIds: Set<string>,
  prefs: NotifPreferences,
): AppNotification[] {
  const list: AppNotification[] = [];
  const now = new Date(); now.setHours(0, 0, 0, 0);
  const tomorrow = new Date(now); tomorrow.setDate(now.getDate() + 1);
  const dayAfter = new Date(now); dayAfter.setDate(now.getDate() + 2);

  const add = (
    id: string, title: string, body: string,
    type: NotifType, color: string, icon: string,
    navData?: NotifNavData,
  ) => list.push({ id, title, body, type, color, icon, createdAt: new Date().toISOString(), read: readIds.has(id), navData });

  if (prefs.tasks) {
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
        { screen: "planner", tab: "tasks" },
      );
    }

    tasks.filter((t) => {
      if (t.completed || !t.deadline) return false;
      const d = new Date(t.deadline); d.setHours(0, 0, 0, 0);
      return d.getTime() === now.getTime();
    }).forEach((t) =>
      add(`task-today-${t.id}`, "Task Due Today",
        `"${t.title}" is due today. Don't forget to complete it!`,
        "task", "#F59E0B", "time",
        { screen: "planner", tab: "tasks", id: t.id }),
    );

    tasks.filter((t) => {
      if (t.completed || !t.deadline) return false;
      const d = new Date(t.deadline); d.setHours(0, 0, 0, 0);
      return d.getTime() === tomorrow.getTime();
    }).forEach((t) =>
      add(`task-tomorrow-${t.id}`, "Task Due Tomorrow",
        `"${t.title}" is due tomorrow. Plan ahead!`,
        "task", "#F59E0B", "time-outline",
        { screen: "planner", tab: "tasks", id: t.id }),
    );
  }

  if (prefs.events) {
    events.filter((e) => {
      if (!isEventTypeEnabled(e.type, prefs)) return false;
      const d = new Date(e.date); d.setHours(0, 0, 0, 0);
      return d.getTime() === now.getTime();
    }).forEach((e) => {
      const meta = getEventMeta(e.type);
      add(`event-today-${e.id}`, `${meta.label} Today`,
        `"${e.title}" is scheduled for today at ${formatEventTime(e.date)}.`,
        "event", meta.color, meta.icon,
        { screen: "planner", tab: "events", id: e.id });
    });

    events.filter((e) => {
      if (!isEventTypeEnabled(e.type, prefs)) return false;
      const d = new Date(e.date); d.setHours(0, 0, 0, 0);
      return d.getTime() === tomorrow.getTime();
    }).forEach((e) => {
      const meta = getEventMeta(e.type);
      add(`event-tomorrow-${e.id}`, `Upcoming ${meta.label} Tomorrow`,
        `"${e.title}" is coming up tomorrow. Be prepared!`,
        "event", meta.color, meta.icon,
        { screen: "planner", tab: "events", id: e.id });
    });

    events.filter((e) => {
      if (!isEventTypeEnabled(e.type, prefs)) return false;
      const d = new Date(e.date); d.setHours(0, 0, 0, 0);
      return d.getTime() === dayAfter.getTime();
    }).forEach((e) => {
      const meta = getEventMeta(e.type);
      add(`event-soon-${e.id}`, `${meta.label} in 2 Days`,
        `"${e.title}" is in 2 days. Start preparing!`,
        "event", meta.color, meta.icon + "-outline",
        { screen: "planner", tab: "events", id: e.id });
    });
  }

  if (prefs.budget && monthlyIncome > 0) {
    const ratio = monthlyExpenses / monthlyIncome;
    if (ratio >= 1) {
      add("over-budget", "Over Budget",
        `You've exceeded your monthly income. Review your spending.`,
        "budget", "#E05A6D", "warning",
        { screen: "transactions" });
    } else if (ratio >= 0.8) {
      add("budget-warning", "Budget Alert",
        `You've used ${Math.round(ratio * 100)}% of your monthly income. Spend mindfully.`,
        "budget", "#F59E0B", "trending-up",
        { screen: "transactions" });
    }
  }

  if (list.length === 0) {
    add("welcome-budgetbuddy", "Welcome to BudgetBuddy!",
      "Track your budget, plan tasks, and stay productive. You're all set!",
      "system", "#6366F1", "sparkles",
      { screen: "home" });
  }

  return list;
}

async function scheduleDeviceNotifications(
  tasks: Task[],
  events: AcademicEvent[],
  prefs: NotifPreferences,
) {
  if (Platform.OS === "web") return;
  try {
    const existing = await Notifications.getAllScheduledNotificationsAsync();
    for (const n of existing) {
      if ((n.content.data as any)?.timpla) {
        await Notifications.cancelScheduledNotificationAsync(n.identifier);
      }
    }

    if (!prefs.enabled) return;

    const now = new Date();

    if (prefs.events) {
      for (const event of events) {
        const meta = getEventMeta(event.type);
        if (!isEventTypeEnabled(event.type, prefs)) continue;
        const eventDate = new Date(event.date);

        const dayBefore = new Date(eventDate);
        dayBefore.setDate(dayBefore.getDate() - 1);
        dayBefore.setHours(20, 0, 0, 0);
        if (dayBefore > now) {
          await Notifications.scheduleNotificationAsync({
            identifier: `timpla-event-1d-${event.id}`,
            content: {
              title: `Upcoming ${meta.label} Tomorrow: ${event.title}`,
              body: `"${event.title}" is tomorrow at ${formatEventTime(event.date)}. Prepare ahead!`,
              data: { timpla: true, type: "event", id: event.id, eventType: event.type },
            },
            trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: dayBefore },
          });
        }

        const twoHrsBefore = new Date(eventDate.getTime() - 2 * 60 * 60 * 1000);
        if (twoHrsBefore > now) {
          await Notifications.scheduleNotificationAsync({
            identifier: `timpla-event-2h-${event.id}`,
            content: {
              title: `${meta.label} Reminder: ${event.title}`,
              body: `"${event.title}" starts in 2 hours. Get ready!`,
              data: { timpla: true, type: "event", id: event.id, eventType: event.type },
            },
            trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: twoHrsBefore },
          });
        }

        const thirtyMinBefore = new Date(eventDate.getTime() - 30 * 60 * 1000);
        if (thirtyMinBefore > now) {
          await Notifications.scheduleNotificationAsync({
            identifier: `timpla-event-30m-${event.id}`,
            content: {
              title: `${meta.label} Starting Soon: ${event.title}`,
              body: `"${event.title}" begins in 30 minutes!`,
              data: { timpla: true, type: "event", id: event.id, eventType: event.type },
            },
            trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: thirtyMinBefore },
          });
        }
      }
    }

    if (prefs.tasks) {
      for (const task of tasks) {
        if (task.completed || !task.deadline) continue;
        const dueDate = new Date(task.deadline);

        const eveningBefore = new Date(dueDate);
        eveningBefore.setDate(eveningBefore.getDate() - 1);
        eveningBefore.setHours(20, 0, 0, 0);
        if (eveningBefore > now) {
          await Notifications.scheduleNotificationAsync({
            identifier: `timpla-task-1d-${task.id}`,
            content: {
              title: `Task Due Tomorrow: ${task.title}`,
              body: `"${task.title}" is due tomorrow. Plan ahead!`,
              data: { timpla: true, type: "task", id: task.id },
            },
            trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: eveningBefore },
          });
        }

        const morningOf = new Date(dueDate);
        morningOf.setHours(9, 0, 0, 0);
        if (morningOf > now) {
          await Notifications.scheduleNotificationAsync({
            identifier: `timpla-task-day-${task.id}`,
            content: {
              title: `Task Due Today: ${task.title}`,
              body: `"${task.title}" is due today. Get it done!`,
              data: { timpla: true, type: "task", id: task.id },
            },
            trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: morningOf },
          });
        }
      }
    }

    await Notifications.scheduleNotificationAsync({
      identifier: "timpla-daily-reminder",
      content: {
        title: "BudgetBuddy Daily Check-in",
        body: "Review your budget and tasks to stay on track today.",
        data: { timpla: true, type: "system" },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: 9, minute: 0,
      },
    });
  } catch (_e) {}
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

function handleNotifNavigation(data: Record<string, any> | undefined) {
  if (!data) return;
  try {
    const type = data.type as string;
    const id = data.id as string | undefined;

    if (type === "event") {
      const params: Record<string, string> = { tab: "events" };
      if (id) params.highlightId = id;
      router.push({ pathname: "/(tabs)/planner", params });
    } else if (type === "task") {
      const params: Record<string, string> = { tab: "tasks" };
      if (id) params.highlightId = id;
      router.push({ pathname: "/(tabs)/planner", params });
    } else if (type === "budget") {
      router.push("/(tabs)/transactions" as any);
    } else {
      router.push("/(tabs)/" as any);
    }
  } catch {
    router.push("/(tabs)/" as any);
  }
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { tasks, events, monthlyIncome, monthlyExpenses } = useApp();

  const [permStatus, setPermStatus]           = useState<PermStatus>("undetermined");
  const [readIds, setReadIds]                 = useState<Set<string>>(new Set());
  const [notifications, setNotifications]     = useState<AppNotification[]>([]);
  const [preferences, setPreferences]         = useState<NotifPreferences>(DEFAULT_PREFS);
  const initialLoadDone                       = useRef(false);
  const lastScheduleKey                       = useRef("");
  const coldStartHandled                      = useRef(false);
  const lastHandledResponseId                 = useRef<string | null>(null);

  useEffect(() => {
    (async () => {
      const [readRaw, prefsRaw] = await Promise.all([
        AsyncStorage.getItem(READ_KEY),
        AsyncStorage.getItem(PREFS_KEY),
      ]);
      if (readRaw) {
        try { setReadIds(new Set(JSON.parse(readRaw))); } catch {}
      }
      if (prefsRaw) {
        try { setPreferences({ ...DEFAULT_PREFS, ...JSON.parse(prefsRaw) }); } catch {}
      }
      if (Platform.OS !== "web") {
        const { status } = await Notifications.getPermissionsAsync();
        setPermStatus(status as PermStatus);
      } else {
        setPermStatus("granted");
      }
      initialLoadDone.current = true;
    })();
  }, []);

  useEffect(() => {
    if (Platform.OS === "web") return;

    const responseListener = Notifications.addNotificationResponseReceivedListener((response) => {
      const responseId = response.notification.request.identifier;
      if (responseId === lastHandledResponseId.current) return;
      lastHandledResponseId.current = responseId;
      const data = response.notification.request.content.data as Record<string, any> | undefined;
      if (data?.timpla) {
        setTimeout(() => handleNotifNavigation(data), 300);
      }
    });

    if (!coldStartHandled.current) {
      coldStartHandled.current = true;
      Notifications.getLastNotificationResponseAsync().then((response) => {
        if (response) {
          const responseId = response.notification.request.identifier;
          if (responseId === lastHandledResponseId.current) return;
          lastHandledResponseId.current = responseId;
          const data = response.notification.request.content.data as Record<string, any> | undefined;
          if (data?.timpla) {
            setTimeout(() => handleNotifNavigation(data), 600);
          }
        }
      });
    }

    return () => responseListener.remove();
  }, []);

  const refreshNotifications = useCallback(() => {
    setNotifications(buildNotifications(tasks, events, monthlyIncome, monthlyExpenses, readIds, preferences));
  }, [tasks, events, monthlyIncome, monthlyExpenses, readIds, preferences]);

  useEffect(() => { refreshNotifications(); }, [refreshNotifications]);

  useEffect(() => {
    if (!initialLoadDone.current || permStatus !== "granted") return;
    const key = JSON.stringify({ tIds: tasks.map(t => t.id + t.title + t.completed + t.deadline), eIds: events.map(e => e.id + e.title + e.type + e.date), prefs: preferences });
    if (key === lastScheduleKey.current) return;
    lastScheduleKey.current = key;
    scheduleDeviceNotifications(tasks, events, preferences);
  }, [permStatus, tasks, events, preferences]);

  const requestPermission = useCallback(async () => {
    if (Platform.OS === "web") { setPermStatus("granted"); return; }
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      setPermStatus(status as PermStatus);
      if (status === "granted") {
        scheduleDeviceNotifications(tasks, events, preferences);
      }
    } catch {}
  }, [tasks, events, preferences]);

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

  const updatePreferences = useCallback((updates: Partial<NotifPreferences>) => {
    setPreferences((prev) => {
      const next = { ...prev, ...updates };
      AsyncStorage.setItem(PREFS_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const navigateToNotification = useCallback((notification: AppNotification) => {
    markRead(notification.id);
    const nav = notification.navData;
    if (!nav) {
      router.push("/(tabs)/" as any);
      return;
    }
    const { screen, tab, id } = nav;
    if (screen === "planner") {
      const params: Record<string, string> = {};
      if (tab) params.tab = tab;
      if (id) params.highlightId = id;
      router.push({ pathname: "/(tabs)/planner", params });
    } else if (screen === "transactions") {
      router.push("/(tabs)/transactions" as any);
    } else {
      router.push("/(tabs)/" as any);
    }
  }, [markRead]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationContext.Provider value={{
      notifications, unreadCount, permStatus, preferences,
      requestPermission, markAllRead, markRead, refreshNotifications, updatePreferences,
      navigateToNotification,
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

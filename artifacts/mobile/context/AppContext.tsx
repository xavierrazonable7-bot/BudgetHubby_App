import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  ReactNode,
  useCallback,
} from "react";
import { saveData, loadData, STORAGE_KEYS } from "@/utils/storage";
import { generateId } from "@/utils/format";

export type WalletType = "cash" | "gcash" | "maya" | "bank" | "custom";
export interface Wallet {
  id: string;
  name: string;
  type: WalletType;
  balance: number;
  color: string;
  icon: string;
}

export type TransactionType = "income" | "expense";
export type IncomeCategory =
  | "allowance"
  | "salary"
  | "freelance"
  | "gift"
  | "investment"
  | "other_income";
export type ExpenseCategory =
  | "food"
  | "transport"
  | "school"
  | "shopping"
  | "entertainment"
  | "health"
  | "utilities"
  | "rent"
  | "savings"
  | "other";
export type RecurringType = "weekly" | "monthly" | "one_time";

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: string;
  walletId: string;
  date: string;
  note: string;
  recurringType?: RecurringType;
}

export type DebtType = "lent" | "borrowed";
export interface Debt {
  id: string;
  type: DebtType;
  personName: string;
  amount: number;
  paidAmount: number;
  note: string;
  date: string;
  status: "pending" | "paid";
}

interface AppContextValue {
  userName: string;
  setUserName: (name: string) => void;
  isOnboarded: boolean;
  completeOnboarding: (name: string) => void;
  wallets: Wallet[];
  addWallet: (wallet: Omit<Wallet, "id">) => void;
  updateWallet: (id: string, updates: Partial<Wallet>) => void;
  deleteWallet: (id: string) => void;
  transactions: Transaction[];
  addTransaction: (tx: Omit<Transaction, "id">) => void;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  debts: Debt[];
  addDebt: (debt: Omit<Debt, "id">) => void;
  updateDebt: (id: string, updates: Partial<Debt>) => void;
  deleteDebt: (id: string) => void;
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  todayExpenses: number;
}

const AppContext = createContext<AppContextValue | null>(null);

const DEFAULT_WALLETS: Wallet[] = [
  { id: "wallet_cash", name: "Cash", type: "cash", balance: 0, color: "#10B981", icon: "cash" },
  { id: "wallet_gcash", name: "GCash", type: "gcash", balance: 0, color: "#2563EB", icon: "phone-portrait" },
  { id: "wallet_maya", name: "Maya", type: "maya", balance: 0, color: "#7C3AED", icon: "card" },
  { id: "wallet_bank", name: "Bank", type: "bank", balance: 0, color: "#F59E0B", icon: "business" },
];

export function AppProvider({ children }: { children: ReactNode }) {
  const [userName, setUserNameState] = useState("");
  const [isOnboarded, setIsOnboarded] = useState(false);
  const [wallets, setWallets] = useState<Wallet[]>(DEFAULT_WALLETS);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const loadAll = async () => {
      const [name, onboarded, savedWallets, savedTx, savedDebts] = await Promise.all([
        loadData<string>(STORAGE_KEYS.USER_NAME, ""),
        loadData<boolean>(STORAGE_KEYS.ONBOARDED, false),
        loadData<Wallet[]>(STORAGE_KEYS.WALLETS, DEFAULT_WALLETS),
        loadData<Transaction[]>(STORAGE_KEYS.TRANSACTIONS, []),
        loadData<Debt[]>(STORAGE_KEYS.DEBTS, []),
      ]);
      setUserNameState(name);
      setIsOnboarded(onboarded);
      setWallets(savedWallets.length > 0 ? savedWallets : DEFAULT_WALLETS);
      setTransactions(savedTx);
      setDebts(savedDebts);
      setLoaded(true);
    };
    loadAll();
  }, []);

  const setUserName = useCallback((name: string) => {
    setUserNameState(name);
    saveData(STORAGE_KEYS.USER_NAME, name);
  }, []);

  const completeOnboarding = useCallback((name: string) => {
    setUserNameState(name);
    setIsOnboarded(true);
    saveData(STORAGE_KEYS.USER_NAME, name);
    saveData(STORAGE_KEYS.ONBOARDED, true);
  }, []);

  const addWallet = useCallback((wallet: Omit<Wallet, "id">) => {
    setWallets((prev) => {
      const next = [...prev, { ...wallet, id: generateId() }];
      saveData(STORAGE_KEYS.WALLETS, next);
      return next;
    });
  }, []);

  const updateWallet = useCallback((id: string, updates: Partial<Wallet>) => {
    setWallets((prev) => {
      const next = prev.map((w) => (w.id === id ? { ...w, ...updates } : w));
      saveData(STORAGE_KEYS.WALLETS, next);
      return next;
    });
  }, []);

  const deleteWallet = useCallback((id: string) => {
    setWallets((prev) => {
      const next = prev.filter((w) => w.id !== id);
      saveData(STORAGE_KEYS.WALLETS, next);
      return next;
    });
  }, []);

  const addTransaction = useCallback((tx: Omit<Transaction, "id">) => {
    const newTx: Transaction = { ...tx, id: generateId() };
    setTransactions((prev) => {
      const next = [newTx, ...prev];
      saveData(STORAGE_KEYS.TRANSACTIONS, next);
      return next;
    });
    setWallets((prev) => {
      const next = prev.map((w) => {
        if (w.id === tx.walletId) {
          const delta = tx.type === "income" ? tx.amount : -tx.amount;
          return { ...w, balance: w.balance + delta };
        }
        return w;
      });
      saveData(STORAGE_KEYS.WALLETS, next);
      return next;
    });
  }, []);

  const updateTransaction = useCallback((id: string, updates: Partial<Transaction>) => {
    setTransactions((prev) => {
      const next = prev.map((t) => (t.id === id ? { ...t, ...updates } : t));
      saveData(STORAGE_KEYS.TRANSACTIONS, next);
      return next;
    });
  }, []);

  const deleteTransaction = useCallback((id: string) => {
    setTransactions((prev) => {
      const tx = prev.find((t) => t.id === id);
      if (!tx) return prev;
      setWallets((ws) => {
        const next = ws.map((w) => {
          if (w.id === tx.walletId) {
            const delta = tx.type === "income" ? -tx.amount : tx.amount;
            return { ...w, balance: w.balance + delta };
          }
          return w;
        });
        saveData(STORAGE_KEYS.WALLETS, next);
        return next;
      });
      const next = prev.filter((t) => t.id !== id);
      saveData(STORAGE_KEYS.TRANSACTIONS, next);
      return next;
    });
  }, []);

  const addDebt = useCallback((debt: Omit<Debt, "id">) => {
    setDebts((prev) => {
      const next = [{ ...debt, id: generateId() }, ...prev];
      saveData(STORAGE_KEYS.DEBTS, next);
      return next;
    });
  }, []);

  const updateDebt = useCallback((id: string, updates: Partial<Debt>) => {
    setDebts((prev) => {
      const next = prev.map((d) => (d.id === id ? { ...d, ...updates } : d));
      saveData(STORAGE_KEYS.DEBTS, next);
      return next;
    });
  }, []);

  const deleteDebt = useCallback((id: string) => {
    setDebts((prev) => {
      const next = prev.filter((d) => d.id !== id);
      saveData(STORAGE_KEYS.DEBTS, next);
      return next;
    });
  }, []);

  const { totalBalance, monthlyIncome, monthlyExpenses, todayExpenses } = useMemo(() => {
    const totalBalance = wallets.reduce((sum, w) => sum + w.balance, 0);
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let monthlyIncome = 0;
    let monthlyExpenses = 0;
    let todayExpenses = 0;

    transactions.forEach((t) => {
      const date = new Date(t.date);
      if (date >= monthStart) {
        if (t.type === "income") monthlyIncome += t.amount;
        else monthlyExpenses += t.amount;
      }
      if (date >= today && t.type === "expense") {
        todayExpenses += t.amount;
      }
    });

    return { totalBalance, monthlyIncome, monthlyExpenses, todayExpenses };
  }, [wallets, transactions]);

  const value = useMemo(
    () => ({
      userName,
      setUserName,
      isOnboarded,
      completeOnboarding,
      wallets,
      addWallet,
      updateWallet,
      deleteWallet,
      transactions,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      debts,
      addDebt,
      updateDebt,
      deleteDebt,
      totalBalance,
      monthlyIncome,
      monthlyExpenses,
      todayExpenses,
    }),
    [
      userName,
      isOnboarded,
      wallets,
      transactions,
      debts,
      totalBalance,
      monthlyIncome,
      monthlyExpenses,
      todayExpenses,
    ]
  );

  if (!loaded) return null;

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}

// ============================================
// FamyPay TypeScript Models
// ============================================

// --- User ---
export interface FamyUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  createdAt: Date;
  lastLoginAt: Date;
  familySpaceIds: string[];
}

// --- Family Space ---
export interface FamilySpace {
  id: string;
  name: string;
  description: string;
  inviteCode: string;
  createdBy: string;
  createdAt: Date;
  settings: FamilySpaceSettings;
}

export interface FamilySpaceSettings {
  currency: string;
  timezone: string;
}

// --- Family Member ---
export type MemberRole = 'superAdmin' | 'admin' | 'member';

export interface FamilyMember {
  userId: string;
  role: MemberRole;
  joinedAt: Date;
  displayName: string;
  photoURL: string | null;
}

// --- Category ---
export type CategoryType = 'income' | 'fixedExpense' | 'variableExpense';

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: CategoryType;
  order: number;
  isDefault: boolean;
}

// --- Transaction ---
export type TransactionType = 'income' | 'fixedExpense' | 'variableExpense' | 'transfer';
export type TransactionStatus = 'confirmed' | 'pending';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  categoryId: string;
  categoryName: string;
  description: string;
  userId: string;
  userName: string;
  date: Date;
  createdAt: Date;
  receiptOcrText: string | null;
  isRecurring: boolean;
  status: TransactionStatus;
}

// --- Budget ---
export interface Budget {
  id: string;
  categoryId: string;
  categoryName: string;
  limit: number;
  month: string; // 'YYYY-MM'
  spent: number;
  updatedAt: Date;
}

export type BudgetAlertLevel = 'normal' | 'warning' | 'critical' | 'exceeded';

export interface BudgetWithAlert extends Budget {
  percentage: number;
  alertLevel: BudgetAlertLevel;
}

// --- Savings Goal ---
export interface SavingsGoal {
  id: string;
  name: string;
  icon: string;
  targetAmount: number;
  currentAmount: number;
  deadline: Date;
  createdBy: string;
  createdAt: Date;
}

// --- Achievement ---
export interface Achievement {
  code: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt: Date | null;
  unlockedBy: string | null;
}

// --- Invite ---
export interface Invite {
  inviteCode: string;
  spaceId: string;
  spaceName: string;
  createdBy: string;
  createdAt: Date;
}

// --- Dashboard ---
export interface DashboardSummary {
  totalIncome: number;
  totalFixedExpenses: number;
  totalVariableExpenses: number;
  balance: number;
  moneyAge: number;
  moneyAgeLevel: 'critical' | 'alert' | 'healthy' | 'excellent';
  budgetConsumedPercentage: number;
  savingsProgress: number;
}

// --- OCR ---
export interface OcrResult {
  rawText: string;
  extractedDate: string | null;
  extractedAmount: number | null;
  extractedMerchant: string | null;
  confidence: number;
}

// --- Filter ---
export interface TransactionFilter {
  dateFrom?: Date;
  dateTo?: Date;
  categoryId?: string;
  userId?: string;
  type?: TransactionType;
  status?: TransactionStatus;
  searchTerm?: string;
}

// --- Firestore Converters Helper ---
export interface FirestoreTimestamp {
  seconds: number;
  nanoseconds: number;
}

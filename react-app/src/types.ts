// ── Core data types ──

export type TaskStatus = 'pending' | 'progress' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Task {
  id: string;
  name: string;
  status: TaskStatus;
  priority: TaskPriority;
  start: string;
  end: string;
  cls: string;
  tip?: string;
  _originCat?: string;
  _originCatIdx?: number;
}

export interface Category {
  name: string;
  tags: string[];
  tasks: Task[];
  section?: string; // legacy field, migrated to tags
}

export interface RoutineBlock {
  key: string;
  emoji: string;
  label: string;
  labelEn?: string;
  hours: string;
  desc: string;
}

export interface Routine {
  blocks: RoutineBlock[];
  saturday: string;
  sunday: string;
  rules: string;
  exercise: string;
}

// Weekly plan slot entry: either a task id string or an object with id + note
export type WeeklySlotEntry = string | { id: string; note?: string };

export interface DayPlan {
  tasks: Record<string, WeeklySlotEntry[]>;
  note?: string;
}

export type WeeklyPlan = Record<string, DayPlan>;

export interface AllData {
  updated: string;
  categories: Category[];
  routine?: Routine;
  weeklyPlans?: Record<string, WeeklyPlan>;
}

// ── i18n ──

export interface Translations {
  [key: string]: string | string[];
}

// ── Context value types ──

export interface DataContextValue {
  allData: AllData | null;
  setAllData: React.Dispatch<React.SetStateAction<AllData | null>>;
  persistData: (newData: AllData) => void;
  updateData: (updater: AllData | ((prev: AllData) => AllData)) => void;
  currentFilter: Set<string>;
  setCurrentFilter: React.Dispatch<React.SetStateAction<Set<string>>>;
  toggleFilter: (tag: string) => void;
  findTask: (taskId: string) => Task | null;
  isActionItems: (catIdx: number) => boolean;
  getAllTags: () => string[];
  saveStatus: string | null;
  setSaveStatus: React.Dispatch<React.SetStateAction<string | null>>;
  resetData: () => void;
  isPrivate: boolean;
  showPinModal: boolean;
  setShowPinModal: React.Dispatch<React.SetStateAction<boolean>>;
  pinError: string | null;
  setPinError: React.Dispatch<React.SetStateAction<string | null>>;
  unlockWithPin: (pin: string) => Promise<boolean>;
  lock: () => void;
  exportEncrypted: (pin: string) => Promise<void>;
}

export interface I18nContextValue {
  lang: string;
  toggleLang: () => void;
  t: (key: string) => string | string[];
}

export interface ThemeContextValue {
  theme: string;
  isDark: boolean;
  toggleTheme: () => void;
}

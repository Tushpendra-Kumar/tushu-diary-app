import { 
  CheckSquare, Briefcase, Wallet, PieChart, ShoppingCart, Car, 
  ReceiptText, PiggyBank, Target, Heart, BookOpen, Pill, 
  PartyPopper, Gift, Bell, Edit3, FileText, Link, Music, Lock, Film
} from 'lucide-react-native';

export const APP_MODULES = [
  { icon: CheckSquare, label: 'Daily Planner', sub: 'Tasks & Schedule', route: 'TaskManager', color: '#F43F5E' },
  { icon: Briefcase, label: 'Work Tasks', sub: 'Manage Work', route: 'WorkTasks', color: '#06B6D4' },
  { icon: Wallet, label: 'Expense Tracker', sub: 'Daily Spending', route: 'ExpenseTracker', color: '#3B82F6' },
  { icon: PieChart, label: 'Monthly Budget', sub: 'Track Expenses', route: 'MonthlyBudget', color: '#10B981' },
  { icon: ShoppingCart, label: 'Shopping List', sub: 'Grocery & More', route: 'ShoppingList', color: '#8B5CF6' },
  { icon: Car, label: 'Vehicle Manager', sub: 'Service & Papers', route: 'VehicleManager', color: '#F97316' },
  { icon: ReceiptText, label: 'Bills & Payments', sub: 'Monthly Bills', route: 'BillsPayments', color: '#6366F1' },
  { icon: PiggyBank, label: 'EMI Reminder', sub: 'Loan & EMI', route: 'EMIReminder', color: '#EF4444' },
  { icon: Target, label: 'Goals & Savings', sub: 'Savings Targets', route: 'GoalsSavings', color: '#10B981' },
  { icon: Heart, label: 'Self-Care Goals', sub: 'Personal Growth', route: 'SelfCareGoals', color: '#EC4899' },
  { icon: BookOpen, label: 'Recipes', sub: 'Favourite Dishes', route: 'Recipes', color: '#F97316' },
  { icon: Pill, label: 'Medicine Reminder', sub: 'Medicines & Appt.', route: 'MedicineReminder', color: '#EF4444' },
  { icon: PartyPopper, label: 'Family Events', sub: 'Dates & Gatherings', route: 'FamilyEvents', color: '#EC4899' },
  { icon: Gift, label: 'Birthdays', sub: 'Family Dates', route: 'BirthdayReminder', color: '#F59E0B' },
  { icon: Bell, label: 'Notice Board', sub: 'Family Updates', route: 'FamilyNoticeBoard', color: '#3B82F6' },
  { icon: Edit3, label: 'Quick Notes', sub: 'Jot it down', route: 'QuickNotes', color: '#FBBF24' },
  { icon: FileText, label: 'My Media', sub: 'Photos, Videos & Docs', route: 'MediaVault', color: '#8B5CF6' },
  { icon: Link, label: 'Website Links', sub: 'Useful sites', route: 'WebsiteLinks', color: '#06B6D4' },
  { icon: Music, label: 'My Music', sub: 'Songs & Playlists', route: 'MyMusic', color: '#F59E0B' },
  { icon: Film, label: 'Movies & Series', sub: 'Watchlist & Tracker', route: 'MoviesSeries', color: '#EF4444' },
  { icon: Lock, label: 'Password Vault', sub: 'Secure credentials', route: 'PasswordVault', color: '#64748B' }
];


import { Category } from '../models';

export const DEFAULT_CATEGORIES: Omit<Category, 'id'>[] = [
  // Ingresos
  { name: 'Salario', icon: 'pi pi-wallet', color: '#22C55E', type: 'income', order: 1, isDefault: true },
  { name: 'Freelance', icon: 'pi pi-briefcase', color: '#16A34A', type: 'income', order: 2, isDefault: true },
  { name: 'Inversiones', icon: 'pi pi-chart-line', color: '#15803D', type: 'income', order: 3, isDefault: true },
  { name: 'Otros Ingresos', icon: 'pi pi-plus-circle', color: '#4ADE80', type: 'income', order: 4, isDefault: true },

  // Gastos Fijos
  { name: 'Arriendo', icon: 'pi pi-home', color: '#EF4444', type: 'fixedExpense', order: 1, isDefault: true },
  { name: 'Servicios', icon: 'pi pi-bolt', color: '#F97316', type: 'fixedExpense', order: 2, isDefault: true },
  { name: 'Internet', icon: 'pi pi-wifi', color: '#8B5CF6', type: 'fixedExpense', order: 3, isDefault: true },
  { name: 'Seguros', icon: 'pi pi-shield', color: '#06B6D4', type: 'fixedExpense', order: 4, isDefault: true },
  { name: 'Educación', icon: 'pi pi-graduation-cap', color: '#3B82F6', type: 'fixedExpense', order: 5, isDefault: true },

  // Gastos Variables
  { name: 'Alimentación', icon: 'pi pi-shopping-cart', color: '#F59E0B', type: 'variableExpense', order: 1, isDefault: true },
  { name: 'Transporte', icon: 'pi pi-car', color: '#6366F1', type: 'variableExpense', order: 2, isDefault: true },
  { name: 'Salud', icon: 'pi pi-heart', color: '#EC4899', type: 'variableExpense', order: 3, isDefault: true },
  { name: 'Entretenimiento', icon: 'pi pi-ticket', color: '#A855F7', type: 'variableExpense', order: 4, isDefault: true },
  { name: 'Restaurantes', icon: 'pi pi-shop', color: '#F43F5E', type: 'variableExpense', order: 5, isDefault: true },
  { name: 'Ropa', icon: 'pi pi-tag', color: '#14B8A6', type: 'variableExpense', order: 6, isDefault: true },
  { name: 'Mascotas', icon: 'pi pi-heart-fill', color: '#D946EF', type: 'variableExpense', order: 7, isDefault: true },
  { name: 'Otros Gastos', icon: 'pi pi-ellipsis-h', color: '#64748B', type: 'variableExpense', order: 8, isDefault: true },
];

export const ACHIEVEMENT_DEFINITIONS: { code: string; name: string; description: string; icon: string }[] = [
  { code: 'first_expense', name: 'Primer Paso', description: 'Registraste tu primer gasto', icon: '🌱' },
  { code: 'first_budget', name: 'Planificador', description: 'Creaste tu primer presupuesto', icon: '📊' },
  { code: 'budget_under_70', name: 'Bajo Control', description: 'Un mes sin superar el 70% en ninguna categoría', icon: '🎯' },
  { code: 'savings_goal_reached', name: 'Ahorro Maestro', description: 'Completaste tu primera meta de ahorro', icon: '💪' },
  { code: 'family_5_members', name: 'Familia Unida', description: '5 miembros en tu espacio familiar', icon: '👨‍👩‍👧‍👦' },
  { code: 'first_ocr', name: 'Detective', description: 'Escaneaste tu primer recibo', icon: '📸' },
  { code: 'streak_7', name: 'Racha Semanal', description: 'Registraste gastos 7 días consecutivos', icon: '🔥' },
  { code: 'streak_30', name: 'Veterano', description: 'Registraste gastos 30 días consecutivos', icon: '💎' },
];

export const BUDGET_ALERT_THRESHOLDS = {
  warning: 70,
  critical: 80,
  exceeded: 100,
};

export const CURRENCY_CONFIG = {
  default: 'COP',
  locale: 'es-CO',
  symbol: '$',
  decimals: 0,
};

export const PAGINATION = {
  defaultPageSize: 20,
  maxPageSize: 50,
};

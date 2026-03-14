// Типы данных для банковского приложения.
// Отражают структуру ответов от Go-бэкенда.

export interface Product {
  id: number;
  name: string;
  type: string; // credit | deposit | card | insurance | mortgage
  description: string;
  interest_rate: number;
  min_amount: number;
}

export interface ShowcaseBlock {
  scenario_id: number;
  scenario_name: string;
  description: string;
  icon: string;
  products: Product[];
}

export interface ShowcaseResponse {
  user_id: number;
  user_name: string;
  segment: string;
  blocks: ShowcaseBlock[];
  is_default: boolean;
}

export interface LoginResponse {
  token: string;
  user_id: number;
  name: string;
  segment: string;
}

export interface AnalyticsEvent {
  event_type: 'view' | 'click' | 'apply' | 'purchase';
  product_id?: number;
}

export interface AuthState {
  token: string | null;
  userId: number | null;
  userName: string | null;
  segment: string | null;
}

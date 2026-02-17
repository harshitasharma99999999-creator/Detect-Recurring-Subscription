export interface Card {
  id: string;
  user_id: string;
  last_four: string;
  cardholder_name: string;
  nickname: string | null;
  created_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  card_id: string | null;
  merchant_name: string;
  normalized_merchant: string;
  amount: number;
  frequency: 'weekly' | 'monthly' | 'yearly';
  interval_days: number;
  last_charge_date: string;
  next_expected_charge: string;
  monthly_equivalent: number;
  transaction_ids: string[];
  is_false_positive: boolean;
  created_at: string;
  updated_at: string;
}

export interface AnalyzeResult {
  transactionsProcessed: number;
  parseErrors: string[];
  detected: number;
  subscriptions: Array<{
    merchantName: string;
    amount: number;
    frequency: string;
    nextExpectedCharge: string;
    monthlyEquivalent: number;
  }>;
}

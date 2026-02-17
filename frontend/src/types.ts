export interface Subscription {
  id: string;
  user_id: string;
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

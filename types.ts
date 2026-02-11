
export interface ReceiptItem {
  originalName: string;
  translatedName: string;
  quantity: number;
  price: number;
  total: number;
}

export interface ReceiptData {
  merchantName: string;
  date: string;
  currency: string;
  totalAmount: number;
  items: ReceiptItem[];
  originalLanguage: string;
}

export enum AppStatus {
  IDLE = 'IDLE',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}

export interface ProcessedReceipt {
  id: string;
  status: AppStatus;
  data: ReceiptData | null;
  error: string | null;
  previewUrl: string;
  selectedCategory: string;
  selectedFromAccount: string;
  selectedPaidBy: string;
  isConfirmed: boolean;
}

export const RECEIPT_CATEGORIES = [
  "Furniture",
  "Meal",
  "Traffic",
  "Grocery",
  "Electricity",
  "Telecom",
  "Clothing",
  "Personal Care",
  "Cigarette",
  "Water Fee",
  "Air Ticket",
  "Entertainment",
  "Mobile"
].sort((a, b) => a.localeCompare(b));

export const FROM_ACCOUNT_OPTIONS = [
  "BKK Bank",
  "Cash",
  "Helen B Citi Card",
  "HSBC HK",
  "HSBC World Debit Card",
  "K Bank",
  "Line Pay Wallet",
  "Mox Bank",
  "Rabbit",
  "Wise Virtual Card",
  "ZA Bank"
].sort((a, b) => a.localeCompare(b));

export const PAID_BY_OPTIONS = [
  "Helen",
  "Tony"
];

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  inStock: boolean;
}

export interface DataPlan {
  id: string;
  network: 'MTN' | 'AIRTEL' | 'GLO';
  data: string;
  validity: string;
  price: number;
  planId: number; // Amigo Plan ID
}

export interface Transaction {
  id: string;
  tx_ref: string;
  type: 'ecommerce' | 'data';
  status: 'pending' | 'paid' | 'delivered' | 'failed';
  phone: string;
  amount: number;
  planId?: string; // Relation ID to DataPlan
  productId?: string; // Relation ID to Product
  customerName?: string; // For ecommerce orders
  deliveryState?: string; // For ecommerce orders
  createdAt: string;
  deliveryData?: any;
  product?: Product;
  dataPlan?: DataPlan;
}

export interface PaymentInitResponse {
  tx_ref: string;
  bank: string;
  account_number: string;
  account_name: string;
  amount: number;
}

export type NetworkType = 'MTN' | 'AIRTEL' | 'GLO';
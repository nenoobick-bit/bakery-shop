export type Role = "client" | "manager";

export interface AppUser {
  uid: string;
  email: string;
  role: Role;
}

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

export type OrderStatus = "new" | "accepted" | "preparing" | "ready" | "rejected";

export interface Order {
  id: string;
  userId: string;
  userEmail: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  customerName?: string;
  phone?: string;
  comment?: string;
  createdAt?: { toDate: () => Date } | null;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  imageUrl: string;
}

export const STATUS_LABELS: Record<OrderStatus, string> = {
  new: "Новый",
  accepted: "Принят",
  preparing: "Готовится",
  ready: "Готов",
  rejected: "Отклонён",
};

export const STATUS_STYLES: Record<OrderStatus, string> = {
  new: "bg-amber-100 text-amber-800",
  accepted: "bg-blue-100 text-blue-800",
  preparing: "bg-orange-100 text-orange-800",
  ready: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
};

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { CartItem, Product } from "./types";
import { useAuth } from "./auth";

interface CartContextValue {
  items: CartItem[];
  add: (product: Product) => void;
  setQuantity: (productId: string, quantity: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
  total: number;
  count: number;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const uid = user?.uid ?? null;
  const [items, setItems] = useState<CartItem[]>([]);

  // Загружаем корзину конкретного пользователя при входе / очищаем при выходе
  useEffect(() => {
    if (!uid) {
      setItems([]); // анонимное состояние — корзина не хранится и не переносится
      return;
    }
    try {
      const raw = localStorage.getItem(`cart_${uid}`);
      setItems(raw ? (JSON.parse(raw) as CartItem[]) : []);
    } catch {
      setItems([]);
    }
  }, [uid]);

  // Сохраняем корзину только под ключом с uid
  useEffect(() => {
    if (!uid) return;
    try {
      localStorage.setItem(`cart_${uid}`, JSON.stringify(items));
    } catch {
      /* ignore */
    }
  }, [items, uid]);

  const add = (product: Product) => {
    setItems((prev) => {
      const found = prev.find((i) => i.productId === product.id);
      if (found) {
        return prev.map((i) =>
          i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          price: product.price,
          quantity: 1,
          imageUrl: product.imageUrl,
        },
      ];
    });
  };

  const setQuantity = (productId: string, quantity: number) => {
    setItems((prev) =>
      quantity <= 0
        ? prev.filter((i) => i.productId !== productId)
        : prev.map((i) => (i.productId === productId ? { ...i, quantity } : i))
    );
  };

  const remove = (productId: string) =>
    setItems((prev) => prev.filter((i) => i.productId !== productId));

  const clear = () => setItems([]);

  const total = useMemo(
    () => items.reduce((s, i) => s + i.price * i.quantity, 0),
    [items]
  );
  const count = useMemo(() => items.reduce((s, i) => s + i.quantity, 0), [items]);

  return (
    <CartContext.Provider
      value={{ items, add, setQuantity, remove, clear, total, count }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}

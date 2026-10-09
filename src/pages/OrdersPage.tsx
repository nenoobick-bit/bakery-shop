import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../lib/auth";
import type { Order, OrderStatus } from "../lib/types";
import { STATUS_LABELS, STATUS_STYLES } from "../lib/types";
import { formatDate, formatPrice } from "../lib/cn";
import { Link } from "react-router-dom";
import UserMenu from "../components/UserMenu";

const FLOW: OrderStatus[] = ["new", "accepted", "preparing", "ready", "rejected"];

export default function OrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "orders"), where("userId", "==", user.uid));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map(
          (d) => ({ id: d.id, ...(d.data() as Omit<Order, "id">) }) as Order
        );
        list.sort((a, b) => (b.createdAt?.toDate()?.getTime() ?? 0) - (a.createdAt?.toDate()?.getTime() ?? 0));
        setOrders(list);
        setLoading(false);
      },
      () => {
        setError("Не удалось загрузить заказы.");
        setLoading(false);
      }
    );
    return unsub;
  }, [user]);

  return (
    <div className="min-h-screen bg-[#fdf6ec]">
      <header className="bg-white/90 backdrop-blur border-b border-amber-100 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-amber-900">Мои заказы</h1>
          <div className="flex items-center gap-3">
            <Link
              to="/shop"
              className="text-sm text-amber-800 hover:text-amber-600 font-medium transition-colors"
            >
              ← В каталог
            </Link>
            <UserMenu />
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-4">
        {loading && (
          <>
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl h-28 animate-pulse border border-amber-100" />
            ))}
          </>
        )}
        {error && <p className="text-red-600 bg-red-50 rounded-xl px-4 py-3">{error}</p>}
        {!loading && !error && orders.length === 0 && (
          <div className="text-center py-16 text-stone-500">
            <div className="text-5xl mb-3">📦</div>
            <p>У вас пока нет заказов</p>
            <Link to="/shop" className="text-amber-600 hover:underline text-sm">
              Перейти в каталог
            </Link>
          </div>
        )}

        {orders.map((order) => (
          <div
            key={order.id}
            className="bg-white rounded-2xl border border-amber-100 p-5 shadow-sm"
          >
            <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  STATUS_STYLES[order.status]
                }`}
              >
                {STATUS_LABELS[order.status]}
              </span>
              <span className="text-xs text-stone-400">
                {formatDate(order.createdAt?.toDate() ?? null)}
              </span>
            </div>
            <ul className="text-sm text-stone-600 space-y-1">
              {order.items.map((item) => (
                <li key={item.productId} className="flex justify-between">
                  <span>
                    {item.name} × {item.quantity}
                  </span>
                  <span>{formatPrice(item.price * item.quantity)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-3 pt-3 border-t border-amber-100 flex justify-between font-bold text-stone-800">
              <span>Итого</span>
              <span className="text-amber-700">{formatPrice(order.total)}</span>
            </div>
          </div>
        ))}
      </main>
    </div>
  );
}

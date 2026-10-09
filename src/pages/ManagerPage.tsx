import { useEffect, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import UserMenu from "../components/UserMenu";
import type { FormEvent } from "react";
import type { Order, OrderStatus, Product } from "../lib/types";
import { STATUS_LABELS, STATUS_STYLES } from "../lib/types";
import { formatDate, formatPrice } from "../lib/cn";

const ALL_STATUSES: Array<OrderStatus | "all"> = [
  "all",
  "new",
  "accepted",
  "preparing",
  "ready",
  "rejected",
];

type Tab = "orders" | "products";

export default function ManagerPage() {
  const [tab, setTab] = useState<Tab>("orders");

  return (
    <div className="min-h-screen bg-[#fdf6ec]">
      <header className="bg-white/90 backdrop-blur border-b border-amber-100 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between flex-wrap gap-3">
          <h1 className="text-xl font-bold text-amber-900">🥐 Панель менеджера</h1>
          <div className="flex items-center gap-3">
            <div className="flex bg-amber-50 rounded-full p-1">
              <button
                onClick={() => setTab("orders")}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  tab === "orders" ? "bg-amber-500 text-white shadow" : "text-amber-800"
                }`}
              >
                Заказы
              </button>
              <button
                onClick={() => setTab("products")}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  tab === "products" ? "bg-amber-500 text-white shadow" : "text-amber-800"
                }`}
              >
                Товары
              </button>
            </div>
            <UserMenu />
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {tab === "orders" ? <OrdersTab /> : <ProductsTab />}
      </main>
    </div>
  );
}

function OrdersTab() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<OrderStatus | "all">("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        setOrders(
          snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Order, "id">) }))
        );
        setLoading(false);
      },
      () => {
        setError("Не удалось загрузить заказы.");
        setLoading(false);
      }
    );
    return unsub;
  }, []);

  const changeStatus = async (orderId: string, status: OrderStatus) => {
    setUpdatingId(orderId);
    try {
      await updateDoc(doc(db, "orders", orderId), { status });
    } catch {
      setError("Не удалось обновить статус.");
    } finally {
      setUpdatingId(null);
    }
  };

  const visible = filter === "all" ? orders : orders.filter((o) => o.status === filter);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {ALL_STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              filter === s
                ? "bg-amber-500 text-white border-amber-500"
                : "bg-white text-amber-800 border-amber-200 hover:bg-amber-50"
            }`}
          >
            {s === "all" ? "Все" : STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      {error && <p className="text-red-600 bg-red-50 rounded-xl px-4 py-3">{error}</p>}

      {loading && (
        <>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl h-32 animate-pulse border border-amber-100" />
          ))}
        </>
      )}

      {!loading && visible.length === 0 && (
        <div className="text-center py-16 text-stone-500">
          <div className="text-5xl mb-3">📭</div>
          <p>Заказов пока нет</p>
        </div>
      )}

      {visible.map((order) => (
        <div
          key={order.id}
          className="bg-white rounded-2xl border border-amber-100 p-5 shadow-sm"
        >
          <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
            <div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  STATUS_STYLES[order.status]
                }`}
              >
                {STATUS_LABELS[order.status]}
              </span>
              <span className="ml-3 text-sm text-stone-600">{order.userEmail}</span>
            </div>
            <span className="text-xs text-stone-400">
              {formatDate(order.createdAt?.toDate() ?? null)}
            </span>
          </div>
          <ul className="text-sm text-stone-600 space-y-1 mb-3">
            {order.items.map((item) => (
              <li key={item.productId} className="flex justify-between">
                <span>
                  {item.name} × {item.quantity}
                </span>
                <span>{formatPrice(item.price * item.quantity)}</span>
              </li>
            ))}
          </ul>
          {(order.customerName || order.phone || order.comment) && (
            <div className="text-sm bg-amber-50 border border-amber-100 rounded-xl px-3 py-2 mb-3 space-y-0.5">
              {order.customerName && (
                <p>
                  <span className="text-stone-400">Клиент:</span>{" "}
                  <span className="font-medium text-stone-700">{order.customerName}</span>
                </p>
              )}
              {order.phone && (
                <p>
                  <span className="text-stone-400">Телефон:</span>{" "}
                  <a href={`tel:${order.phone}`} className="text-amber-700 hover:underline">
                    {order.phone}
                  </a>
                </p>
              )}
              {order.comment && (
                <p>
                  <span className="text-stone-400">Комментарий:</span>{" "}
                  <span className="text-stone-700">{order.comment}</span>
                </p>
              )}
            </div>
          )}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-amber-100">
            <span className="font-bold text-stone-800">
              Итого: <span className="text-amber-700">{formatPrice(order.total)}</span>
            </span>
            <div className="flex flex-wrap gap-1.5">
              {(Object.keys(STATUS_LABELS) as OrderStatus[]).map((s) => (
                <button
                  key={s}
                  disabled={updatingId === order.id || s === order.status}
                  onClick={() => changeStatus(order.id, s)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors disabled:opacity-50 ${
                    s === order.status
                      ? "bg-amber-500 text-white border-amber-500"
                      : "bg-white text-stone-600 border-stone-200 hover:bg-amber-50 hover:border-amber-300"
                  }`}
                >
                  {STATUS_LABELS[s]}
                </button>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

const EMPTY_FORM = { name: "", price: "", description: "", imageUrl: "" };

function ProductsTab() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "products"),
      (snap) => {
        setProducts(
          snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Product, "id">) }))
        );
        setLoading(false);
      },
      () => {
        setError("Не удалось загрузить товары.");
        setLoading(false);
      }
    );
    return unsub;
  }, []);

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = (p: Product) => {
    setForm({
      name: p.name,
      price: String(p.price),
      description: p.description,
      imageUrl: p.imageUrl,
    });
    setEditingId(p.id);
    setShowForm(true);
  };

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const data = {
      name: form.name.trim(),
      price: Number(form.price),
      description: form.description.trim(),
      imageUrl: form.imageUrl.trim(),
    };
    try {
      if (!data.name || isNaN(data.price) || data.price < 0) {
        throw new Error("bad");
      }
      if (editingId) {
        await updateDoc(doc(db, "products", editingId), data);
      } else {
        await addDoc(collection(db, "products"), data);
      }
      setForm(EMPTY_FORM);
      setEditingId(null);
      setShowForm(false);
    } catch {
      setError("Проверьте заполнение полей: название и цена обязательны.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    try {
      await deleteDoc(doc(db, "products", id));
    } catch {
      setError("Не удалось удалить товар.");
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold text-stone-800">Товары ({products.length})</h2>
        <button
          onClick={openCreate}
          className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium transition-colors"
        >
          + Добавить булочку
        </button>
      </div>

      {error && <p className="text-red-600 bg-red-50 rounded-xl px-4 py-3">{error}</p>}

      {showForm && (
        <form
          onSubmit={save}
          className="bg-white rounded-2xl border border-amber-200 p-5 shadow-sm space-y-3"
        >
          <div className="grid sm:grid-cols-2 gap-3">
            <input
              required
              placeholder="Название"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="px-4 py-2.5 rounded-xl border border-stone-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-200 outline-none"
            />
            <input
              required
              type="number"
              min="0"
              step="0.01"
              placeholder="Цена, ₽"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              className="px-4 py-2.5 rounded-xl border border-stone-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-200 outline-none"
            />
          </div>
          <input
            placeholder="Ссылка на фото (URL)"
            value={form.imageUrl}
            onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-200 outline-none"
          />
          <textarea
            placeholder="Описание"
            rows={2}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-200 outline-none"
          />
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
              }}
              className="px-4 py-2 rounded-xl text-sm text-stone-500 hover:bg-stone-100"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white text-sm font-medium"
            >
              {saving ? "Сохраняем…" : editingId ? "Сохранить" : "Добавить"}
            </button>
          </div>
        </form>
      )}

      {loading && (
        <div className="grid sm:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl h-32 animate-pulse border border-amber-100" />
          ))}
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        {products.map((p) => (
          <div
            key={p.id}
            className="bg-white rounded-2xl border border-amber-100 p-4 shadow-sm flex gap-4"
          >
            <div className="w-20 h-20 rounded-xl bg-amber-50 overflow-hidden flex-shrink-0">
              {p.imageUrl ? (
                <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-3xl">🥖</div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start gap-2">
                <h3 className="font-semibold text-stone-800 truncate">{p.name}</h3>
                <span className="font-bold text-amber-700 whitespace-nowrap">
                  {formatPrice(p.price)}
                </span>
              </div>
              <p className="text-sm text-stone-500 line-clamp-2 mt-0.5">{p.description}</p>
              <div className="mt-2 flex gap-2">
                <button
                  onClick={() => openEdit(p)}
                  className="text-xs px-3 py-1 rounded-lg bg-amber-50 text-amber-800 hover:bg-amber-100"
                >
                  Изменить
                </button>
                <button
                  onClick={() => remove(p.id)}
                  className="text-xs px-3 py-1 rounded-lg bg-red-50 text-red-600 hover:bg-red-100"
                >
                  Удалить
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

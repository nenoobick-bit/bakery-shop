import { useEffect, useState } from "react";
import { collection, onSnapshot, query } from "firebase/firestore";
import { db } from "../lib/firebase";
import type { Product } from "../lib/types";
import { useCart } from "../lib/cart";
import { formatPrice } from "../lib/cn";
import { Link } from "react-router-dom";
import { useAuth } from "../lib/auth";
import UserMenu from "../components/UserMenu";

function ProductCard({ product, onOpen }: { product: Product; onOpen: (p: Product) => void }) {
  const { add, items } = useCart();
  const inCart = items.find((i) => i.productId === product.id);

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-amber-100 flex flex-col hover:shadow-md transition-shadow cursor-pointer group"
      onClick={() => onOpen(product)}
    >
      <div className="h-44 bg-amber-50 overflow-hidden">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl">🥖</div>
        )}
      </div>
      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-semibold text-stone-800">{product.name}</h3>
        <p className="text-sm text-stone-500 mt-1 flex-1 line-clamp-2">
          {product.description}
        </p>
        <div className="mt-3 flex items-center justify-between">
          <span className="text-lg font-bold text-amber-700">
            {formatPrice(product.price)}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              add(product);
            }}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium transition-colors"
          >
            {inCart ? `В корзине: ${inCart.quantity}` : "В корзину"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ProductModal({ product, onClose }: { product: Product; onClose: () => void }) {
  const { add } = useCart();

  return (
    <div
      className="fixed inset-0 z-[70] bg-black/50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl overflow-hidden w-full max-w-md max-h-[90dvh] flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative shrink-0 h-56 bg-amber-50">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-6xl">🥖</div>
          )}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 hover:bg-white flex items-center justify-center text-stone-500 hover:text-stone-800 text-xl leading-none shadow"
          >
            ×
          </button>
        </div>
        <div className="p-5 overflow-y-auto">
          <h3 className="text-xl font-bold text-stone-800">{product.name}</h3>
          <p className="text-stone-600 mt-2 whitespace-pre-line">
            {product.description || "Описание пока не добавлено."}
          </p>
          <div className="mt-5 flex items-center justify-between gap-3">
            <span className="text-2xl font-bold text-amber-700">
              {formatPrice(product.price)}
            </span>
            <button
              onClick={() => {
                add(product);
                onClose();
              }}
              className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold transition-colors"
            >
              В корзину
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Product | null>(null);

  useEffect(() => {
    const q = query(collection(db, "products"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        setProducts(
          snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Product, "id">) }))
        );
        setLoading(false);
      },
      () => {
        setError("Не удалось загрузить каталог. Проверьте подключение.");
        setLoading(false);
      }
    );
    return unsub;
  }, []);

  return (
    <div className="min-h-screen bg-[#fdf6ec]">
      <header className="bg-white/90 backdrop-blur border-b border-amber-100 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-amber-900">🥐 Пекарня «Тёплый Хлеб»</h1>
          <div className="flex items-center gap-3">
            <Link
              to="/orders"
              className="text-sm text-amber-800 hover:text-amber-600 font-medium transition-colors"
            >
              Мои заказы
            </Link>
            <CartButton />
            <UserMenu />
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold text-stone-800 mb-6">Каталог булочек</h2>

        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl h-72 animate-pulse border border-amber-100"
              />
            ))}
          </div>
        )}

        {error && (
          <p className="text-red-600 bg-red-50 rounded-xl px-4 py-3">{error}</p>
        )}

        {!loading && !error && products.length === 0 && (
          <div className="text-center py-16 text-stone-500">
            <div className="text-5xl mb-3">🥖</div>
            <p>Каталог пока пуст. Загляните позже!</p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} onOpen={setSelected} />
          ))}
        </div>
      </main>

      {selected && (
        <ProductModal product={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}

function CartButton() {
  const { count } = useCart();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="relative px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium transition-colors"
      >
        Корзина
        {count > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {count}
          </span>
        )}
      </button>
      {open && <CartDrawer onClose={() => setOpen(false)} />}
    </>
  );
}

function CartDrawer({ onClose }: { onClose: () => void }) {
  const { items, setQuantity, remove, total, clear } = useCart();
  const [ordering, setOrdering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [doneOrderId, setDoneOrderId] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [comment, setComment] = useState("");

  const { user } = useAuth();

  const checkout = async () => {
    setOrdering(true);
    setError(null);
    try {
      if (!user) throw new Error("unauthorized");
      const { collection, addDoc, serverTimestamp } = await import("firebase/firestore");
      const ref = await addDoc(collection(db, "orders"), {
        userId: user.uid,
        userEmail: user.email,
        items: items.map(({ productId, name, price, quantity }) => ({
          productId,
          name,
          price,
          quantity,
        })),
        total,
        status: "new",
        customerName: customerName.trim(),
        phone: phone.trim(),
        comment: comment.trim(),
        createdAt: serverTimestamp(),
      });
      clear();
      console.log("[checkout] Заказ создан, id:", ref.id);
      setDoneOrderId(ref.id);
    } catch {
      setError("Не удалось оформить заказ. Попробуйте ещё раз.");
    } finally {
      setOrdering(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/40"
      onClick={onClose}
    >
      <div
        className="fixed top-0 right-0 h-[100dvh] w-full sm:w-[400px] flex flex-col bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shrink-0 p-5 border-b border-amber-100 flex items-center justify-between">
          <h3 className="font-bold text-lg text-stone-800">Ваша корзина</h3>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-600 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {doneOrderId ? (
          <div className="flex-1 min-h-0 flex flex-col items-center justify-center gap-3 p-6 text-center overflow-y-auto">
            <div className="text-5xl">✅</div>
            <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 text-sm">
              Заказ оформлен! Номер: <span className="font-mono font-semibold">{doneOrderId}</span>
            </div>
            <Link
              to="/orders"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold transition-colors"
            >
              Мои заказы
            </Link>
          </div>
        ) : items.length === 0 ? (
          <div className="flex-1 min-h-0 flex flex-col items-center justify-center text-stone-400 gap-2">
            <div className="text-5xl">🛒</div>
            <p>Корзина пуста</p>
          </div>
        ) : (
          <>
            <div className="flex-1 basis-0 min-h-0 overflow-y-auto p-5 space-y-4">
              {items.map((item) => (
                <div
                  key={item.productId}
                  className="flex items-center gap-3 border border-amber-100 rounded-xl p-3 shrink-0 min-h-[72px]"
                >
                  <div className="w-14 h-14 rounded-lg bg-amber-50 overflow-hidden shrink-0">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl">
                        🥖
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-stone-800 truncate">{item.name}</p>
                    <p className="text-sm text-amber-700">{formatPrice(item.price)}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setQuantity(item.productId, item.quantity - 1)}
                      className="w-7 h-7 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold"
                    >
                      −
                    </button>
                    <span className="w-6 text-center text-sm font-medium">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(item.productId, item.quantity + 1)}
                      className="w-7 h-7 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold"
                    >
                      +
                    </button>
                  </div>
                  <button
                    onClick={() => remove(item.productId)}
                    className="text-stone-300 hover:text-red-500 text-xl leading-none shrink-0"
                    title="Удалить"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            <div className="shrink-0 p-5 border-t border-amber-100 space-y-3 bg-white">
              <div className="space-y-2">
                <input
                  required
                  placeholder="Ваше имя"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-stone-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-200 outline-none text-sm"
                />
                <input
                  required
                  type="tel"
                  placeholder="Телефон"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-stone-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-200 outline-none text-sm"
                />
                <textarea
                  rows={2}
                  placeholder="Комментарий (например, время самовывоза)"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-stone-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-200 outline-none text-sm resize-none"
                />
              </div>
              <div className="flex justify-between text-lg font-bold text-stone-800">
                <span>Итого:</span>
                <span className="text-amber-700">{formatPrice(total)}</span>
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button
                onClick={checkout}
                disabled={ordering}
                className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white font-semibold transition-colors"
              >
                {ordering ? "Оформляем…" : "Оформить заказ"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}



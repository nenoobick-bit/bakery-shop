import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { doc, getDoc, setDoc } from "firebase/firestore";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { auth, db } from "../lib/firebase";
import type { Role } from "../lib/types";
import { cn } from "../lib/cn";

type Mode = "login" | "register";

export default function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fail = (err: unknown, context: string) => {
    const e = err as { code?: string; message?: string };
    const code = e?.code ?? "";
    const raw = `${code} ${e?.message ?? ""}`;
    console.error(`[${context}] Ошибка Firebase:`, code, e?.message, err);

    const map: Array<[RegExp, string]> = [
      [/EMAIL_EXISTS|email-already-in-use/i, "Этот email уже зарегистрирован. Попробуйте войти."],
      [/INVALID_EMAIL|invalid-email/i, "Некорректный email"],
      [/INVALID_LOGIN_CREDENTIALS|INVALID_PASSWORD|user-not-found|wrong-password/i, "Неверный email или пароль"],
      [/WEAK_PASSWORD|weak-password/i, "Пароль слишком короткий (минимум 6 символов)"],
      [/TOO_MANY_ATTEMPTS/i, "Слишком много попыток. Попробуйте позже."],
      [/NETWORK/i, "Ошибка сети. Проверьте подключение к интернету."],
    ];
    const message = map.find(([re]) => re.test(raw))?.[1] ?? "Произошла ошибка. Попробуйте ещё раз.";

    setError(message);
    toast.error(message);
    setLoading(false);
  };

  const afterLogin = async (uid: string, userEmail: string) => {
    // Читаем роль из Firestore; если документа нет — создаём с role "client"
    let role: Role = "client";
    try {
      const snap = await getDoc(doc(db, "users", uid));
      if (snap.exists()) {
        role = (snap.data().role as Role) ?? "client";
      } else {
        console.log(`[login] Документ users/${uid} не найден — создаю с ролью "client"`);
        await setDoc(doc(db, "users", uid), { email: userEmail, role: "client" });
      }
    } catch (err) {
      return fail(err, "login/firestore");
    }
    console.log(`[login] uid: ${uid}, прочитанная роль: ${role}`);
    toast.success("Вход выполнен!");
    navigate(role === "manager" ? "/manager" : "/shop", { replace: true });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      if (mode === "register") {
        const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
        console.log(`[register] Создан пользователь, uid: ${cred.user.uid}`);
        await setDoc(doc(db, "users", cred.user.uid), {
          email: cred.user.email,
          role: "client",
        });
        console.log(`[register] users/${cred.user.uid} создан, роль: client`);
        setSuccess("Аккаунт создан, добро пожаловать!");
        toast.success("Аккаунт создан, добро пожаловать!");
        // Сначала показываем сообщение, затем переходим в каталог
        setTimeout(() => {
          navigate("/shop", { replace: true });
        }, 1500);
      } else {
        const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
        setSuccess("Вход выполнен!");
        await afterLogin(cred.user.uid, cred.user.email ?? "");
      }
    } catch (err) {
      fail(err, mode);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fdf6ec] px-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-amber-900/10 p-8 border border-amber-100">
        <div className="text-center mb-8">
          <div className="text-5xl mb-2">🥐</div>
          <h1 className="text-2xl font-bold text-amber-900">Пекарня «Тёплый Хлеб»</h1>
          <p className="text-stone-500 text-sm mt-1">
            {mode === "login" ? "Войдите в личный кабинет" : "Создайте новый аккаунт"}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-6 bg-amber-50 rounded-full p-1">
          <button
            onClick={() => setMode("login")}
            className={cn(
              "py-2 rounded-full text-sm font-medium transition-colors",
              mode === "login"
                ? "bg-amber-500 text-white shadow"
                : "text-amber-800 hover:bg-amber-100"
            )}
          >
            Вход
          </button>
          <button
            onClick={() => setMode("register")}
            className={cn(
              "py-2 rounded-full text-sm font-medium transition-colors",
              mode === "register"
                ? "bg-amber-500 text-white shadow"
                : "text-amber-800 hover:bg-amber-100"
            )}
          >
            Регистрация
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-200 outline-none transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Пароль</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-200 outline-none transition"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
          {success && (
            <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
              {success}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white font-semibold transition-colors"
          >
            {loading
              ? "Загрузка…"
              : mode === "login"
                ? "Войти"
                : "Зарегистрироваться"}
          </button>
        </form>

        <p className="text-xs text-stone-400 text-center mt-6">
          Новые пользователи регистрируются как клиенты. Роль менеджера назначается вручную
          в базе данных (users → role: "manager").
        </p>
      </div>
    </div>
  );
}

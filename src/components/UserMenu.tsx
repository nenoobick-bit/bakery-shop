import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { toast } from "sonner";
import { auth } from "../lib/firebase";
import { useAuth } from "../lib/auth";

export default function UserMenu() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const logout = async () => {
    try {
      await signOut(auth);
      console.log("[logout] Пользователь вышел:", user?.uid);
      navigate("/login", { replace: true });
    } catch (err) {
      console.error("[logout] Ошибка:", err);
      toast.error("Не удалось выйти. Попробуйте ещё раз.");
    }
  };

  return (
    <div className="flex items-center gap-3">
      <span className="hidden sm:block text-xs text-stone-400 truncate max-w-[180px]">
        {user?.email}
      </span>
      <button
        onClick={logout}
        className="text-sm text-stone-500 hover:text-red-500 font-medium transition-colors"
      >
        Выйти
      </button>
    </div>
  );
}

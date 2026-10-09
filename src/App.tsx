import { BrowserRouter, MemoryRouter, Navigate, Route, Routes } from "react-router-dom";
import type { ReactNode } from "react";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "./lib/auth";
import { CartProvider } from "./lib/cart";
import AuthPage from "./pages/AuthPage";
import ShopPage from "./pages/ShopPage";
import OrdersPage from "./pages/OrdersPage";
import ManagerPage from "./pages/ManagerPage";

// При публикации платформа рендерит приложение на сервере (Node), где нет window/document.
// BrowserRouter на сервере падает, поэтому там используем MemoryRouter.
const Router = typeof document === "undefined" ? MemoryRouter : BrowserRouter;

function FullScreenLoader() {
  return (
    <div className="min-h-screen bg-[#fdf6ec] flex flex-col items-center justify-center gap-3">
      <div className="w-10 h-10 border-4 border-amber-200 border-t-amber-500 rounded-full animate-spin" />
      <p className="text-sm text-stone-500">Загружаем пекарню…</p>
    </div>
  );
}

function RequireRole({ role, children }: { role: "client" | "manager"; children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <FullScreenLoader />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== role) {
    return <Navigate to={user.role === "manager" ? "/manager" : "/shop"} replace />;
  }
  return <>{children}</>;
}

function HomeRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <FullScreenLoader />;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === "manager" ? "/manager" : "/shop"} replace />;
}

export default function App() {
  return (
    <Router>
      <Toaster position="top-center" richColors closeButton />
      <AuthProvider>
        <CartProvider>
          <Routes>
            <Route path="/login" element={<AuthPage />} />
            <Route
              path="/shop"
              element={
                <RequireRole role="client">
                  <ShopPage />
                </RequireRole>
              }
            />
            <Route
              path="/orders"
              element={
                <RequireRole role="client">
                  <OrdersPage />
                </RequireRole>
              }
            />
            <Route
              path="/manager"
              element={
                <RequireRole role="manager">
                  <ManagerPage />
                </RequireRole>
              }
            />
            <Route path="*" element={<HomeRedirect />} />
          </Routes>
        </CartProvider>
      </AuthProvider>
    </Router>
  );
}

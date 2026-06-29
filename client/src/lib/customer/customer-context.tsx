'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { QrValidationData, Cart, Order } from '@/types/customer';
import { menuApi, cartApi, orderApi } from '@/lib/api/customer';

interface CustomerContextType {
  // QR / session state
  token: string | null;
  sessionId: string | null;
  qrData: QrValidationData | null;
  isSessionLoading: boolean;

  // Cart
  cart: Cart | null;
  cartLoading: boolean;
  addToCart: (
    menuItemId: string,
    quantity: number,
    opts?: { variantName?: string; addons?: { name: string; price: number }[]; notes?: string }
  ) => Promise<void>;
  updateCartItem: (cartItemId: string, quantity: number, notes?: string) => Promise<void>;
  removeFromCart: (cartItemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;

  // Orders
  currentOrder: Order | null;
  setCurrentOrder: (order: Order | null) => void;

  // Init from QR token
  initSession: (token: string) => Promise<void>;
}

const CustomerContext = createContext<CustomerContextType | undefined>(undefined);

export function CustomerProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [qrData, setQrData] = useState<QrValidationData | null>(null);
  const [isSessionLoading, setIsSessionLoading] = useState(false);
  const [cart, setCart] = useState<Cart | null>(null);
  const [cartLoading, setCartLoading] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);

  // Rehydrate from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const storedToken = localStorage.getItem('tm_token');
    const storedSession = localStorage.getItem('tm_session');
    const storedQr = localStorage.getItem('tm_qr');
    if (storedToken) setToken(storedToken);
    if (storedSession) setSessionId(storedSession);
    if (storedQr) {
      try { setQrData(JSON.parse(storedQr)); } catch { /* ignore */ }
    }
  }, []);

  // Auto-load cart when sessionId is known
  useEffect(() => {
    if (sessionId) refreshCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  const refreshCart = useCallback(async () => {
    if (!sessionId) return;
    try {
      setCartLoading(true);
      const res = await cartApi.get(sessionId);
      setCart(res.data);
    } catch {
      setCart(null);
    } finally {
      setCartLoading(false);
    }
  }, [sessionId]);

  const initSession = useCallback(async (qrToken: string) => {
    setIsSessionLoading(true);
    try {
      // Validate QR
      const qrRes = await menuApi.validateToken(qrToken);
      const data = qrRes.data!;
      setQrData(data);
      setToken(qrToken);
      localStorage.setItem('tm_token', qrToken);
      localStorage.setItem('tm_qr', JSON.stringify(data));

      // Create session
      const sessionRes = await menuApi.createSession(qrToken);
      const sid = sessionRes.data!.sessionId;
      setSessionId(sid);
      localStorage.setItem('tm_session', sid);
    } finally {
      setIsSessionLoading(false);
    }
  }, []);

  const addToCart = useCallback(
    async (
      menuItemId: string,
      quantity: number,
      opts?: { variantName?: string; addons?: { name: string; price: number }[]; notes?: string }
    ) => {
      if (!sessionId) return;
      const res = await cartApi.addItem(sessionId, { menuItemId, quantity, ...opts });
      setCart(res.data);
    },
    [sessionId]
  );

  const updateCartItem = useCallback(
    async (cartItemId: string, quantity: number, notes?: string) => {
      if (!sessionId) return;
      const res = await cartApi.updateItem(sessionId, cartItemId, quantity, notes);
      setCart(res.data);
    },
    [sessionId]
  );

  const removeFromCart = useCallback(
    async (cartItemId: string) => {
      if (!sessionId) return;
      const res = await cartApi.removeItem(sessionId, cartItemId);
      setCart(res.data);
    },
    [sessionId]
  );

  const clearCart = useCallback(async () => {
    if (!sessionId) return;
    await cartApi.clear(sessionId);
    setCart(null);
  }, [sessionId]);

  return (
    <CustomerContext.Provider
      value={{
        token,
        sessionId,
        qrData,
        isSessionLoading,
        cart,
        cartLoading,
        addToCart,
        updateCartItem,
        removeFromCart,
        clearCart,
        refreshCart,
        currentOrder,
        setCurrentOrder,
        initSession,
      }}
    >
      {children}
    </CustomerContext.Provider>
  );
}

export function useCustomer() {
  const ctx = useContext(CustomerContext);
  if (!ctx) throw new Error('useCustomer must be used inside CustomerProvider');
  return ctx;
}

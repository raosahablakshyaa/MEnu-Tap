'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, SlidersHorizontal, ShoppingCart, X, ChevronDown, Flame,
  Star, Leaf, AlertCircle, Loader2, Plus, Minus, Info
} from 'lucide-react';
import { useCustomer } from '@/lib/customer/customer-context';
import { menuApi } from '@/lib/api/customer';
import type { PublicMenuCategory, PublicMenuItem } from '@/types/customer';
import { cn } from '@/lib/utils';

const FOOD_TYPE_ICONS: Record<string, string> = {
  veg: '🟢', non_veg: '🔴', vegan: '🌿', jain: '✡️', egg: '🥚',
};

const FOOD_TYPE_LABELS: Record<string, string> = {
  veg: 'Veg', non_veg: 'Non-Veg', vegan: 'Vegan', jain: 'Jain', egg: 'Egg',
};

function FoodBadge({ type }: { type: string }) {
  const colors: Record<string, string> = {
    veg: 'border-emerald-500 text-emerald-700',
    non_veg: 'border-red-500 text-red-700',
    vegan: 'border-green-600 text-green-700',
    jain: 'border-blue-500 text-blue-700',
    egg: 'border-yellow-500 text-yellow-700',
  };
  return (
    <span className={cn('inline-flex items-center gap-0.5 rounded border px-1 py-0.5 text-[10px] font-semibold', colors[type] ?? 'border-zinc-300 text-zinc-500')}>
      {FOOD_TYPE_ICONS[type]} {FOOD_TYPE_LABELS[type]}
    </span>
  );
}

export default function MenuBrowsePage() {
  const { token } = useParams() as { token: string };
  const router = useRouter();
  const { qrData, cart, addToCart, updateCartItem, removeFromCart, isSessionLoading, initSession } = useCustomer();

  const [categories, setCategories] = useState<PublicMenuCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [foodFilter, setFoodFilter] = useState<string>('');
  const [sortBy, setSortBy] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedItem, setSelectedItem] = useState<PublicMenuItem | null>(null);
  const [addingId, setAddingId] = useState<string | null>(null);

  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Init session if coming directly (not via landing)
  useEffect(() => {
    if (!qrData && token) {
      initSession(token).catch(() => router.push(`/menu/${token}`));
    }
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadMenu = useCallback(async (params?: Record<string, string>) => {
    setLoading(true);
    try {
      const res = await menuApi.getMenu(token, params);
      setCategories(res.data?.categories ?? []);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { loadMenu(); }, [loadMenu]);

  // Debounced search
  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      const p: Record<string, string> = {};
      if (search) p.search = search;
      if (foodFilter) p.foodType = foodFilter;
      if (sortBy) p.sortBy = sortBy;
      loadMenu(Object.keys(p).length ? p : undefined);
    }, 350);
    return () => { if (searchTimeout.current) clearTimeout(searchTimeout.current); };
  }, [search, foodFilter, sortBy, loadMenu]);

  const scrollToCategory = (catId: string) => {
    setActiveCategory(catId);
    if (catId === 'all') { window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    sectionRefs.current[catId]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const getCartQty = (itemId: string) =>
    cart?.items.filter(i => i.menuItemId === itemId).reduce((s, i) => s + i.quantity, 0) ?? 0;

  const getCartItemId = (itemId: string) =>
    cart?.items.find(i => i.menuItemId === itemId)?._id;

  const handleAdd = async (item: PublicMenuItem) => {
    if (item.variants.length > 0 || item.addons.length > 0) {
      setSelectedItem(item); return;
    }
    setAddingId(item._id);
    try { await addToCart(item._id, 1); }
    finally { setAddingId(null); }
  };

  const handleIncrease = async (item: PublicMenuItem) => {
    const cartItemId = getCartItemId(item._id);
    const qty = getCartQty(item._id);
    if (cartItemId) await updateCartItem(cartItemId, qty + 1);
    else await addToCart(item._id, 1);
  };

  const handleDecrease = async (item: PublicMenuItem) => {
    const cartItemId = getCartItemId(item._id);
    const qty = getCartQty(item._id);
    if (!cartItemId) return;
    if (qty <= 1) await removeFromCart(cartItemId);
    else await updateCartItem(cartItemId, qty - 1);
  };

  const totalCartItems = cart?.totalItems ?? 0;
  const restaurant = qrData?.restaurant;
  const themeColor = restaurant?.branding?.themeColor ?? '#ea580c';

  return (
    <div className="min-h-screen bg-zinc-50 pb-28">
      {/* Sticky Header */}
      <div className="sticky top-0 z-30 bg-white shadow-sm">
        <div className="flex items-center gap-2 px-4 py-3">
          <div className="flex flex-1 items-center gap-2 rounded-xl bg-zinc-100 px-3 py-2">
            <Search size={16} className="text-zinc-400 shrink-0" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search dishes…"
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-zinc-400"
            />
            {search && (
              <button onClick={() => setSearch('')}><X size={14} className="text-zinc-400" /></button>
            )}
          </div>
          <button
            onClick={() => setShowFilters(p => !p)}
            className={cn('rounded-xl p-2 transition', showFilters ? 'bg-orange-100 text-orange-600' : 'bg-zinc-100 text-zinc-500')}
          >
            <SlidersHorizontal size={18} />
          </button>
        </div>

        {/* Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
              className="overflow-hidden border-t border-zinc-100 px-4 py-2">
              <div className="flex flex-wrap gap-2">
                {['', 'veg', 'non_veg', 'vegan'].map(ft => (
                  <button key={ft}
                    onClick={() => setFoodFilter(ft)}
                    className={cn('rounded-full border px-3 py-1 text-xs font-medium transition',
                      foodFilter === ft ? 'border-orange-500 bg-orange-500 text-white' : 'border-zinc-200 text-zinc-600')}>
                    {ft ? FOOD_TYPE_LABELS[ft] : 'All'}
                  </button>
                ))}
                <div className="ml-auto">
                  <select value={sortBy} onChange={e => setSortBy(e.target.value)}
                    className="rounded-full border border-zinc-200 px-3 py-1 text-xs font-medium text-zinc-600 outline-none">
                    <option value="">Default</option>
                    <option value="popular">Popular</option>
                    <option value="price_asc">Price ↑</option>
                    <option value="price_desc">Price ↓</option>
                    <option value="newest">Newest</option>
                  </select>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Category tabs */}
        <div className="flex gap-1 overflow-x-auto border-t border-zinc-100 px-4 py-2 scrollbar-hide">
          <button onClick={() => scrollToCategory('all')}
            className={cn('shrink-0 rounded-full px-3 py-1 text-xs font-medium transition',
              activeCategory === 'all' ? 'bg-orange-500 text-white' : 'bg-zinc-100 text-zinc-600')}>
            All
          </button>
          {categories.map(cat => (
            <button key={cat._id} onClick={() => scrollToCategory(cat._id)}
              className={cn('shrink-0 rounded-full px-3 py-1 text-xs font-medium transition',
                activeCategory === cat._id ? 'bg-orange-500 text-white' : 'bg-zinc-100 text-zinc-600')}>
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Hero strip */}
      {restaurant && (
        <div className="flex items-center gap-3 bg-white px-4 py-3 shadow-sm">
          {restaurant.logo
            ? <img src={restaurant.logo} alt="" className="h-10 w-10 rounded-lg object-cover" />
            : <div className="flex h-10 w-10 items-center justify-center rounded-lg text-white text-sm font-bold" style={{ background: themeColor }}>{restaurant.name[0]}</div>
          }
          <div>
            <p className="font-semibold text-zinc-900">{restaurant.name}</p>
            <p className="text-xs text-zinc-400">Table {qrData?.table.tableNumber} · {qrData?.table.floorName ?? `Floor ${qrData?.table.floor}`}</p>
          </div>
        </div>
      )}

      {/* Menu content */}
      <div className="mt-2 space-y-2 px-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 size={28} className="animate-spin text-orange-500" />
            <p className="mt-2 text-sm text-zinc-400">Loading menu…</p>
          </div>
        ) : categories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <span className="text-4xl">🍽️</span>
            <p className="mt-3 text-sm text-zinc-500">No items found</p>
          </div>
        ) : (
          categories.map(cat => (
            <div key={cat._id} ref={el => { sectionRefs.current[cat._id] = el; }}>
              <div className="flex items-center gap-2 py-2">
                <h2 className="text-sm font-bold text-zinc-800">{cat.name}</h2>
                <span className="text-xs text-zinc-400">({cat.items.length})</span>
              </div>
              <div className="space-y-3">
                {cat.items.map(item => (
                  <MenuItemCard
                    key={item._id}
                    item={item}
                    qty={getCartQty(item._id)}
                    adding={addingId === item._id}
                    onAdd={() => handleAdd(item)}
                    onIncrease={() => handleIncrease(item)}
                    onDecrease={() => handleDecrease(item)}
                    onInfo={() => setSelectedItem(item)}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Sticky cart bar */}
      <AnimatePresence>
        {totalCartItems > 0 && (
          <motion.div
            initial={{ y: 80 }} animate={{ y: 0 }} exit={{ y: 80 }}
            className="fixed bottom-4 left-4 right-4 z-40"
          >
            <button
              onClick={() => router.push(`/menu/${token}/cart`)}
              className="flex w-full items-center justify-between rounded-2xl px-5 py-4 text-white shadow-2xl"
              style={{ background: themeColor }}
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/25 text-sm font-bold">
                {totalCartItems}
              </span>
              <span className="font-semibold">View Cart</span>
              <span className="font-bold">₹{cart?.subtotal.toFixed(2)}</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Item Detail Sheet */}
      <AnimatePresence>
        {selectedItem && (
          <ItemDetailSheet
            item={selectedItem}
            themeColor={themeColor}
            onClose={() => setSelectedItem(null)}
            onAddToCart={async (qty, variant, addons, notes) => {
              await addToCart(selectedItem._id, qty, { variantName: variant, addons, notes });
              setSelectedItem(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ── MenuItemCard ─────────────────────────────────────────────────────────────
function MenuItemCard({
  item, qty, adding, onAdd, onIncrease, onDecrease, onInfo
}: {
  item: PublicMenuItem;
  qty: number;
  adding: boolean;
  onAdd: () => void;
  onIncrease: () => void;
  onDecrease: () => void;
  onInfo: () => void;
}) {
  return (
    <motion.div layout className="flex gap-3 rounded-2xl bg-white p-3 shadow-sm">
      {/* Image */}
      <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-zinc-100">
        {item.images[0]
          ? <img src={item.images[0]} alt={item.name} className="h-full w-full object-cover" />
          : <div className="flex h-full items-center justify-center text-3xl">🍽️</div>
        }
        {item.isOutOfStock && (
          <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/50">
            <span className="text-[10px] font-bold text-white">OUT OF STOCK</span>
          </div>
        )}
        {item.isBestSeller && !item.isOutOfStock && (
          <div className="absolute bottom-1 left-1 flex items-center gap-0.5 rounded-full bg-amber-400 px-1.5 py-0.5">
            <Star size={8} className="text-white fill-white" />
            <span className="text-[8px] font-bold text-white">BEST</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col justify-between min-w-0">
        <div>
          <div className="flex items-start justify-between gap-1">
            <p className="font-semibold text-sm text-zinc-900 leading-snug line-clamp-2">{item.name}</p>
            <button onClick={onInfo} className="shrink-0 text-zinc-300 hover:text-zinc-500 mt-0.5">
              <Info size={14} />
            </button>
          </div>
          <div className="mt-1 flex flex-wrap gap-1">
            <FoodBadge type={item.foodType} />
            {item.isChefRecommended && (
              <span className="flex items-center gap-0.5 rounded border border-purple-300 px-1 py-0.5 text-[10px] font-semibold text-purple-700">
                <Flame size={8} /> Chef's Pick
              </span>
            )}
          </div>
          {item.description && (
            <p className="mt-1 line-clamp-2 text-[11px] text-zinc-400">{item.description}</p>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div>
            {item.discountPrice ? (
              <div className="flex items-baseline gap-1.5">
                <span className="font-bold text-zinc-900">₹{item.discountPrice}</span>
                <span className="text-xs line-through text-zinc-400">₹{item.price}</span>
              </div>
            ) : (
              <span className="font-bold text-zinc-900">₹{item.price}</span>
            )}
            {item.preparationTime && (
              <p className="text-[10px] text-zinc-400">{item.preparationTime} min</p>
            )}
          </div>

          {item.isOutOfStock ? (
            <span className="rounded-xl bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-400">Unavailable</span>
          ) : qty === 0 ? (
            <button onClick={onAdd} disabled={adding}
              className="flex items-center gap-1 rounded-xl bg-orange-500 px-3 py-1.5 text-xs font-semibold text-white shadow active:scale-95 transition">
              {adding ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
              {item.variants.length > 0 ? 'Select' : 'Add'}
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button onClick={onDecrease} className="flex h-7 w-7 items-center justify-center rounded-full bg-orange-100 text-orange-600 active:scale-95">
                <Minus size={12} />
              </button>
              <span className="min-w-[20px] text-center text-sm font-bold text-orange-600">{qty}</span>
              <button onClick={onIncrease} className="flex h-7 w-7 items-center justify-center rounded-full bg-orange-500 text-white active:scale-95">
                <Plus size={12} />
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ── Item Detail Bottom Sheet ──────────────────────────────────────────────────
function ItemDetailSheet({
  item, themeColor, onClose, onAddToCart
}: {
  item: PublicMenuItem;
  themeColor: string;
  onClose: () => void;
  onAddToCart: (qty: number, variant?: string, addons?: { name: string; price: number }[], notes?: string) => Promise<void>;
}) {
  const [qty, setQty] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState<string | undefined>(
    item.variants.find(v => v.isAvailable)?.name
  );
  const [selectedAddons, setSelectedAddons] = useState<Set<string>>(new Set());
  const [notes, setNotes] = useState('');
  const [adding, setAdding] = useState(false);

  const effectivePrice = selectedVariant
    ? item.variants.find(v => v.name === selectedVariant)?.discountPrice
      ?? item.variants.find(v => v.name === selectedVariant)?.price
      ?? item.price
    : (item.discountPrice ?? item.price);

  const addonsTotal = Array.from(selectedAddons).reduce((s, name) => {
    const a = item.addons.find(x => x.name === name);
    return s + (a?.price ?? 0);
  }, 0);

  const total = (effectivePrice + addonsTotal) * qty;

  const toggleAddon = (name: string) => {
    setSelectedAddons(prev => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  };

  const handleAdd = async () => {
    setAdding(true);
    try {
      const addons = Array.from(selectedAddons).map(name => ({
        name,
        price: item.addons.find(a => a.name === name)?.price ?? 0,
      }));
      await onAddToCart(qty, selectedVariant, addons.length ? addons : undefined, notes || undefined);
    } finally { setAdding(false); }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col justify-end bg-black/50"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 350 }}
        className="max-h-[90vh] overflow-y-auto rounded-t-3xl bg-white"
        onClick={e => e.stopPropagation()}
      >
        {/* Image */}
        <div className="relative h-48 w-full overflow-hidden bg-zinc-100">
          {item.images[0]
            ? <img src={item.images[0]} alt={item.name} className="h-full w-full object-cover" />
            : <div className="flex h-full items-center justify-center text-5xl">🍽️</div>
          }
          <button onClick={onClose} className="absolute right-3 top-3 rounded-full bg-black/50 p-1.5 text-white">
            <X size={16} />
          </button>
        </div>

        <div className="p-5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="text-lg font-bold text-zinc-900">{item.name}</h2>
              <FoodBadge type={item.foodType} />
            </div>
            <div className="text-right shrink-0">
              <p className="font-bold text-zinc-900">₹{effectivePrice}</p>
              {item.discountPrice && !selectedVariant && (
                <p className="text-xs line-through text-zinc-400">₹{item.price}</p>
              )}
            </div>
          </div>

          {item.description && (
            <p className="mt-2 text-sm text-zinc-500">{item.description}</p>
          )}

          {/* Meta */}
          <div className="mt-3 flex flex-wrap gap-3 text-xs text-zinc-400">
            {item.calories && <span>🔥 {item.calories} kcal</span>}
            {item.preparationTime && <span>⏱ {item.preparationTime} min</span>}
            {item.servingSize && <span>🥘 {item.servingSize}</span>}
            {item.spiceLevel && <span>🌶 {item.spiceLevel}</span>}
          </div>

          {/* Variants */}
          {item.variants.filter(v => v.isAvailable).length > 0 && (
            <div className="mt-4">
              <p className="mb-2 text-sm font-semibold text-zinc-800">Choose variant</p>
              <div className="flex flex-wrap gap-2">
                {item.variants.filter(v => v.isAvailable).map(v => (
                  <button key={v.name}
                    onClick={() => setSelectedVariant(v.name)}
                    className={cn('rounded-xl border px-3 py-1.5 text-xs font-medium transition',
                      selectedVariant === v.name
                        ? 'border-orange-500 bg-orange-50 text-orange-700'
                        : 'border-zinc-200 text-zinc-600')}>
                    {v.name} — ₹{v.discountPrice ?? v.price}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Add-ons */}
          {item.addons.filter(a => a.isAvailable).length > 0 && (
            <div className="mt-4">
              <p className="mb-2 text-sm font-semibold text-zinc-800">Add-ons (optional)</p>
              <div className="space-y-2">
                {item.addons.filter(a => a.isAvailable).map(addon => (
                  <button key={addon.name}
                    onClick={() => toggleAddon(addon.name)}
                    className={cn('flex w-full items-center justify-between rounded-xl border px-3 py-2 text-sm transition',
                      selectedAddons.has(addon.name)
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-zinc-200')}>
                    <span className={selectedAddons.has(addon.name) ? 'font-medium text-orange-700' : 'text-zinc-700'}>
                      {addon.name}
                    </span>
                    <span className={selectedAddons.has(addon.name) ? 'font-semibold text-orange-600' : 'text-zinc-500'}>
                      +₹{addon.price}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="mt-4">
            <p className="mb-1.5 text-sm font-semibold text-zinc-800">Special Instructions</p>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Less spicy, no onion, extra butter…"
              rows={2}
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm outline-none focus:border-orange-400 resize-none"
            />
          </div>

          {/* Qty + Add CTA */}
          <div className="mt-5 flex items-center gap-3">
            <div className="flex items-center gap-3 rounded-xl border border-zinc-200 px-3 py-2">
              <button onClick={() => setQty(q => Math.max(1, q - 1))} className="text-zinc-500"><Minus size={16} /></button>
              <span className="min-w-[24px] text-center font-bold">{qty}</span>
              <button onClick={() => setQty(q => q + 1)} className="text-zinc-500"><Plus size={16} /></button>
            </div>
            <button
              onClick={handleAdd}
              disabled={adding}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl py-3 text-sm font-bold text-white shadow-lg active:scale-95 transition"
              style={{ background: themeColor }}
            >
              {adding ? <Loader2 size={16} className="animate-spin" /> : <ShoppingCart size={16} />}
              Add {qty > 1 ? `${qty} items` : 'to Cart'} · ₹{total.toFixed(2)}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

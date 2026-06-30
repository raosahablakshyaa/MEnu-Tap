'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Loader2, MapPin, Clock, Phone, ChefHat, AlertCircle } from 'lucide-react';
import { useCustomer } from '@/lib/customer/customer-context';

export default function QrLandingPage() {
  const { token } = useParams() as { token: string };
  const router = useRouter();
  const { initSession, qrData, isSessionLoading } = useCustomer();
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    if (!token) return;
    initSession(token, { forceNew: true })
      .then(() => {
        router.replace(`/menu/${token}/browse`);
      })
      .catch((e: Error) => setError(e.message));
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!qrData?.restaurant) return;
    const { openingTime, closingTime } = qrData.restaurant.operationalInfo;
    if (openingTime && closingTime) {
      const now = new Date();
      const [oh, om] = openingTime.split(':').map(Number);
      const [ch, cm] = closingTime.split(':').map(Number);
      const open = oh * 60 + om;
      const close = ch * 60 + cm;
      const cur = now.getHours() * 60 + now.getMinutes();
      setIsOpen(cur >= open && cur <= close);
    }
  }, [qrData]);

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 p-6 text-center">
        <div className="mb-4 rounded-full bg-red-100 p-4">
          <AlertCircle size={32} className="text-red-500" />
        </div>
        <h1 className="mb-2 text-xl font-bold text-zinc-900">QR Code Invalid</h1>
        <p className="text-sm text-zinc-500">{error}</p>
        <p className="mt-3 text-xs text-zinc-400">Please ask staff for a new QR code.</p>
      </div>
    );
  }

  if (isSessionLoading || !qrData) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50">
        <Loader2 size={32} className="animate-spin text-orange-500" />
        <p className="mt-3 text-sm text-zinc-500">Loading menu…</p>
      </div>
    );
  }

  const { restaurant, table } = qrData;
  const themeColor = restaurant.branding?.themeColor ?? '#ea580c';

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50">
      {/* Cover */}
      <div className="relative h-52 w-full overflow-hidden bg-zinc-200">
        {restaurant.coverImage ? (
          <img src={restaurant.coverImage} alt={restaurant.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center" style={{ background: `linear-gradient(135deg, ${themeColor}cc, ${themeColor}44)` }}>
            <ChefHat size={56} className="text-white/80" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      </div>

      {/* Logo + Info card */}
      <div className="relative -mt-12 mx-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
          className="rounded-2xl bg-white p-5 shadow-xl"
        >
          <div className="flex items-start gap-4">
            {restaurant.logo ? (
              <img src={restaurant.logo} alt="" className="h-16 w-16 rounded-xl object-cover ring-2 ring-white shadow" />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-xl text-white text-2xl font-bold shadow"
                style={{ background: themeColor }}>
                {restaurant.name[0]}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h1 className="truncate text-xl font-bold text-zinc-900">{restaurant.name}</h1>
              {restaurant.description && (
                <p className="mt-0.5 line-clamp-2 text-xs text-zinc-500">{restaurant.description}</p>
              )}
              <div className="mt-2 flex flex-wrap gap-2">
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${isOpen ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${isOpen ? 'bg-emerald-500' : 'bg-red-500'}`} />
                  {isOpen ? 'Open Now' : 'Closed'}
                </span>
                {restaurant.operationalInfo?.avgPrepTimeMinutes && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2 py-0.5 text-xs font-medium text-orange-700">
                    <Clock size={10} /> ~{restaurant.operationalInfo.avgPrepTimeMinutes} min prep
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Table info */}
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-orange-50 px-3 py-2.5">
            <MapPin size={14} className="text-orange-500 shrink-0" />
            <div>
              <p className="text-xs font-semibold text-orange-700">
                {table.displayName}
                {table.floorName && <span className="ml-1 font-normal text-orange-500">· {table.floorName}</span>}
              </p>
              <p className="text-[10px] text-orange-400">Table {table.tableNumber} · Seats {table.capacity}</p>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-center gap-2">
            <Loader2 size={16} className="animate-spin text-orange-500" />
            <p className="text-sm text-zinc-500">Opening menu…</p>
          </div>
        </motion.div>
      </div>

      {/* Contact */}
      {restaurant.contact?.phone && (
        <div className="mt-auto pb-6 pt-4 text-center">
          <a href={`tel:${restaurant.contact.phone}`} className="inline-flex items-center gap-1.5 text-xs text-zinc-400">
            <Phone size={12} /> {restaurant.contact.phone}
          </a>
        </div>
      )}
    </div>
  );
}

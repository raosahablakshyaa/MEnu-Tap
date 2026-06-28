import type { Metadata } from 'next';
import { CustomerProvider } from '@/lib/customer/customer-context';

export const metadata: Metadata = {
  title: 'TapMenu — Digital Menu',
  description: 'Scan. Browse. Order.',
};

export default function MenuLayout({ children }: { children: React.ReactNode }) {
  return (
    <CustomerProvider>
      {children}
    </CustomerProvider>
  );
}

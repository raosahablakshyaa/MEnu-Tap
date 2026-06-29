import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import VerifyEmailContent from './verify-email-content';

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}

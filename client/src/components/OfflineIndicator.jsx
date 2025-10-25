import { useOnlineStatus } from '../hooks/usePWA';
import { WifiIcon } from '@heroicons/react/24/outline';

export default function OfflineIndicator() {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-white px-4 py-2 text-center text-sm font-medium shadow-lg">
      <div className="flex items-center justify-center gap-2">
        <WifiIcon className="h-5 w-5" />
        <span>You're offline. Some features may be limited.</span>
      </div>
    </div>
  );
}

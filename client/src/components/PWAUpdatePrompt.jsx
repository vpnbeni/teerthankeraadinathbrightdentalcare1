import { useState, useEffect } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

export default function PWAUpdatePrompt() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered: ' + r);
    },
    onRegisterError(error) {
      console.log('SW registration error', error);
    },
  });

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  // Only show prompt for updates, not for offline ready
  if (!needRefresh) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          New content available
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Click reload to update to the latest version.
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => updateServiceWorker(true)}
            className="flex-1 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors font-medium"
          >
            Reload
          </button>
          <button
            onClick={close}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Later
          </button>
        </div>
      </div>
    </div>
  );
}

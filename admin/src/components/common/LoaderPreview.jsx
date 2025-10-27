/**
 * Loader Preview Component
 * Use this to preview the new logo wave loader
 * Access via: /loader-preview route (add to your router if needed)
 */

import React, { useState } from 'react';
import LoadingSpinner, { 
  SPINNER_VARIANTS, 
  SPINNER_SIZES,
  PageSpinner 
} from '../../shared/components/LoadingSpinner';

const LoaderPreview = () => {
  const [showFullScreen, setShowFullScreen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Loader Preview - Logo Wave Animation
        </h1>

        {/* Main Logo Wave Loader */}
        <div className="bg-white rounded-lg shadow-lg p-12 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">
            New Logo Wave Loader
          </h2>
          <div className="flex items-center justify-center min-h-[300px] bg-gray-50 rounded-lg">
            <LoadingSpinner 
              variant={SPINNER_VARIANTS.LOGO_WAVE}
              message="Loading..."
            />
          </div>
        </div>

        {/* With Message */}
        <div className="bg-white rounded-lg shadow-lg p-12 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">
            With Custom Message
          </h2>
          <div className="flex items-center justify-center min-h-[300px] bg-gray-50 rounded-lg">
            <LoadingSpinner 
              variant="logo-wave"
              message="Please wait while we load your data..."
            />
          </div>
        </div>

        {/* Full Screen Preview */}
        <div className="bg-white rounded-lg shadow-lg p-12 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">
            Full Screen Loader (PageSpinner)
          </h2>
          <button
            onClick={() => setShowFullScreen(true)}
            className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
          >
            Show Full Screen Loader
          </button>
          {showFullScreen && (
            <div className="fixed inset-0 z-50">
              <PageSpinner message="Loading application..." />
              <button
                onClick={() => setShowFullScreen(false)}
                className="absolute top-4 right-4 px-4 py-2 bg-white text-gray-800 rounded-lg shadow-lg hover:bg-gray-100"
              >
                Close
              </button>
            </div>
          )}
        </div>

        {/* Comparison with Other Variants */}
        <div className="bg-white rounded-lg shadow-lg p-12">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">
            Other Available Variants (for comparison)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <h3 className="text-sm font-medium text-gray-600 mb-4">Circle</h3>
              <div className="flex items-center justify-center h-32 bg-gray-50 rounded-lg">
                <LoadingSpinner variant={SPINNER_VARIANTS.CIRCLE} />
              </div>
            </div>
            <div className="text-center">
              <h3 className="text-sm font-medium text-gray-600 mb-4">Dots</h3>
              <div className="flex items-center justify-center h-32 bg-gray-50 rounded-lg">
                <LoadingSpinner variant={SPINNER_VARIANTS.DOTS} />
              </div>
            </div>
            <div className="text-center">
              <h3 className="text-sm font-medium text-gray-600 mb-4">Wave</h3>
              <div className="flex items-center justify-center h-32 bg-gray-50 rounded-lg">
                <LoadingSpinner variant={SPINNER_VARIANTS.WAVE} />
              </div>
            </div>
          </div>
        </div>

        {/* Usage Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-8">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">
            Usage Instructions
          </h3>
          <div className="space-y-2 text-sm text-blue-800">
            <p>
              <strong>For full-page loading:</strong> Use <code className="bg-blue-100 px-2 py-1 rounded">PageSpinner</code>
            </p>
            <p>
              <strong>For custom implementation:</strong> Use <code className="bg-blue-100 px-2 py-1 rounded">LoadingSpinner</code> with <code className="bg-blue-100 px-2 py-1 rounded">variant="logo-wave"</code>
            </p>
            <p>
              <strong>For small inline loaders:</strong> Continue using existing variants like <code className="bg-blue-100 px-2 py-1 rounded">CIRCLE</code> or <code className="bg-blue-100 px-2 py-1 rounded">DOTS</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoaderPreview;

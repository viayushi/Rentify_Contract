import React from 'react';
import { useSelector } from 'react-redux';

const LoadingSpinner = () => {
  const { globalLoading, pageLoading } = useSelector(state => state.ui);

  if (!globalLoading && !pageLoading) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 flex flex-col items-center space-y-4">
        <div className="spinner w-8 h-8"></div>
        <p className="text-secondary-600">Loading...</p>
      </div>
    </div>
  );
};

export default LoadingSpinner; 
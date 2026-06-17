import React from 'react';

export default function ToggleSwitch({ row, togglingIds, handleToggle }) {
  const loading = togglingIds.includes(row._id);
  const checked = row.isActive;

  return (
    <label className="relative inline-flex items-center cursor-pointer" title={checked ? 'Active' : 'Inactive'}>
      <input
        type="checkbox"
        className="sr-only peer"
        checked={checked}
        disabled={loading}
        onChange={() => handleToggle(row)}
      />
      <div
        className={`w-5 h-3 rounded-full transition-colors
          ${loading ? 'bg-gray-300' : 'bg-gray-200'}
          peer-checked:bg-green-500`}
      >
        <div
          className={`absolute left-0.5 top-0.5 bg-white border rounded-full h-2 w-2 transition-transform
            ${checked ? 'translate-x-full' : ''}`}
        />
        {loading && (
          <span className="absolute inset-0 flex items-center justify-center">
            <svg className="animate-spin h-2 w-2 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
            </svg>
          </span>
        )}
      </div>
    </label>
  );
}

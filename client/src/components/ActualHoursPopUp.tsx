import React, { useState } from 'react';

interface ActualHoursPopUpProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (hours: number) => void;
  taskTitle: string;
}

export function ActualHoursPopUp({ isOpen, onClose, onSubmit, taskTitle }: ActualHoursPopUpProps) {
  const [hours, setHours] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const parsedHours = parseFloat(hours);
    if (isNaN(parsedHours) || parsedHours <= 0) {
      return;
    }

    onSubmit(parsedHours);
    setHours('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md transition-opacity duration-300">
      <div className="w-full max-w-md bg-[#1e1e1e]/95 border border-white/10 rounded-3xl p-8 shadow-2xl text-left select-none">
        <h3 className="text-xl font-bold text-white mb-2">Complete Task</h3>
        <p className="text-gray-400 text-sm mb-6 leading-relaxed">
          Please enter the actual hours spent on{' '}
          <span className="text-emerald-400 font-semibold">"{taskTitle}"</span> to mark it as done.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="actual-hours" className="block text-gray-300 text-sm font-semibold">
              Actual Hours:
            </label>
            <input
              id="actual-hours"
              type="number"
              step="0.1"
              min="0.1"
              required
              placeholder="e.g. 4.5"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              className="w-full h-11 px-4 bg-[#121212] border border-[#333] hover:border-zinc-700 focus:border-emerald-500/50 rounded-xl text-white placeholder-gray-500 text-sm focus:outline-none transition-colors"
              autoFocus
            />
          </div>

          <div className="flex justify-end gap-4 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="h-10 px-5 bg-transparent hover:bg-white/5 border border-white/20 rounded-xl text-gray-300 text-sm font-semibold transition-colors duration-200 cursor-pointer focus:outline-none"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="h-10 px-6 bg-[#043314] hover:bg-[#074c1f] border border-white rounded-xl text-white text-sm font-semibold transition-colors duration-200 cursor-pointer shadow-md focus:outline-none focus:ring-2 focus:ring-[#098032]"
            >
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ActualHoursPopUp;

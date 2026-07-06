import React, { useState, memo } from 'react';

interface ActualHoursPopUpProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (hours: number) => void;
  taskTitle: string;
}

// React.memo is used here to prevent ActualHoursPopUp from re-rendering when drag/drop operations or reordering actions are performed on the Kanban board, unless the popup's visibility or active taskTitle changes.
export const ActualHoursPopUp = memo(function ActualHoursPopUp({
  isOpen,
  onClose,
  onSubmit,
  taskTitle,
}: ActualHoursPopUpProps) {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-[#181818] border border-zinc-800/80 rounded-2xl p-6 shadow-2xl text-left select-none">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Complete Task</h3>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800 transition-all cursor-pointer focus:outline-none"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Description */}
        <p className="text-zinc-400 text-xs leading-relaxed mb-5">
          Enter the actual hours spent on{' '}
          <span className="text-white font-semibold">"{taskTitle}"</span>{' '}
          to mark it as done.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label htmlFor="actual-hours" className="block text-zinc-500 text-xs font-semibold uppercase tracking-wider">
              Actual Hours
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
              className="w-full h-10 px-3 bg-[#121212] border border-zinc-800 hover:border-zinc-700 focus:border-[#098032] focus:ring-1 focus:ring-[#098032]/30 rounded-xl text-white placeholder-zinc-600 text-sm focus:outline-none transition-all"
              autoFocus
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="h-9 px-5 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800 rounded-xl text-zinc-300 hover:text-white text-sm font-semibold transition-all cursor-pointer focus:outline-none"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="h-9 px-5 bg-[#045c22] hover:bg-[#074c1f] rounded-xl text-white text-sm font-semibold transition-all cursor-pointer shadow-sm focus:outline-none border border-transparent"
            >
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});

export default ActualHoursPopUp;

// frontend/app/event/[id]/components/ShowtimeSelector.tsx
import React from 'react';

// Giả định type Showtime đã được định nghĩa ở trang cha
interface Showtime { id: number; start: string; end: string; location: string; description: string | null; ticketClasses: any[]; }

interface ShowtimeSelectorProps {
    showtimes: Showtime[];
    selectedShowtimeId: number | null;
    onSelectShowtime: (id: number) => void;
}

const ShowtimeSelector: React.FC<ShowtimeSelectorProps> = ({
                                                               showtimes,
                                                               selectedShowtimeId,
                                                               onSelectShowtime,
                                                           }) => {
    if (!showtimes || showtimes.length === 0) {
        return <p className="text-center text-gray-500 italic">No available showtimes for this event.</p>;
    }

    const formatDate = (dateString: string) => {
        try {
            const date = new Date(dateString);
            // Customize format as needed (e.g., include year, use 12-hour format)
            return date.toLocaleString('vi-VN', {
                weekday: 'short',
                day: '2-digit',
                month: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
            });
        } catch (e) {
            return "Invalid Date";
        }
    };


    return (
        <div className="p-4 border border-gray-200 rounded-lg bg-white shadow-sm">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">Select Showtime</h2>
            <div className="space-y-2">
                {showtimes.map((st) => (
                    <button
                        key={st.id}
                        onClick={() => onSelectShowtime(st.id)}
                        className={`w-full text-left p-3 rounded-md border transition-colors duration-200 ${
                            selectedShowtimeId === st.id
                                ? 'bg-gray-800 text-white border-gray-800 ring-2 ring-gray-400'
                                : 'bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-700'
                        }`}
                    >
                        <p className="font-medium">{formatDate(st.start)} - {formatDate(st.end)}</p>
                        <p className="text-sm">{st.location}</p>
                        {st.description && <p className="text-xs mt-1 opacity-80">{st.description}</p>}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default ShowtimeSelector;
// frontend/app/event/[id]/components/TicketClassSelector.tsx
import React from 'react';

// Giả định type TicketClass đã định nghĩa
interface TicketClass { id: number; name: string; price: number; quantity: number | null; description: string | null; isActive: boolean; }

interface TicketClassSelectorProps {
    ticketClasses: TicketClass[] | null;
    selectedTicketClassId: number | null;
    onSelectTicketClass: (id: number | null) => void; // Cho phép bỏ chọn
    quantity: number;
    onQuantityChange: (quantity: number) => void;
    // Optional: remainingQuantity?: { [key: number]: number }; // Để hiển thị số lượng còn lại
}

const TicketClassSelector: React.FC<TicketClassSelectorProps> = ({
                                                                     ticketClasses,
                                                                     selectedTicketClassId,
                                                                     onSelectTicketClass,
                                                                     quantity,
                                                                     onQuantityChange,
                                                                 }) => {
    const activeTicketClasses = ticketClasses?.filter(tc => tc.isActive); // Chỉ hiển thị vé đang active

    if (!activeTicketClasses || activeTicketClasses.length === 0) {
        return <p className="text-center text-gray-500 italic p-4">No tickets available for this showtime.</p>;
    }

    const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let newQuantity = parseInt(e.target.value, 10);
        if (isNaN(newQuantity) || newQuantity < 1) {
            newQuantity = 1;
        }
        // Optional: Check against remaining quantity if provided
        onQuantityChange(newQuantity);
    };

    return (
        <div className="p-4 border border-gray-200 rounded-lg bg-white shadow-sm">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">Select Ticket Type</h2>
            <div className="space-y-3">
                {activeTicketClasses.map((tc) => (
                    <div
                        key={tc.id}
                        onClick={() => onSelectTicketClass(tc.id)}
                        className={`p-3 rounded-md border cursor-pointer transition-colors duration-200 flex items-center gap-4 ${
                            selectedTicketClassId === tc.id
                                ? 'bg-gray-100 border-gray-800 ring-2 ring-gray-300'
                                : 'bg-white hover:bg-gray-50 border-gray-200'
                        }`}
                    >
                        {/* Radio button giả */}
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${selectedTicketClassId === tc.id ? 'border-gray-800 bg-gray-800' : 'border-gray-400'}`}>
                            {selectedTicketClassId === tc.id && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                        </div>

                        <div className="flex-grow">
                            <p className="font-medium text-gray-800">{tc.name}</p>
                            <p className="text-sm font-semibold text-gray-900">
                                {tc.price.toLocaleString('vi-VN')} VND
                            </p>
                            {tc.description && <p className="text-xs text-gray-500 mt-1">{tc.description}</p>}
                            {/* Optional: Hiển thị số lượng còn lại */}
                            {/* {tc.quantity !== null && remainingQuantity && remainingQuantity[tc.id] !== undefined && (
                     <p className="text-xs text-orange-600 mt-1">Only {remainingQuantity[tc.id]} left!</p>
                 )} */}
                        </div>

                    </div>
                ))}

                {/* Quantity Selector - chỉ hiện khi đã chọn loại vé */}
                {selectedTicketClassId !== null && (
                    <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-end gap-3">
                        <label htmlFor="ticket-quantity" className="text-sm font-medium text-gray-700">Quantity:</label>
                        <input
                            type="number"
                            id="ticket-quantity"
                            min="1"
                            // Optional: max={maxQuantity based on remaining}
                            value={quantity}
                            onChange={handleQuantityChange}
                            className="w-20 p-2 border border-gray-300 rounded-md text-center text-sm"
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default TicketClassSelector;
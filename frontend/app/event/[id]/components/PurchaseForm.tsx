// frontend/app/event/[id]/components/PurchaseForm.tsx
import React, { useState, useEffect } from 'react';

// Định nghĩa Types (đã cập nhật)
interface FieldOption { id: number; value: string; label: string | null; }
interface FormField {
    id: number;
    label: string;
    type: string;
    required: boolean;
    placeholder: string | null;
    options: FieldOption[];
    displayOrder: number; // <-- ĐÃ THÊM: Thuộc tính này bị thiếu
}

interface PurchaseFormProps {
    formFields: FormField[];
    onSubmit: (formData: Record<string, any>) => void; // Hàm submit nhận dữ liệu form
    isLoading: boolean; // Trạng thái loading từ trang cha
}

const PurchaseForm: React.FC<PurchaseFormProps> = ({ formFields, onSubmit, isLoading }) => {
    const [formData, setFormData] = useState<Record<string, any>>({});
    const [errors, setErrors] = useState<Record<string, string>>({}); // State cho lỗi validation

    // Khởi tạo formData dựa trên fields
    useEffect(() => {
        const initialData: Record<string, any> = {};
        formFields.forEach(field => {
            // Giá trị mặc định cho checkbox là object rỗng để lưu các lựa chọn
            initialData[field.id.toString()] = field.type === 'checkbox' ? {} : '';
        });
        setFormData(initialData);
    }, [formFields]); // Chạy lại khi fields thay đổi

    const handleChange = (fieldId: string, value: any, fieldType: string) => {
        setFormData(prev => {
            if (fieldType === 'checkbox') {
                const currentOptions = prev[fieldId] || {};
                const optionValue = value.target.value; // value của checkbox input
                const isChecked = value.target.checked;
                return {
                    ...prev,
                    [fieldId]: {
                        ...currentOptions,
                        [optionValue]: isChecked,
                    },
                };
            } else {
                return { ...prev, [fieldId]: value };
            }
        });
        // Xóa lỗi khi người dùng bắt đầu nhập
        if (errors[fieldId]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[fieldId];
                return newErrors;
            });
        }
    };

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};
        let isValid = true;

        formFields.forEach(field => {
            if (field.required) {
                const value = formData[field.id.toString()];
                if (field.type === 'checkbox') {
                    // Checkbox required nghĩa là phải chọn ít nhất 1
                    if (!value || Object.values(value).every(v => !v)) {
                        newErrors[field.id.toString()] = `${field.label} is required.`;
                        isValid = false;
                    }
                } else if (!value || String(value).trim() === '') {
                    newErrors[field.id.toString()] = `${field.label} is required.`;
                    isValid = false;
                }
                // Thêm các validation khác nếu cần (email, phone format...)
            }
        });

        setErrors(newErrors);
        return isValid;
    };


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validateForm()) {
            // Xử lý dữ liệu checkbox trước khi gửi
            const processedFormData = { ...formData };
            formFields.forEach(field => {
                if (field.type === 'checkbox') {
                    const selectedOptions = Object.entries(processedFormData[field.id.toString()] || {})
                        .filter(([_, isChecked]) => isChecked)
                        .map(([optionValue, _]) => optionValue);
                    processedFormData[field.id.toString()] = selectedOptions; // Gửi mảng các value đã chọn
                }
            });
            onSubmit(processedFormData); // Gọi hàm submit từ trang cha
        } else {
            console.log("Form validation failed:", errors);
        }
    };

    const renderField = (field: FormField) => {
        const fieldIdStr = field.id.toString();
        const error = errors[fieldIdStr];

        switch (field.type) {
            case 'short_answer':
                return (
                    <input
                        type="text"
                        placeholder={field.placeholder || ''}
                        value={formData[fieldIdStr] || ''}
                        onChange={(e) => handleChange(fieldIdStr, e.target.value, field.type)}
                        required={field.required}
                        className={`mt-1 block w-full px-3 py-2 border ${error ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-gray-500 focus:border-gray-500 sm:text-sm`}
                    />
                );
            case 'long_answer':
                return (
                    <textarea
                        placeholder={field.placeholder || ''}
                        value={formData[fieldIdStr] || ''}
                        onChange={(e) => handleChange(fieldIdStr, e.target.value, field.type)}
                        required={field.required}
                        rows={4}
                        className={`mt-1 block w-full px-3 py-2 border ${error ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-gray-500 focus:border-gray-500 sm:text-sm`}
                    />
                );
            case 'date':
                return (
                    <input
                        type="date"
                        value={formData[fieldIdStr] || ''}
                        onChange={(e) => handleChange(fieldIdStr, e.target.value, field.type)}
                        required={field.required}
                        className={`mt-1 block w-full px-3 py-2 border ${error ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-gray-500 focus:border-gray-500 sm:text-sm`}
                    />
                );
            case 'multiple_choice':
                return (
                    <div className={`mt-1 space-y-2 ${error ? 'p-2 border border-red-500 rounded-md' : ''}`}>
                        {field.options.map(option => (
                            <label key={option.id} className="flex items-center space-x-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name={`field-${field.id}`} // Cần name để nhóm các radio button
                                    value={option.value}
                                    checked={formData[fieldIdStr] === option.value}
                                    onChange={(e) => handleChange(fieldIdStr, e.target.value, field.type)}
                                    required={field.required && field.options.length > 0} // Required chỉ có ý nghĩa nếu có options
                                    className="h-4 w-4 text-gray-600 border-gray-300 focus:ring-gray-500"
                                />
                                <span className="text-sm text-gray-700">{option.label || option.value}</span>
                            </label>
                        ))}
                    </div>
                );
            case 'checkbox':
                return (
                    <div className={`mt-1 space-y-2 ${error ? 'p-2 border border-red-500 rounded-md' : ''}`}>
                        {field.options.map(option => (
                            <label key={option.id} className="flex items-center space-x-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    value={option.value} // Giá trị của checkbox này
                                    checked={!!formData[fieldIdStr]?.[option.value]} // Kiểm tra trong object state
                                    onChange={(e) => handleChange(fieldIdStr, e, field.type)} // Truyền cả event
                                    className="h-4 w-4 rounded text-gray-600 border-gray-300 focus:ring-gray-500"
                                />
                                <span className="text-sm text-gray-700">{option.label || option.value}</span>
                            </label>
                        ))}
                    </div>
                );
            default:
                return <p className="text-xs text-red-500">Unsupported field type: {field.type}</p>;
        }
    };

    return (
        <div className="p-4 border border-gray-200 rounded-lg bg-white shadow-sm">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Attendee Information</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                {formFields
                    // Chỗ này bây giờ sẽ hoạt động chính xác
                    .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
                    .map(field => (
                        <div key={field.id}>
                            <label className="block text-sm font-medium text-gray-700">
                                {field.label}
                                {field.required && <span className="text-red-500 ml-1">*</span>}
                            </label>
                            {renderField(field)}
                            {errors[field.id.toString()] && (
                                <p className="mt-1 text-xs text-red-600">{errors[field.id.toString()]}</p>
                            )}
                        </div>
                    ))}

                {Object.keys(errors).length > 0 && (
                    <p className="text-sm text-red-600">Please fill in all required fields correctly.</p>
                )}

                <div className="pt-4 text-right">
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="bg-gray-800 text-white px-6 py-2 rounded-lg shadow hover:bg-gray-700 disabled:opacity-50"
                    >
                        {isLoading ? 'Processing...' : 'Proceed to Payment'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default PurchaseForm;
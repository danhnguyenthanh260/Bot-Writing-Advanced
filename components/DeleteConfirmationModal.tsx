import React from 'react';

interface DeleteConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    itemName: string;
    itemType: 'dự án' | 'trang';
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({ isOpen, onClose, onConfirm, itemName, itemType }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-slate-800 rounded-lg shadow-xl w-full max-w-md p-6 border border-slate-700">
                <h2 className="text-xl font-bold text-red-400">Xác nhận Xóa</h2>
                <p className="mt-4 text-slate-300">
                    Bạn có chắc chắn muốn xóa {itemType} <strong className="font-semibold text-white">"{itemName}"</strong> không?
                </p>
                {itemType === 'dự án' && (
                    <p className="mt-2 text-sm text-yellow-400">
                        Hành động này sẽ xóa vĩnh viễn dự án và toàn bộ các trang liên quan. Không thể hoàn tác.
                    </p>
                )}
                 {itemType === 'trang' && (
                    <p className="mt-2 text-sm text-yellow-400">
                        Hành động này không thể hoàn tác.
                    </p>
                )}
                <div className="mt-6 flex justify-end space-x-3">
                    <button 
                        onClick={onClose} 
                        className="bg-slate-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-slate-700"
                    >
                        Hủy
                    </button>
                    <button 
                        onClick={onConfirm}
                        className="bg-red-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-red-700"
                    >
                        Xác nhận Xóa
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeleteConfirmationModal;

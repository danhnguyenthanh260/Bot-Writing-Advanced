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
        <div className="fixed inset-0 bg-[rgba(217,230,202,0.85)] backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-[0_25px_65px_rgba(95,111,83,0.25)] w-full max-w-md p-6 border border-[rgba(119,134,103,0.2)]">
                <h2 className="text-xl font-semibold text-[var(--accent-dark)]">Xác nhận Xóa</h2>
                <p className="mt-4 text-[var(--text)]">
                    Bạn có chắc chắn muốn xóa {itemType} <strong className="font-semibold text-[var(--accent)]">"{itemName}"</strong> không?
                </p>
                {itemType === 'dự án' && (
                    <p className="mt-2 text-sm text-[#b35b4f]">
                        Hành động này sẽ xóa vĩnh viễn dự án và toàn bộ các trang liên quan. Không thể hoàn tác.
                    </p>
                )}
                 {itemType === 'trang' && (
                    <p className="mt-2 text-sm text-[#b35b4f]">
                        Hành động này không thể hoàn tác.
                    </p>
                )}
                <div className="mt-6 flex justify-end space-x-3">
                    <button
                        onClick={onClose}
                        className="bg-white border border-[rgba(119,134,103,0.35)] text-[var(--accent-dark)] font-semibold py-2 px-4 rounded-xl hover:bg-[var(--surface-strong)] transition-colors duration-200"
                    >
                        Hủy
                    </button>
                    <button
                        onClick={onConfirm}
                        className="bg-[#b35b4f] text-white font-semibold py-2 px-4 rounded-xl hover:bg-[#a14b42] shadow-[0_12px_30px_rgba(179,91,79,0.35)] transition-colors duration-200"
                    >
                        Xác nhận Xóa
                    </button>
                </div>
            </div>
        </div>
    );
};
export default DeleteConfirmationModal;

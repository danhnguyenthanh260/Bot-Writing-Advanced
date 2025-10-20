import React, { useState, useEffect } from 'react';
import type { CanvasPage } from '../types';
import { SpinnerIcon, CheckCircleIcon } from './icons';

interface PublishModalProps {
    isOpen: boolean;
    onClose: () => void;
    params: {
        platform: string;
        storyUrl: string;
        chapterTitle: string;
        contentSourcePageId: string;
    } | null;
    pages: CanvasPage[];
}

type SimulationStep = 'idle' | 'authenticating' | 'uploading' | 'success';

const PublishModal: React.FC<PublishModalProps> = ({ isOpen, onClose, params, pages }) => {
    const [simulationStep, setSimulationStep] = useState<SimulationStep>('idle');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        // Reset state when the modal is closed or opened
        if (isOpen) {
            setSimulationStep('idle');
            setIsLoading(false);
        }
    }, [isOpen]);

    if (!isOpen || !params) return null;
    
    const sourcePage = pages.find(p => p.id === params.contentSourcePageId);

    const handlePublish = () => {
        setIsLoading(true);
        setSimulationStep('authenticating');

        setTimeout(() => {
            setSimulationStep('uploading');
        }, 1500);

        setTimeout(() => {
            setSimulationStep('success');
        }, 3000);

        setTimeout(() => {
            onClose();
        }, 4500);
    };

    const renderStatus = () => {
        switch (simulationStep) {
            case 'authenticating':
                return <div className="flex items-center text-[var(--accent-dark)]"><SpinnerIcon className="w-5 h-5 mr-2 animate-spin" /> Đang xác thực thông tin đăng nhập...</div>;
            case 'uploading':
                return <div className="flex items-center text-[#b35b4f]"><SpinnerIcon className="w-5 h-5 mr-2 animate-spin" /> Đang tải nội dung chương lên...</div>;
            case 'success':
                return <div className="flex items-center text-[var(--accent)]"><CheckCircleIcon className="w-5 h-5 mr-2" /> Đăng bài thành công!</div>;
            default:
                return null;
        }
    };

    return (
        <div className="fixed inset-0 bg-[rgba(217,230,202,0.85)] backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-[0_30px_70px_rgba(95,111,83,0.22)] w-full max-w-lg p-6 border border-[rgba(119,134,103,0.2)]">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-[var(--accent-dark)]">Chuẩn bị Xuất bản</h2>
                    <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--accent-dark)] transition-colors">&times;</button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wide">Nền tảng</label>
                        <input type="text" readOnly value={params.platform} className="w-full bg-white border border-[rgba(119,134,103,0.25)] rounded-xl p-2 mt-1 text-[var(--text)]"/>
                    </div>
                     <div>
                        <label className="block text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wide">URL Truyện</label>
                        <input type="text" readOnly value={params.storyUrl} className="w-full bg-white border border-[rgba(119,134,103,0.25)] rounded-xl p-2 mt-1 text-[var(--text)]"/>
                    </div>
                     <div>
                        <label className="block text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wide">Tiêu đề Chương</label>
                        <input type="text" readOnly value={params.chapterTitle} className="w-full bg-white border border-[rgba(119,134,103,0.25)] rounded-xl p-2 mt-1 text-[var(--text)]"/>
                    </div>
                     <div>
                        <label className="block text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wide">Nguồn nội dung</label>
                        <input type="text" readOnly value={sourcePage?.title || 'Không tìm thấy trang'} className="w-full bg-white border border-[rgba(119,134,103,0.25)] rounded-xl p-2 mt-1 text-[var(--text)]"/>
                    </div>

                    <div className="border-t border-[rgba(119,134,103,0.2)] my-4"></div>

                    <div>
                        <label className="block text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wide">Tên đăng nhập (Mô phỏng)</label>
                        <input type="text" placeholder="username" className="w-full bg-white border border-[rgba(119,134,103,0.25)] rounded-xl p-2 mt-1 focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)] text-[var(--text)] placeholder:text-[rgba(111,123,100,0.6)]"/>
                    </div>
                     <div>
                        <label className="block text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wide">Mật khẩu (Mô phỏng)</label>
                        <input type="password" placeholder="••••••••" className="w-full bg-white border border-[rgba(119,134,103,0.25)] rounded-xl p-2 mt-1 focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)] text-[var(--text)] placeholder:text-[rgba(111,123,100,0.6)]"/>
                         <p className="text-xs text-[var(--text-muted)] mt-1">(Đây là mô phỏng. Thông tin sẽ không được lưu trữ hay gửi đi đâu.)</p>
                    </div>
                </div>

                <div className="mt-6 h-6">
                    {renderStatus()}
                </div>

                <div className="mt-4 flex justify-end">
                    <button onClick={onClose} disabled={isLoading} className="bg-white border border-[rgba(119,134,103,0.35)] text-[var(--accent-dark)] font-semibold py-2 px-4 rounded-xl mr-2 hover:bg-[var(--surface-strong)] disabled:opacity-50 transition-colors">
                        Hủy
                    </button>
                    <button onClick={handlePublish} disabled={isLoading} className="bg-[var(--accent)] text-white font-semibold py-2 px-4 rounded-xl hover:bg-[var(--accent-dark)] disabled:bg-[rgba(111,123,100,0.45)] disabled:opacity-80 disabled:cursor-not-allowed flex items-center shadow-[0_15px_40px_rgba(95,111,83,0.28)] transition-colors">
                        {isLoading && <SpinnerIcon className="w-5 h-5 mr-2 animate-spin" />}
                        {simulationStep === 'idle' ? 'Xác nhận & Đăng bài' : 'Đang xử lý...'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PublishModal;

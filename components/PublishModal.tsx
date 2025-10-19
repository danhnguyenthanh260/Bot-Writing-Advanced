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
                return <div className="flex items-center text-yellow-400"><SpinnerIcon className="w-5 h-5 mr-2 animate-spin" /> Đang xác thực thông tin đăng nhập...</div>;
            case 'uploading':
                return <div className="flex items-center text-blue-400"><SpinnerIcon className="w-5 h-5 mr-2 animate-spin" /> Đang tải nội dung chương lên...</div>;
            case 'success':
                return <div className="flex items-center text-green-400"><CheckCircleIcon className="w-5 h-5 mr-2" /> Đăng bài thành công!</div>;
            default:
                return null;
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-slate-800 rounded-lg shadow-xl w-full max-w-lg p-6 border border-slate-700">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Chuẩn bị Xuất bản</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white">&times;</button>
                </div>
                
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-400">Nền tảng</label>
                        <input type="text" readOnly value={params.platform} className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 mt-1"/>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-400">URL Truyện</label>
                        <input type="text" readOnly value={params.storyUrl} className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 mt-1"/>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-400">Tiêu đề Chương</label>
                        <input type="text" readOnly value={params.chapterTitle} className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 mt-1"/>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-400">Nguồn nội dung</label>
                        <input type="text" readOnly value={sourcePage?.title || 'Không tìm thấy trang'} className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 mt-1"/>
                    </div>

                    <div className="border-t border-slate-700 my-4"></div>

                    <div>
                        <label className="block text-sm font-medium text-slate-400">Tên đăng nhập (Mô phỏng)</label>
                        <input type="text" placeholder="username" className="w-full bg-slate-900 border border-slate-600 rounded-md p-2 mt-1 focus:ring-cyan-500 focus:border-cyan-500"/>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-400">Mật khẩu (Mô phỏng)</label>
                        <input type="password" placeholder="••••••••" className="w-full bg-slate-900 border border-slate-600 rounded-md p-2 mt-1 focus:ring-cyan-500 focus:border-cyan-500"/>
                         <p className="text-xs text-slate-500 mt-1">(Đây là mô phỏng. Thông tin sẽ không được lưu trữ hay gửi đi đâu.)</p>
                    </div>
                </div>

                <div className="mt-6 h-6">
                    {renderStatus()}
                </div>

                <div className="mt-4 flex justify-end">
                    <button onClick={onClose} disabled={isLoading} className="bg-slate-600 text-white font-semibold py-2 px-4 rounded-lg mr-2 hover:bg-slate-700 disabled:opacity-50">
                        Hủy
                    </button>
                    <button onClick={handlePublish} disabled={isLoading} className="bg-cyan-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center">
                        {isLoading && <SpinnerIcon className="w-5 h-5 mr-2 animate-spin" />}
                        {simulationStep === 'idle' ? 'Xác nhận & Đăng bài' : 'Đang xử lý...'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PublishModal;

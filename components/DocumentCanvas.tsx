import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import type { CanvasBlock, CanvasPage, Message } from '../types';
import { PageChatBlock } from './ChatWidget';
import ReactMarkdown from 'react-markdown';

export interface DocumentCanvasHandle {
  focusOn: (id: string, type: 'page' | 'block' | 'chat') => void;
}

interface DocumentCanvasProps {
    pages: CanvasPage[];
    setPages: React.Dispatch<React.SetStateAction<CanvasPage[]>>;
    blocks: CanvasBlock[];
    setBlocks: React.Dispatch<React.SetStateAction<CanvasBlock[]>>;
    messages: Message[];
    chatPage: { id: string; position: { x: number; y: number }; size: { width: number; height: number } };
    setChatPage: React.Dispatch<React.SetStateAction<{ id: string; position: { x: number; y: number }; size: { width: number; height: number } }>>;
    onCreateMindMap?: (pageId: string) => void;
    onCreateQuiz?: (pageId: string) => void;
    isReadOnly?: boolean;
}

type DraggingInfo = { id: string; type: 'block' | 'page' | 'chat'; offset: { x: number; y: number } };
type ResizingInfo = { id: string; type: 'block' | 'page' | 'chat'; initialPos: { x: number; y: number }; initialSize: { width: number; height: number } };

export const DocumentCanvas = forwardRef<DocumentCanvasHandle, DocumentCanvasProps>(({ pages, setPages, blocks, setBlocks, messages, chatPage, setChatPage, onCreateMindMap, onCreateQuiz, isReadOnly = false }, ref) => {
    const [scale, setScale] = useState(1);
    const [viewOffset, setViewOffset] = useState({ x: 0, y: 0 });
    const [draggingInfo, setDraggingInfo] = useState<DraggingInfo | null>(null);
    const [resizingInfo, setResizingInfo] = useState<ResizingInfo | null>(null);
    const [isPanning, setIsPanning] = useState(false);
    const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
    const [editText, setEditText] = useState('');
    const [highlightedElement, setHighlightedElement] = useState<{ id: string, type: string } | null>(null);
    
    const canvasRef = useRef<HTMLDivElement>(null);
    const elementRefs = useRef<Map<string, HTMLDivElement | null>>(new Map());
    const highlightTimeoutRef = useRef<number | null>(null);

    useImperativeHandle(ref, () => ({
        focusOn: (id, type) => {
            if (highlightTimeoutRef.current) {
                clearTimeout(highlightTimeoutRef.current);
            }

            const element = type === 'page' ? pages.find(p => p.id === id) :
                            type === 'block' ? blocks.find(b => b.id === id) :
                            chatPage;
            if (!element || !canvasRef.current) return;

            setHighlightedElement({ id, type });
            highlightTimeoutRef.current = window.setTimeout(() => {
                setHighlightedElement(null);
            }, 1500); // Highlight for 1.5 seconds

            const canvasRect = canvasRef.current.getBoundingClientRect();
            const targetScale = 1.1;
            const targetX = -element.position.x * targetScale + (canvasRect.width / 2) - (element.size.width / 2 * targetScale);
            const targetY = -element.position.y * targetScale + (canvasRect.height / 2) - (element.size.height / 2 * targetScale);
            
            const startOffset = { ...viewOffset };
            const startScale = scale;
            const startTime = Date.now();
            const duration = 600; // ms

            const animate = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const ease = 0.5 - 0.5 * Math.cos(progress * Math.PI);

                setViewOffset({
                    x: startOffset.x + (targetX - startOffset.x) * ease,
                    y: startOffset.y + (targetY - startOffset.y) * ease,
                });
                setScale(startScale + (targetScale - startScale) * ease);
                
                if (progress < 1) {
                    requestAnimationFrame(animate);
                }
            };
            requestAnimationFrame(animate);
        }
    }));

    const handleWheel = (e: React.WheelEvent) => {
        if (!canvasRef.current) return;
        e.preventDefault();
        const rect = canvasRef.current.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const mouseCanvasXBefore = (mouseX - viewOffset.x) / scale;
        const mouseCanvasYBefore = (mouseY - viewOffset.y) / scale;

        const newScale = scale - e.deltaY * 0.001;
        const finalScale = Math.min(Math.max(0.2, newScale), 3);
        
        const newOffsetX = mouseX - mouseCanvasXBefore * finalScale;
        const newOffsetY = mouseY - mouseCanvasYBefore * finalScale;
        
        setScale(finalScale);
        setViewOffset({ x: newOffsetX, y: newOffsetY });
    };

    const handleBackgroundMouseDown = (e: React.MouseEvent) => {
        if (e.target === canvasRef.current) {
            setIsPanning(true);
        }
    }

    const handleMouseDown = (e: React.MouseEvent, id: string, type: 'block' | 'page' | 'chat') => {
        if (isReadOnly || editingBlockId || resizingInfo) return;
        
        const element = type === 'page' ? pages.find(p => p.id === id) 
                      : type === 'block' ? blocks.find(b => b.id === id) 
                      : chatPage;

        if (!element || !canvasRef.current) return;

        e.stopPropagation();
        const canvasRect = canvasRef.current.getBoundingClientRect();
        const mouseX = (e.clientX - canvasRect.left - viewOffset.x) / scale;
        const mouseY = (e.clientY - canvasRect.top - viewOffset.y) / scale;
        
        setDraggingInfo({ id, type, offset: { x: mouseX - element.position.x, y: mouseY - element.position.y } });
    };

    const handleResizeMouseDown = (e: React.MouseEvent, id: string, type: 'block' | 'page' | 'chat') => {
        if (isReadOnly) return;
        e.stopPropagation();
        
        const element = type === 'page' ? pages.find(p => p.id === id) 
                      : type === 'block' ? blocks.find(b => b.id === id) 
                      : chatPage;
        if (!element) return;
        
        setResizingInfo({ 
            id, type, 
            initialPos: { x: e.clientX, y: e.clientY },
            initialSize: element.size
        });
    }

    const handleDoubleClick = (block: CanvasBlock) => {
        if (isReadOnly) return;
        setEditingBlockId(block.id);
        setEditText(block.content);
    };

    const handleEditChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setEditText(e.target.value);
    };

    const handleEditBlur = () => {
        if (editingBlockId) {
            setBlocks(prevBlocks => prevBlocks.map(b => b.id === editingBlockId ? { ...b, content: editText } : b));
        }
        setEditingBlockId(null);
        setEditText('');
    };

    useEffect(() => {
        const moveHandler = (e: MouseEvent) => {
            if (!canvasRef.current) return;
            const canvasRect = canvasRef.current.getBoundingClientRect();

            if(isPanning) {
                setViewOffset(prev => ({ x: prev.x + e.movementX, y: prev.y + e.movementY }));
            } else if (draggingInfo) {
                const newX = (e.clientX - canvasRect.left - viewOffset.x) / scale - draggingInfo.offset.x;
                const newY = (e.clientY - canvasRect.top - viewOffset.y) / scale - draggingInfo.offset.y;

                switch (draggingInfo.type) {
                    case 'block':
                        setBlocks(prev => prev.map(b => b.id === draggingInfo.id ? { ...b, position: { x: newX, y: newY } } : b));
                        break;
                    case 'page':
                        setPages(prev => prev.map(p => p.id === draggingInfo.id ? { ...p, position: { x: newX, y: newY } } : p));
                        break;
                    case 'chat':
                        setChatPage(prev => ({ ...prev, position: { x: newX, y: newY } }));
                        break;
                }
            } else if (resizingInfo) {
                const dx = (e.clientX - resizingInfo.initialPos.x) / scale;
                const dy = (e.clientY - resizingInfo.initialPos.y) / scale;
                const newWidth = Math.max(resizingInfo.initialSize.width + dx, 250);
                const newHeight = Math.max(resizingInfo.initialSize.height + dy, 200);

                 switch (resizingInfo.type) {
                    case 'block':
                        setBlocks(prev => prev.map(b => b.id === resizingInfo.id ? { ...b, size: { width: newWidth, height: newHeight } } : b));
                        break;
                    case 'page':
                        setPages(prev => prev.map(p => p.id === resizingInfo.id ? { ...p, size: { width: newWidth, height: newHeight } } : p));
                        break;
                    case 'chat':
                        setChatPage(prev => ({ ...prev, size: { width: newWidth, height: newHeight } }));
                        break;
                }
            }
        };
        
        const upHandler = () => {
            setDraggingInfo(null);
            setResizingInfo(null);
            setIsPanning(false);
        };

        if (draggingInfo || resizingInfo || isPanning) {
            window.addEventListener('mousemove', moveHandler);
            window.addEventListener('mouseup', upHandler);
        }

        return () => {
            window.removeEventListener('mousemove', moveHandler);
            window.removeEventListener('mouseup', upHandler);
        };
    }, [draggingInfo, resizingInfo, isPanning, scale, viewOffset, setBlocks, setPages, setChatPage]);
    
    // Mind map line drawing logic
    const renderConnections = () => {
        if (!isReadOnly) return null;
        
        const blockMap = new Map(blocks.map(b => [b.id, b]));
        return blocks.map(block => {
            if (!block.parentId || !blockMap.has(block.parentId)) return null;

            const parentBlock = blockMap.get(block.parentId)!;
            const childEl = elementRefs.current.get(block.id);
            const parentEl = elementRefs.current.get(block.parentId);

            if (!childEl || !parentEl) return null;

            const x1 = parentBlock.position.x + parentEl.offsetWidth / 2;
            const y1 = parentBlock.position.y + parentEl.offsetHeight / 2;
            const x2 = block.position.x + childEl.offsetWidth / 2;
            const y2 = block.position.y + childEl.offsetHeight / 2;

            return <line key={`${block.parentId}-${block.id}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#475569" strokeWidth="2" />;
        });
    };

    const renderKnowledgeBlock = (block: CanvasBlock) => (
         <div
            key={block.id}
            ref={el => { el ? elementRefs.current.set(block.id, el) : elementRefs.current.delete(block.id); }}
            onMouseDown={(e) => handleMouseDown(e, block.id, 'block')}
            onDoubleClick={() => handleDoubleClick(block)}
            className={`p-3 rounded-md shadow-md bg-slate-800/80 border border-slate-700 hover:border-cyan-500 cursor-grab transition-all duration-300 ${highlightedElement?.id === block.id ? 'ring-2 ring-yellow-400' : ''}`}
            style={{ 
                position: 'absolute',
                left: `${block.position.x}px`, 
                top: `${block.position.y}px`,
                width: `${block.size.width}px`,
                height: `${block.size.height}px`,
             }}
        >
            {editingBlockId === block.id ? (
                <textarea value={editText} onChange={handleEditChange} onBlur={handleEditBlur} className="w-full h-full bg-slate-600 outline-none resize-none p-1 rounded" autoFocus />
            ) : (
                <div className="w-full h-full overflow-auto scrollbar-thin prose prose-sm prose-invert prose-p:my-1"><ReactMarkdown>{block.content}</ReactMarkdown></div>
            )}
             <div onMouseDown={(e) => handleResizeMouseDown(e, block.id, 'block')} className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize hover:bg-cyan-400 border-2 border-slate-800 rounded-full" style={{transform: 'translate(50%, 50%)'}} />
        </div>
    )

    return (
        <div 
            ref={canvasRef}
            className={`w-full h-full bg-slate-800 overflow-hidden relative ${isPanning ? 'cursor-grabbing' : 'cursor-grab'}`}
            onWheel={handleWheel}
            onMouseDown={handleBackgroundMouseDown}
            style={{ backgroundSize: `${20 * scale}px ${20 * scale}px`, backgroundImage: 'radial-gradient(circle, #475569 1px, rgba(0,0,0,0) 1px)'}}
        >
            <div className="transform-origin-top-left absolute top-0 left-0" style={{ transform: `translate(${viewOffset.x}px, ${viewOffset.y}px) scale(${scale})` }}>
                 <svg width="10000" height="10000" className="absolute top-0 left-0 pointer-events-none">{isReadOnly && renderConnections()}</svg>
                
                {isReadOnly ? blocks.map(block => (
                    <div
                        key={block.id}
                        ref={el => { el ? elementRefs.current.set(block.id, el) : elementRefs.current.delete(block.id); }}
                        className="absolute p-4 rounded-lg shadow-xl min-w-[200px] max-w-[300px] bg-slate-700/80 backdrop-blur-sm border border-slate-600"
                        style={{ left: `${block.position.x}px`, top: `${block.position.y}px` }}
                    >
                         <div className="prose prose-sm prose-invert"><ReactMarkdown>{block.content}</ReactMarkdown></div>
                    </div>
                )) : 
                (
                    <>
                        <PageChatBlock 
                            id={chatPage.id}
                            position={chatPage.position}
                            size={chatPage.size}
                            messages={messages}
                            onMouseDown={(e) => handleMouseDown(e, chatPage.id, 'chat')}
                            onResizeMouseDown={(e) => handleResizeMouseDown(e, chatPage.id, 'chat')}
                            isHighlighted={highlightedElement?.id === chatPage.id}
                        />

                        {pages.map(page => (
                            <div key={page.id} className={`absolute group transition-all duration-300 ${highlightedElement?.id === page.id ? 'ring-4 ring-offset-4 ring-offset-slate-800 ring-yellow-400 rounded-xl' : ''}`} style={{
                                left: `${page.position.x}px`, 
                                top: `${page.position.y}px`,
                                width: `${page.size.width}px`,
                                height: `${page.size.height}px`,
                            }}>
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:-translate-y-1 translate-y-3 pointer-events-none group-hover:pointer-events-auto z-20">
                                     <button onClick={() => onCreateMindMap?.(page.id)} className="text-xs bg-cyan-500 hover:bg-cyan-400 text-white font-semibold px-4 py-2 rounded-full shadow-lg whitespace-nowrap">Mind Map</button>
                                     <button onClick={() => onCreateQuiz?.(page.id)} className="text-xs bg-purple-500 hover:bg-purple-400 text-white font-semibold px-4 py-2 rounded-full shadow-lg whitespace-nowrap">Quiz</button>
                                </div>

                                <div
                                    ref={el => { el ? elementRefs.current.set(page.id, el) : elementRefs.current.delete(page.id); }}
                                    onMouseDown={(e) => handleMouseDown(e, page.id, 'page')}
                                    className={`w-full h-full p-4 rounded-lg shadow-2xl bg-slate-900/70 backdrop-blur-sm border border-slate-600 text-white select-none transition-shadow duration-200 group-hover:shadow-cyan-500/20 flex flex-col ${draggingInfo?.id === page.id ? 'ring-2 ring-cyan-400 z-10 cursor-grabbing' : 'cursor-grab'}`}
                                >
                                    <div className="font-bold text-lg mb-2 p-2 border-b border-slate-700 flex justify-between items-center">
                                       <span>{page.title}</span>
                                    </div>
                                    <div className="relative flex-1">
                                        {blocks.filter(b => b.pageId === page.id).map(block => renderKnowledgeBlock(block))}
                                    </div>
                                    <div onMouseDown={(e) => handleResizeMouseDown(e, page.id, 'page')} className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize hover:bg-cyan-400 border-2 border-slate-900 rounded-full" style={{transform: 'translate(50%, 50%)'}}/>
                                </div>
                            </div>
                        ))}
                    </>
                )}
            </div>
            {!isReadOnly && <div className="absolute bottom-4 right-4 bg-slate-900/70 backdrop-blur-sm rounded-lg p-1 flex items-center gap-2 text-sm text-white border border-slate-700 z-20">
                <button onClick={() => setScale(s => Math.max(0.2, s - 0.1))} className="px-3 py-1 rounded hover:bg-slate-700">-</button>
                <span className="w-12 text-center">{Math.round(scale * 100)}%</span>
                <button onClick={() => setScale(s => Math.min(3, s + 0.1))} className="px-3 py-1 rounded hover:bg-slate-700">+</button>
                <button onClick={() => { setScale(1); setViewOffset({x:0, y:0})}} className="px-3 py-1 rounded hover:bg-slate-700">Reset</button>
            </div>}
        </div>
    );
});

export default DocumentCanvas;
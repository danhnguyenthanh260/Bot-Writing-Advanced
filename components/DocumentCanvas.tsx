import React, { useImperativeHandle, forwardRef, useRef } from 'react';
import { Rnd } from 'react-rnd';
import type { CanvasPage, Message } from '../types';
import ChatWidget from './ChatWidget';
import ReactMarkdown from 'react-markdown';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';

export interface DocumentCanvasHandle {
    focusOn: (id: string, type: 'page' | 'chat') => void;
}

interface DocumentCanvasProps {
    pages: CanvasPage[];
    setPages: React.Dispatch<React.SetStateAction<CanvasPage[]>>;
    messages: Message[];
    chatPage: CanvasPage;
    setChatPage: React.Dispatch<React.SetStateAction<CanvasPage>>;
}

const DocumentCanvas = forwardRef<DocumentCanvasHandle, DocumentCanvasProps>(
    ({ pages, setPages, messages, chatPage, setChatPage }, ref) => {

        const transformComponentRef = useRef(null);

        useImperativeHandle(ref, () => ({
            focusOn: (id: string, type: 'page' | 'chat') => {
                if (!transformComponentRef.current) return;
                
                const component = transformComponentRef.current;
                const targetPage = type === 'page' ? pages.find(p => p.id === id) : chatPage;

                if (targetPage) {
                    const { x, y } = targetPage.position;
                    const { width, height } = targetPage.size;

                    // @ts-ignore
                    component.setTransform(
                        -x + window.innerWidth / 2 - width / 2, // center horizontally
                        -y + window.innerHeight / 2 - height / 2, // center vertically
                        1, // zoom level
                        100 // animation time
                    );
                }
            },
        }));
        
        const handleDragStop = (id: string, d: any) => {
            if (id === chatPage.id) {
                setChatPage(prev => ({ ...prev, position: { x: d.x, y: d.y } }));
            } else {
                setPages(pages.map(p => p.id === id ? { ...p, position: { x: d.x, y: d.y } } : p));
            }
        };

        const handleResizeStop = (id: string, ref: HTMLElement, position: any) => {
             if (id === chatPage.id) {
                const newSize = { width: ref.offsetWidth, height: ref.offsetHeight };
                setChatPage(prev => ({ ...prev, size: newSize, position }));
            } else {
                // For pages, only update width. Height is auto.
                const newWidth = ref.offsetWidth;
                setPages(pages.map(p => p.id === id ? { ...p, size: { ...p.size, width: newWidth }, position } : p));
                // Ensure RND component respects the auto height from content after resize
                ref.style.height = 'auto';
            }
        };
        
      return (
            <div className="w-full h-full overflow-hidden bg-[var(--background)] bg-[radial-gradient(circle_at_top,_rgba(119,134,103,0.15),transparent_55%)] [background-size:480px_480px]">
                <TransformWrapper
                    ref={transformComponentRef}
                    initialScale={1}
                    initialPositionX={0}
                    initialPositionY={0}
                    minScale={0.2}
                    maxScale={2.5}
                    limitToBounds={false}
                    panning={{ disabled: false, velocityDisabled: true }}
                    wheel={{ step: 0.1 }}
                >
                    <TransformComponent wrapperClass="!w-full !h-full" contentClass="!w-full !h-full">
                        <div className="relative w-[5000px] h-[5000px]">
                            {/* Render Pages */}
                            {pages.map(page => (
                                <Rnd
                                    key={page.id}
                                    size={{ width: page.size.width, height: 'auto' }}
                                    position={{ x: page.position.x, y: page.position.y }}
                                    onDragStop={(e, d) => handleDragStop(page.id, d)}
                                    onResizeStop={(e, direction, ref, delta, position) => handleResizeStop(page.id, ref, position)}
                                    minWidth={200}
                                    bounds="parent"
                                    className="rounded-2xl overflow-hidden border border-[rgba(119,134,103,0.28)] bg-white/95 shadow-[0_25px_60px_rgba(95,111,83,0.16)] backdrop-blur-sm transition-all duration-200 hover:shadow-[0_28px_70px_rgba(95,111,83,0.22)]"
                                    dragHandleClassName="handle"
                                    enableResizing={{
                                        top: false,
                                        right: true,
                                        bottom: false,
                                        left: true,
                                        topRight: false,
                                        bottomRight: false,
                                        bottomLeft: false,
                                        topLeft: false,
                                    }}
                                >
                                    <div className="flex flex-col h-full">
                                        <div className="p-4 bg-[var(--accent)]/90 text-white font-semibold cursor-move handle flex items-center justify-between">
                                            {page.title}
                                        </div>
                                        {/* FIX: The `className` prop is not valid on `ReactMarkdown`. Moved prose classes to the parent div. */}
                                        <div className="p-4 flex-1 prose prose-sm max-w-none text-[var(--text)] prose-headings:text-[var(--accent-dark)] prose-a:text-[var(--accent)]">
                                            <ReactMarkdown>
                                                {page.content}
                                            </ReactMarkdown>
                                        </div>
                                    </div>
                                </Rnd>
                            ))}

                            {/* Render Chat Widget */}
                            <Rnd
                                key={chatPage.id}
                                size={{ width: chatPage.size.width, height: chatPage.size.height }}
                                position={{ x: chatPage.position.x, y: chatPage.position.y }}
                                onDragStop={(e, d) => handleDragStop(chatPage.id, d)}
                                onResizeStop={(e, direction, ref, delta, position) => handleResizeStop(chatPage.id, ref, position)}
                                minWidth={300}
                                minHeight={400}
                                bounds="parent"
                                className="rounded-2xl overflow-hidden border border-[var(--accent)] shadow-[0_25px_60px_rgba(95,111,83,0.22)] backdrop-blur-sm"
                                dragHandleClassName="handle"
                            >
                                <ChatWidget messages={messages} />
                            </Rnd>
                        </div>
                    </TransformComponent>
                </TransformWrapper>
            </div>
        );
    }
);
export default DocumentCanvas;
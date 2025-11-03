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
    isChatOpen?: boolean;
    onChatClose?: () => void;
}

const DocumentCanvas = forwardRef<DocumentCanvasHandle, DocumentCanvasProps>(
    ({ pages, setPages, messages, chatPage, setChatPage, isChatOpen = false, onChatClose }, ref) => {

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
                setPages(prev => prev.map(p => p.id === id ? { ...p, position: { x: d.x, y: d.y } } : p));
            }
        };

        const handleResizeStop = (id: string, ref: HTMLElement, position: any) => {
            if (id === chatPage.id) {
                const newSize = { width: ref.offsetWidth, height: ref.offsetHeight };
                setChatPage(prev => ({ ...prev, size: newSize, position }));
            } else {
                // For pages, only update width. Height is auto.
                const newWidth = ref.offsetWidth;
                setPages(prev => prev.map(p => p.id === id ? { ...p, size: { ...p.size, width: newWidth }, position } : p));
                // Ensure RND component respects the auto height from content after resize
                ref.style.height = 'auto';
            }
        };
        
      return (
            <div className="w-full h-full overflow-hidden bg-[var(--color-bg)]">
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
                                    className="rounded-2xl overflow-hidden border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-lg)] backdrop-blur-sm transition-all duration-200 hover:shadow-[var(--shadow-xl)] hover:-translate-y-0.5"
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
                                        <div 
                                            className="px-4 py-3 bg-[var(--color-primary)] text-[var(--color-text-on-primary)] font-semibold cursor-move handle flex items-center justify-between"
                                            style={{ 
                                                fontFamily: 'var(--font-serif)',
                                                fontSize: 'var(--text-xl)',
                                                letterSpacing: 'var(--tracking-tight)'
                                            }}
                                        >
                                            {page.title}
                                        </div>
                                        <div 
                                            className="px-6 py-6 flex-1 prose prose-sm max-w-none"
                                            style={{
                                                fontFamily: 'var(--font-sans)',
                                                fontSize: 'var(--text-base)',
                                                lineHeight: 'var(--leading-relaxed)',
                                                color: 'var(--color-text)',
                                                maxWidth: '65ch'
                                            }}
                                        >
                                            <style>{`
                                                .prose h1, .prose h2, .prose h3 {
                                                    font-family: var(--font-serif);
                                                    color: var(--color-text);
                                                    font-weight: var(--font-semibold);
                                                }
                                                .prose h1 { font-size: var(--text-2xl); margin-top: 1.5em; margin-bottom: 0.75em; }
                                                .prose h2 { font-size: var(--text-xl); margin-top: 1.25em; margin-bottom: 0.5em; }
                                                .prose h3 { font-size: var(--text-lg); margin-top: 1em; margin-bottom: 0.5em; }
                                                .prose p { margin-top: 1em; margin-bottom: 1.5em; }
                                                .prose a { color: var(--color-primary); text-decoration: underline; text-underline-offset: 2px; }
                                                .prose a:hover { color: var(--color-primary-dark); }
                                                .prose code { font-family: var(--font-mono); background-color: var(--color-bg-soft); padding: 0.125em 0.375em; border-radius: 0.25rem; }
                                                .prose pre { background-color: var(--color-bg-soft); padding: 1em; border-radius: 0.5rem; overflow-x: auto; }
                                                .prose blockquote { border-left: 4px solid var(--color-primary); padding-left: 1em; font-style: italic; color: var(--color-text-muted); }
                                            `}</style>
                                            <ReactMarkdown>
                                                {page.content}
                                            </ReactMarkdown>
                                        </div>
                                    </div>
                                </Rnd>
                            ))}

                            {/* Render Chat Widget - Only when isChatOpen */}
                            {isChatOpen && (
                                <Rnd
                                    key={chatPage.id}
                                    size={{ width: chatPage.size.width, height: chatPage.size.height }}
                                    position={{ x: chatPage.position.x, y: chatPage.position.y }}
                                    onDragStop={(e, d) => handleDragStop(chatPage.id, d)}
                                    onResizeStop={(e, direction, ref, delta, position) => handleResizeStop(chatPage.id, ref, position)}
                                    minWidth={300}
                                    minHeight={400}
                                    bounds="parent"
                                    className="rounded-2xl overflow-hidden border border-[var(--color-primary)] shadow-[var(--shadow-xl)] backdrop-blur-sm"
                                    dragHandleClassName="handle"
                                >
                                    <ChatWidget messages={messages} onClose={onChatClose} />
                                </Rnd>
                            )}
                        </div>
                    </TransformComponent>
                </TransformWrapper>
            </div>
        );
    }
);
export default DocumentCanvas;
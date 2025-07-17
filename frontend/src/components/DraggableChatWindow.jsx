import React, { useState, useEffect, useRef } from 'react';
import Draggable from 'react-draggable';
import ReactMarkdown from 'react-markdown';
import { useChat } from '../hooks/useChat';
import './DraggableChatWindow.css';
import { FiMaximize, FiMinimize, FiX } from 'react-icons/fi';

const DraggableChatWindow = () => {
    const [viewMode, setViewMode] = useState('minimized');
    const [inputValue, setInputValue] = useState('');
    const [position, setPosition] = useState(null);
    const { messages, isLoading, error, sendMessage, fetchMoreHistory, isFetchingMore } = useChat();
    const chatBodyRef = useRef(null);
    const nodeRef = useRef(null);

    useEffect(() => {
        if (chatBodyRef.current && !isFetchingMore) {
            const { scrollHeight, clientHeight } = chatBodyRef.current;
            chatBodyRef.current.scrollTop = scrollHeight - clientHeight;
        }
    }, [messages, isFetchingMore]);

    useEffect(() => {
        if (viewMode === 'normal' && position === null) {
            const windowWidth = 350;
            const windowHeight = 500;
            const x = window.innerWidth - windowWidth - 20;
            const y = window.innerHeight - windowHeight - 20;
            setPosition({ x, y });
        }
    }, [viewMode, position]);

    const handleSendMessage = () => {
        if (!inputValue.trim()) return;
        sendMessage(inputValue);
        setInputValue('');
    };

    const handleKeyPress = (event) => {
        if (event.key === 'Enter') handleSendMessage();
    };

    const handleScroll = (e) => {
        if (e.target.scrollTop === 0 && !isLoading && !isFetchingMore) fetchMoreHistory();
    };

    const handleMaximizeToggle = () => {
        setViewMode(prevMode => prevMode === 'maximized' ? 'normal' : 'maximized');
    };

    const handleMinimize = () => {
        setViewMode('minimized');
    };

    const handleRestoreFromIcon = () => {
        setViewMode('normal');
    };

    const handleDragStop = (e, data) => {
        setPosition({ x: data.x, y: data.y });
    };

    const ChatWindowContent = (
        <>
            <div className="chat-header">
                <span>Chat Support</span>
                <div className="chat-header-buttons">
                    <button className="chat-header-btn" onClick={handleMaximizeToggle}>
                        {viewMode === 'maximized' ? <FiMinimize /> : <FiMaximize />}
                    </button>
                    <button className="chat-header-btn" onClick={handleMinimize}>
                        <FiX />
                    </button>
                </div>
            </div>
            <div className="chat-body" ref={chatBodyRef} onScroll={handleScroll}>
                {isFetchingMore && <div className="chat-info">Đang tải tin nhắn cũ...</div>}
                {isLoading && <div className="chat-info">Đang tải lịch sử...</div>}
                {error && <div className="chat-info error">{error}</div>}
                {messages.map((message) => (
                    <div key={message.id} className={`chat-message ${message.user.toLowerCase()}`}>
                        <div className="message-content"><ReactMarkdown>{message.text}</ReactMarkdown></div>
                    </div>
                ))}
            </div>
            <div className="chat-footer">
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Nhập tin nhắn..."
                    disabled={isLoading}
                />
                <button onClick={handleSendMessage} disabled={isLoading}>Gửi</button>
            </div>
        </>
    );

    if (viewMode === 'minimized') {
        return (
            <div className="chat-icon-container" onClick={handleRestoreFromIcon}>
                💬
            </div>
        );
    }

    if (viewMode === 'maximized') {
        return (
            <div className="maximized-overlay">
                <div className="chat-window-maximized">
                    {ChatWindowContent}
                </div>
            </div>
        );
    }

    if (viewMode === 'normal' && position !== null) {
        return (
            <Draggable
                nodeRef={nodeRef}
                handle=".chat-header"
                onStop={handleDragStop}
                position={position}
            >
                <div className="chat-window-draggable" ref={nodeRef}>
                    {ChatWindowContent}
                </div>
            </Draggable>
        );
    }

    return null;
};

export default DraggableChatWindow;
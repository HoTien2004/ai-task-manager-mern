// components/DraggableChatWindow.jsx

import React, { useState, useEffect, useRef } from 'react'; // 1. Thêm useRef vào import
import Draggable from 'react-draggable';
import ReactMarkdown from 'react-markdown';
import { useChat } from '../hooks/useChat';
import './DraggableChatWindow.css';

const DraggableChatWindow = () => {
    const [isMinimized, setIsMinimized] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const { messages, isLoading, error, sendMessage } = useChat();
    const chatBodyRef = useRef(null);

    const nodeRef = useRef(null); // 2. Tạo một ref cho Draggable

    useEffect(() => {
        if (chatBodyRef.current) {
            chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSendMessage = () => {
        if (!inputValue.trim()) return;
        sendMessage(inputValue);
        setInputValue('');
    };

    const handleKeyPress = (event) => {
        if (event.key === 'Enter') {
            handleSendMessage();
        }
    };

    if (isMinimized) {
        return (
            <div className="chat-icon-container" onClick={() => setIsMinimized(false)}>
                💬
            </div>
        );
    }

    return (
        // 3. Truyền nodeRef vào component Draggable
        <Draggable nodeRef={nodeRef} handle=".chat-header">
            {/* 4. Gán ref vào phần tử DOM chính mà bạn muốn kéo */}
            <div className="chat-window" ref={nodeRef}>
                <div className="chat-header">
                    <span>Chat Support</span>
                    <button onClick={() => setIsMinimized(true)} className="minimize-btn">-</button>
                </div>
                <div className="chat-body" ref={chatBodyRef}>
                    {isLoading && <div className="chat-info">Đang tải lịch sử...</div>}
                    {error && <div className="chat-info error">{error}</div>}
                    {!isLoading && !error && messages.length === 0 && (
                        <div className="chat-info">Bắt đầu cuộc trò chuyện của bạn!</div>
                    )}
                    {messages.map((message) => (
                        <div key={message.id} className={`chat-message ${message.user.toLowerCase()}`}>
                            <div className="message-content">
                                <ReactMarkdown>{message.text}</ReactMarkdown>
                            </div>
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
            </div>
        </Draggable>
    );
};

export default DraggableChatWindow;
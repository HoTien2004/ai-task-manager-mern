import React, { useState, useEffect, useRef } from 'react';
import Draggable from 'react-draggable';
import ReactMarkdown from 'react-markdown';
import { useChat } from '../hooks/useChat'; // Import the custom hook
import './DraggableChatWindow.css';

const DraggableChatWindow = () => {
    const [isMinimized, setIsMinimized] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const { messages, isLoading, error, sendMessage } = useChat();
    const chatBodyRef = useRef(null);

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
        <Draggable handle=".chat-header">
            <div className="chat-window">
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
import React, { useState, useEffect, useRef } from 'react';
import Draggable from 'react-draggable';
import ReactMarkdown from 'react-markdown';
import { useChat } from '../hooks/useChat';
import './DraggableChatWindow.css';
import { FiMaximize, FiMinimize, FiX, FiChevronDown, FiChevronUp, FiTrash2, FiLoader } from 'react-icons/fi';

const DraggableChatWindow = () => {
    const [viewMode, setViewMode] = useState('minimized');
    const [inputValue, setInputValue] = useState('');
    const [isHistoryVisible, setIsHistoryVisible] = useState(false);

    const {
        messages, isLoading, error, sendMessage,
        conversations, prompts, switchConversation,
        deleteConversation, currentConversationId,
        isInitialized, initializeChat,
        taskToDiscuss, clearTaskForChat
    } = useChat();

    const chatBodyRef = useRef(null);
    const nodeRef = useRef(null);

    useEffect(() => {
        if (chatBodyRef.current) {
            chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
        }
    }, [messages]);

    useEffect(() => {
        if (taskToDiscuss) {
            setInputValue(taskToDiscuss);
            if (viewMode === 'minimized') {
                handleRestoreFromIcon();
            }
            clearTaskForChat();
        }
    }, [taskToDiscuss, clearTaskForChat, viewMode]);

    const handleSendMessage = () => {
        if (!inputValue.trim()) return;
        sendMessage(inputValue);
        setInputValue('');
    };

    const handlePromptClick = (promptText) => {
        setInputValue(promptText);
    };

    const handleKeyPress = (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            handleSendMessage();
        }
    };

    const handleMaximizeToggle = () => setViewMode(prev => prev === 'maximized' ? 'normal' : 'maximized');
    const handleMinimize = () => setViewMode('minimized');

    const handleRestoreFromIcon = () => {
        if (!isInitialized) {
            initializeChat();
        }
        setViewMode('normal');
    };

    const handleDeleteClick = (e, conversationId) => {
        e.stopPropagation();
        if (window.confirm('Bạn có chắc chắn muốn xóa cuộc trò chuyện này?')) {
            deleteConversation(conversationId);
        }
    };

    const ChatWindowContent = (
        <>
            <div className="chat-header">
                <span>Chat Support</span>
                <div className="chat-header-buttons">
                    <button className="chat-header-btn" onClick={handleMaximizeToggle}>
                        {viewMode === 'maximized' ? <FiMinimize /> : <FiMaximize />}
                    </button>
                    <button className="chat-header-btn" onClick={handleMinimize}><FiX /></button>
                </div>
            </div>

            {isInitialized && (
                <>
                    <div className="history-toggle-bar" onClick={() => setIsHistoryVisible(p => !p)}>
                        <span>Lịch sử trò chuyện</span>
                        {isHistoryVisible ? <FiChevronUp /> : <FiChevronDown />}
                    </div>
                    {isHistoryVisible && (
                        <div className="history-list">
                            {conversations.map(conv => (
                                <div key={conv.id}
                                    className={`history-item ${conv.id === currentConversationId ? 'active' : ''}`}
                                    onClick={() => switchConversation(conv.id)}
                                >
                                    <span className="history-title">{conv.title}</span>
                                    <button className="history-delete-btn" onClick={(e) => handleDeleteClick(e, conv.id)}>
                                        <FiTrash2 />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}

            <div className="chat-body" ref={chatBodyRef}>
                {isLoading ? (
                    <div className="chat-info loading">
                        <FiLoader className="spinner" />
                        <span>Đang tải dữ liệu...</span>
                    </div>
                ) : error ? (
                    <div className="chat-info error">{error}</div>
                ) : messages.length === 0 && isInitialized ? (
                    <div className="suggestions-container">
                        <p className="suggestions-title">Bạn có thể bắt đầu với:</p>
                        <div className="suggestions-scroll">
                            {prompts.map((prompt, index) => (
                                <div key={index} className="suggestion-tag" onClick={() => handlePromptClick(prompt)}>
                                    {prompt}
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    messages.map((message, index) => (
                        <div key={message.id || index} className={`chat-message ${message.user.toLowerCase()}`}>
                            <div className="message-content"><ReactMarkdown>{message.text}</ReactMarkdown></div>
                        </div>
                    ))
                )}
            </div>

            <div className="chat-footer">
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="Nhập tin nhắn..."
                    disabled={isLoading || !isInitialized}
                />
                <button onClick={handleSendMessage} disabled={isLoading || !isInitialized || !inputValue.trim()}>Gửi</button>
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

    const windowComponent = (
        <div
            className={viewMode === 'maximized' ? 'chat-window-maximized' : 'chat-window-draggable'}
            ref={viewMode === 'normal' ? nodeRef : null}
        >
            {ChatWindowContent}
        </div>
    );

    if (viewMode === 'maximized') {
        return <div className="maximized-overlay">{windowComponent}</div>;
    }

    return (
        <Draggable nodeRef={nodeRef} handle=".chat-header">
            {windowComponent}
        </Draggable>
    );
};

export default DraggableChatWindow;
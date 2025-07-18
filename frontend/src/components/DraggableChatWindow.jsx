import React, { useState, useEffect, useRef } from 'react';
import Draggable from 'react-draggable';
import ReactMarkdown from 'react-markdown';
import { useChat } from '../hooks/useChat';
import './DraggableChatWindow.css';
import remarkGfm from 'remark-gfm';
import { FiMaximize, FiMinimize, FiX, FiChevronDown, FiTrash2, FiLoader, FiPlusCircle } from 'react-icons/fi';

const DraggableChatWindow = () => {
    const [viewMode, setViewMode] = useState('minimized');
    const [inputValue, setInputValue] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const {
        messages, isLoading, error, sendMessage,
        conversations, switchConversation, deleteConversation,
        currentConversationId, isInitialized, initializeChat,
        startNewConversation,
    } = useChat();

    const chatBodyRef = useRef(null);
    const nodeRef = useRef(null);
    const dropdownRef = useRef(null);

    const SUGGESTED_PROMPTS = [
        "Làm thế nào để cải thiện hiệu suất của một ứng dụng React?",
        "Giải thích sự khác biệt giữa `let`, `const`, và `var` trong JavaScript.",
        "Viết một hàm Python để đảo ngược một chuỗi.",
        "Tóm tắt các lợi ích của việc sử dụng TypeScript."
    ];

    useEffect(() => {
        if (chatBodyRef.current) {
            chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
        }
    }, [messages]);

    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [dropdownRef]);


    // useEffect(() => {
    //     if (isChatWindowOpen) {
    //         setViewMode('normal');
    //     } else {
    //         setViewMode('minimized');
    //     }
    // }, [isChatWindowOpen]);

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

    const handleNewChat = () => {
        startNewConversation("");
        setIsDropdownOpen(false);
    };

    const handleSwitchConversation = (id) => {
        switchConversation(id);
        setIsDropdownOpen(false);
    };

    const currentConversation = conversations.find(c => c._id === currentConversationId);

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
                <div className="conversation-menu" ref={dropdownRef}>
                    <button className="current-conversation-btn" onClick={() => setIsDropdownOpen(p => !p)}>
                        <span className="current-conversation-title">
                            {currentConversation?.title || "Chọn cuộc trò chuyện"}
                        </span>
                        <FiChevronDown />
                    </button>
                    {isDropdownOpen && (
                        <div className="conversation-dropdown">
                            <button className="new-chat-btn" onClick={handleNewChat}>
                                <FiPlusCircle />
                                <span>Bắt đầu cuộc trò chuyện mới</span>
                            </button>
                            <div className="conversation-list">
                                {conversations.map(conv => (
                                    <div
                                        key={conv._id}
                                        className={`conversation-item ${conv._id === currentConversationId ? 'active' : ''}`}
                                        onClick={() => handleSwitchConversation(conv._id)}
                                    >
                                        <span className="conversation-title">{conv.title}</span>
                                        <button className="delete-btn" onClick={(e) => handleDeleteClick(e, conv._id)}>
                                            <FiTrash2 />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            <div className="chat-body" ref={chatBodyRef}>
                {isLoading ? (
                    <div className="chat-info loading">
                        <FiLoader className="spinner" />
                        <span>Đang tải dữ liệu...</span>
                    </div>
                ) : error ? (
                    <div className="chat-info error">{error}</div>
                ) : messages.length === 0 && isInitialized && !isLoading ? (
                    <div className="suggestions-container">
                        <p className="suggestions-title">Bạn có thể bắt đầu với:</p>
                        <div className="suggestions-scroll">
                            {SUGGESTED_PROMPTS.map((prompt, index) => (
                                <div key={index} className="suggestion-tag" onClick={() => handlePromptClick(prompt)}>
                                    {prompt}
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    messages.map((msg, index) => {
                        const role = msg.role === 'user' ? 'you' : 'bot';

                        let textContent = '';
                        if (msg.parts && msg.parts.length > 0 && typeof msg.parts[0].text !== 'undefined') {
                            textContent = msg.parts[0].text;
                        } else if (msg.content && msg.content.length > 0 && typeof msg.content[0].text !== 'undefined') {
                            textContent = msg.content[0].text;
                        }

                        return (
                            <div key={msg.id || index} className={`chat-message ${role}`}>
                                <div className="message-content">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{textContent}</ReactMarkdown>
                                </div>
                            </div>
                        );
                    })
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
        <Draggable nodeRef={nodeRef} handle=".chat-header" bounds="parent">
            {windowComponent}
        </Draggable>
    );
};

export default DraggableChatWindow;
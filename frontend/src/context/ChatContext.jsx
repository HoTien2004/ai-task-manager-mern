import React, { createContext, useState, useCallback } from 'react';
import axiosInstance from '../utils/axiosInstance';
import { API_PATHS } from '../utils/apiPaths';

export const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
    const [isInitialized, setIsInitialized] = useState(false);
    const [conversations, setConversations] = useState({});
    const [prompts, setPrompts] = useState([]);
    const [currentConversationId, setCurrentConversationId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [taskToDiscuss, setTaskToDiscuss] = useState(null);

    const fetchConversations = useCallback(async () => {
        const response = await axiosInstance.get(API_PATHS.GEMINI.CONVERSATION_LISTS);
        return response.data;
    }, []);

    const fetchPrompts = useCallback(async () => {
        const response = await axiosInstance.get(API_PATHS.PROMPTS.LIST);
        return response.data;
    }, []);

    const initializeChat = useCallback(async () => {
        if (isInitialized) return;
        setIsLoading(true);
        setError(null);
        try {
            const [convData, promptData] = await Promise.all([
                fetchConversations(),
                fetchPrompts()
            ]);
            const firstConvId = Object.keys(convData)[0] || null;

            setConversations(convData);
            setPrompts(promptData);
            if (firstConvId) {
                setCurrentConversationId(firstConvId);
                setMessages(convData[firstConvId].messages || []);
            }
            setIsInitialized(true);
        } catch (err) {
            setError("Không thể tải dữ liệu ban đầu.");
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [isInitialized, fetchConversations, fetchPrompts]);

    const switchConversation = (id) => {
        if (id !== currentConversationId) {
            setCurrentConversationId(id);
            setMessages(conversations[id]?.messages || []);
        }
    };

    const deleteConversation = async (id) => {
        if (Object.keys(conversations).length <= 1) {
            alert("Không thể xóa cuộc trò chuyện cuối cùng.");
            return;
        }
        try {
            await axiosInstance.delete(API_PATHS.CONVERSATIONS.DELETE(id));
            const newConversations = { ...conversations };
            delete newConversations[id];

            if (id === currentConversationId) {
                const newCurrentId = Object.keys(newConversations)[0];
                setCurrentConversationId(newCurrentId);
                setMessages(newConversations[newCurrentId]?.messages || []);
            }
            setConversations(newConversations);
        } catch (err) {
            alert("Xóa cuộc trò chuyện thất bại.");
            console.error(err);
        }
    };

    const sendMessage = async (messageText) => {
        if (!currentConversationId) return;

        const userMessage = { id: `msg-${Date.now()}`, user: 'You', text: messageText };
        setMessages(prev => [...prev, userMessage]);

        try {
            const response = await axiosInstance.post(API_PATHS.GEMINI.QUERY, {
                message: messageText,
                conversationId: currentConversationId
            });
            const botMessage = { id: `bot-${Date.now()}`, user: 'Bot', text: response.data.response };
            setMessages(prev => [...prev, botMessage]);
        } catch (err) {
            const errorMessage = { id: `err-${Date.now()}`, user: 'Bot', text: `_Lỗi: ${err.message}_` };
            setMessages(prev => [...prev, errorMessage]);
        }
    };

    const setTaskForChat = (taskInfo) => setTaskToDiscuss(taskInfo);
    const clearTaskForChat = () => setTaskToDiscuss(null);

    const value = {
        messages, isLoading, error, sendMessage,
        isInitialized, initializeChat,
        conversations: Object.entries(conversations).map(([id, data]) => ({ id, ...data })),
        currentConversationId, prompts, switchConversation, deleteConversation,
        taskToDiscuss, setTaskForChat, clearTaskForChat
    };

    return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};
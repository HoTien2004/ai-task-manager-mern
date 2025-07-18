import React, { createContext, useState, useCallback } from 'react';
import axiosInstance from '../utils/axiosInstance';
import { API_PATHS } from '../utils/apiPaths';

export const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
    const [isInitialized, setIsInitialized] = useState(false);
    const [conversations, setConversations] = useState([]);
    const [currentConversationId, setCurrentConversationId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);
    const [error, setError] = useState(null);
    const [taskToDiscuss, setTaskToDiscuss] = useState(null);

    const fetchConversations = useCallback(async () => {
        try {
            const response = await axiosInstance.get(API_PATHS.GEMINI.CONVERSATION_LISTS);
            const fetchedConversations = response.data.conversations || [];
            setConversations(fetchedConversations);
            return fetchedConversations;
        } catch (err) {
            console.error("Failed to fetch conversations", err);
            setError("Không thể tải danh sách cuộc trò chuyện.");
            return [];
        }
    }, []);

    const fetchMessages = useCallback(async (conversationId) => {
        if (!conversationId) {
            setMessages([]);
            return;
        }
        setIsLoadingMessages(true);
        try {
            const response = await axiosInstance.get(`${API_PATHS.GEMINI.HISTORY}?conversationId=${conversationId}`);
            setMessages(response.data.history || []);
        } catch (err) {
            console.error("Failed to fetch messages", err);
            setError(`Không thể tải tin nhắn cho cuộc trò chuyện ${conversationId}.`);
            setMessages([]);
        } finally {
            setIsLoadingMessages(false);
        }
    }, []);

    const initializeChat = useCallback(async () => {
        if (isInitialized) return;
        setIsLoading(true);
        setError(null);
        try {
            const convData = await fetchConversations();
            if (convData.length > 0) {
                const firstConvId = convData[0]._id;
                setCurrentConversationId(firstConvId);
                await fetchMessages(firstConvId);
            } else {
                setCurrentConversationId(null);
                setMessages([]);
            }
            setIsInitialized(true);
        } catch (err) {
            setError("Không thể tải dữ liệu ban đầu.");
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [isInitialized, fetchConversations, fetchMessages]);

    const switchConversation = useCallback(async (id) => {
        if (id !== currentConversationId) {
            setCurrentConversationId(id);
            await fetchMessages(id);
        }
    }, [currentConversationId, fetchMessages]);

    const startNewConversation = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await axiosInstance.get(API_PATHS.GEMINI.NEW_CHAT);
            const newConv = response.data;
            const updatedConversations = await fetchConversations();
            if (updatedConversations.length > 0) {
                const newCurrentId = updatedConversations.find(c => c._id === newConv.conversationId)?._id || updatedConversations[0]._id;
                setCurrentConversationId(newCurrentId);
                await fetchMessages(newCurrentId);
            }
        } catch (err) {
            alert("Tạo cuộc trò chuyện mới thất bại.");
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [fetchConversations, fetchMessages]);


    const deleteConversation = async (id) => {
        if (conversations.length <= 1) {
            alert("Không thể xóa cuộc trò chuyện cuối cùng.");
            return;
        }
        try {
            await axiosInstance.delete(API_PATHS.GEMINI.DELETE(id));
            if (id === currentConversationId) {
                await initializeChat();
            } else {
                await fetchConversations();
            }
        } catch (err) {
            alert("Xóa cuộc trò chuyện thất bại.");
            console.error(err);
        }
    };

    const sendMessage = async (messageText) => {
        if (!currentConversationId) return;

        const userMessage = { id: `msg-${Date.now()}`, role: 'user', content: [{ type: 'text', text: messageText }] };
        setMessages(prev => [...prev, userMessage]);
        setIsLoadingMessages(true);

        try {
            const response = await axiosInstance.post(
                API_PATHS.GEMINI.QUERY,
                { message: messageText },
                {
                    params: {
                        conversationId: currentConversationId
                    }
                }
            );
            const botMessage = { id: `bot-${Date.now()}`, role: 'model', content: [{ type: 'text', text: response.data.response }] };
            setMessages(prev => [...prev, botMessage]);
        } catch (err) {
            const errorMessage = { id: `err-${Date.now()}`, role: 'model', content: [{ type: 'text', text: `_Lỗi: ${err.message}_` }] };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoadingMessages(false);
        }
    };

    const setTaskForChat = (taskInfo) => setTaskToDiscuss(taskInfo);
    const clearTaskForChat = () => setTaskToDiscuss(null);

    const value = {
        messages, isLoading: isLoading || isLoadingMessages, error, sendMessage,
        isInitialized, initializeChat,
        conversations, currentConversationId, switchConversation,
        deleteConversation, startNewConversation,
        taskToDiscuss, setTaskForChat, clearTaskForChat
    };

    return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};
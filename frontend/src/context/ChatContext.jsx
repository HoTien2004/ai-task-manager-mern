import React, { createContext, useState, useCallback, useEffect } from 'react';
import axiosInstance from '../utils/axiosInstance';
import { API_PATHS } from '../utils/apiPaths';
import Modal from '../components/Modal';

export const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
    const [isInitialized, setIsInitialized] = useState(false);
    const [conversations, setConversations] = useState([]);
    const [currentConversationId, setCurrentConversationId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);
    const [isInitializingDiscussion, setIsInitializingDiscussion] = useState(false); // Add this state
    const [error, setError] = useState(null);
    const [messageCache, setMessageCache] = useState({});
    const [isChatWindowOpen, setIsChatWindowOpen] = useState(false);
    const [isAwaitingResponse, setIsAwaitingResponse] = useState(false);

    const [confirmationState, setConfirmationState] = useState({
        isOpen: false,
        title: '',
        content: null,
        onConfirm: () => { }
    });

    useEffect(() => {
        if (currentConversationId && messages.length > 0) {
            setMessageCache(prevCache => ({
                ...prevCache,
                [currentConversationId]: messages
            }));
        }
    }, [messages, currentConversationId]);

    const askForConfirmation = (title, content, onConfirmAction) => {
        setConfirmationState({
            isOpen: true,
            title,
            content,
            onConfirm: () => {
                onConfirmAction();
                closeConfirmation(); // Automatically close modal on confirm
            }
        });
    };

    const closeConfirmation = () => {
        setConfirmationState({ isOpen: false, title: '', content: null, onConfirm: () => { } });
    };

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
        try {
            const convData = await fetchConversations();
            if (convData.length > 0) {
                const firstConvId = convData[0]._id;
                setCurrentConversationId(firstConvId);
                await fetchMessages(firstConvId);
            }
        } catch (err) {
            setError("Không thể tải dữ liệu ban đầu.");
        } finally {
            setIsLoading(false);
            setIsInitialized(true);
        }
    }, [isInitialized, fetchConversations, fetchMessages]);

    const switchConversation = useCallback(async (id) => {
        if (id === currentConversationId && messages.length > 0) return;
        setCurrentConversationId(id);
        if (messageCache[id]) {
            setMessages(messageCache[id]);
        } else {
            await fetchMessages(id);
        }
    }, [currentConversationId, messageCache, fetchMessages, messages.length]);

    const startNewConversation = useCallback(async (newTitle) => {
        setIsLoading(true);
        try {
            const response = await axiosInstance.post(API_PATHS.GEMINI.NEW_CHAT, { newTitle: newTitle });
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
        try {
            await axiosInstance.delete(API_PATHS.GEMINI.CONVERSATION.DELETE(id));
            setMessageCache(prevCache => {
                const newCache = { ...prevCache };
                delete newCache[id];
                return newCache;
            });

            const remainingConversations = await fetchConversations();

            if (id === currentConversationId) {
                if (remainingConversations.length > 0) {
                    await switchConversation(remainingConversations[0]._id);
                } else {
                    setMessages([]);
                    setCurrentConversationId(null);
                }
            }

        } catch (err) {
            alert("Xóa cuộc trò chuyện thất bại.");
            console.error(err);
        }
    };

    const sendMessage = async (messageText) => {
        let conversationIdToUse = currentConversationId;

        try {
            if (!conversationIdToUse) {
                setIsLoading(true);
                const response = await axiosInstance.post(API_PATHS.GEMINI.NEW_CHAT, {
                    newTitle: messageText.substring(0, 30)
                });
                const newConv = response.data;
                conversationIdToUse = newConv.conversationId;
                setCurrentConversationId(conversationIdToUse);
                await fetchConversations();
            }

            const userMessage = { id: `msg-${Date.now()}`, role: 'user', parts: [{ text: messageText }] };
            setMessages(prev => [...prev, userMessage]);
            setIsAwaitingResponse(true);

            const response = await axiosInstance.post(
                API_PATHS.GEMINI.QUERY,
                { message: messageText },
                { params: { conversationId: conversationIdToUse } }
            );

            const botMessage = { id: `bot-${Date.now()}`, role: 'model', parts: [{ text: response.data.response }] };
            setMessages(prev => [...prev, botMessage]);

        } catch (err) {
            const errorMessage = { id: `err-${Date.now()}`, role: 'model', parts: [{ text: `_Lỗi: ${err.message}_` }] };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
            setIsAwaitingResponse(false);
        }
    };

    const initializeTaskDiscussion = async (taskId) => {
        setIsInitializingDiscussion(true);
        setError(null);
        try {
            setIsChatWindowOpen(true);
            const response = await axiosInstance.post(API_PATHS.GEMINI.TASK_HELP_INITIALIZE, { taskId });
            const { conversationId: newConversationId } = response.data;

            if (newConversationId) {
                await fetchConversations();
                await switchConversation(newConversationId);
            }
        } catch (err) {
            console.error("Failed to initialize task discussion:", err);
            const errorMsg = "Không thể bắt đầu cuộc trò chuyện cho công việc này.";
            setError(errorMsg);
            alert(`Lỗi: ${errorMsg} Vui lòng thử lại.`);
        } finally {
            setIsInitializingDiscussion(false);
        }
    };

    const navigateToNextConversation = () => {
        if (!isChatWindowOpen) {
            setIsChatWindowOpen(true);
        }
        if (conversations.length < 2) return;
        const currentIndex = conversations.findIndex(c => c._id === currentConversationId);
        if (currentIndex === -1) {
            switchConversation(conversations[0]._id);
            return;
        }
        const nextIndex = (currentIndex + 1) % conversations.length;
        const nextConversationId = conversations[nextIndex]._id;
        switchConversation(nextConversationId);
    };

    const value = {
        messages,
        isLoading: isLoading || isLoadingMessages || isInitializingDiscussion, // Combine loading states
        isAwaitingResponse,
        error,
        sendMessage,
        isInitialized,
        initializeChat,
        conversations,
        currentConversationId,
        switchConversation,
        deleteConversation,
        startNewConversation,
        initializeTaskDiscussion,
        isChatWindowOpen,
        setIsChatWindowOpen,
        navigateToNextConversation,
        askForConfirmation,
    };

    return (
        <ChatContext.Provider value={value}>
            {children}
            <Modal
                isOpen={confirmationState.isOpen}
                onClose={closeConfirmation}
                onConfirm={confirmationState.onConfirm}
                title={confirmationState.title}
            >
                {confirmationState.content}
            </Modal>
        </ChatContext.Provider>
    );
};
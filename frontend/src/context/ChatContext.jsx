import React, { createContext, useState, useCallback, useEffect } from 'react';
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

    const [messageCache, setMessageCache] = useState({});

    const [isChatWindowOpen, setIsChatWindowOpen] = useState(false);

    const [isAwaitingResponse, setIsAwaitingResponse] = useState(false);

    useEffect(() => {
        if (currentConversationId && messages.length > 0) {
            setMessageCache(prevCache => ({
                ...prevCache,
                [currentConversationId]: messages
            }));
        }
    }, [messages, currentConversationId]);

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
        // if (conversations.length <= 1) {
        //     alert("Không thể xóa cuộc trò chuyện cuối cùng.");
        //     return;
        // }
        try {

            await axiosInstance.delete(API_PATHS.GEMINI.CONVERSATION.DELETE(id));

            setMessageCache(prevCache => {
                const newCache = { ...prevCache };
                delete newCache[id];
                return newCache;
            });

            if (id === currentConversationId) {
                setMessages([]);
                setCurrentConversationId(null);
            }

            await fetchConversations();

        } catch (err) {
            alert("Xóa cuộc trò chuyện thất bại.");
            console.error(err);
        }
    };

    const sendMessage = async (messageText) => {
        // [INSTRUCTION_B]
        // This function is significantly updated.
        // 1. It checks if there is a `currentConversationId`.
        // 2. If not, it automatically calls the API to create a new conversation first.
        // 3. It then uses this new ID to send the message.
        // 4. It also ensures the optimistic UI update uses the correct `parts` structure.
        // [INSTRUCTION_E]
        let conversationIdToUse = currentConversationId;

        try {
            // If there's no active conversation, create one first.
            if (!conversationIdToUse) {
                setIsLoading(true);
                const response = await axiosInstance.post(API_PATHS.GEMINI.NEW_CHAT, {
                    newTitle: ""
                });
                const newConv = response.data;
                conversationIdToUse = newConv.conversationId;

                // Update state and refresh conversation list
                setCurrentConversationId(conversationIdToUse);
                await fetchConversations();
            }

            // Optimistically update UI with the user's message
            const userMessage = { id: `msg-${Date.now()}`, role: 'user', parts: [{ text: messageText }] };
            setMessages(prev => [...prev, userMessage]);
            setIsLoadingMessages(true);

            setIsAwaitingResponse(true);
            // Send message to the backend
            const response = await axiosInstance.post(
                API_PATHS.GEMINI.QUERY,
                { message: messageText },
                {
                    params: {
                        conversationId: conversationIdToUse
                    }
                }
            );

            // Update UI with the bot's response
            const botMessage = { id: `bot-${Date.now()}`, role: 'model', parts: [{ text: response.data.response }] };
            setMessages(prev => [...prev, botMessage]);

        } catch (err) {
            const errorMessage = { id: `err-${Date.now()}`, role: 'model', parts: [{ text: `_Lỗi: ${err.message}_` }] };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
            setIsLoadingMessages(false);
            setIsAwaitingResponse(false);
        }
    };

    const initializeTaskDiscussion = async (taskId) => {
        setIsInitializingDiscussion(true);
        setError(null);
        try {
            const response = await axiosInstance.post(API_PATHS.GEMINI.TASK_HELP_INITIALIZE, { taskId });
            const { conversationId: newConversationId } = response.data;

            if (newConversationId) {
                // Step 1: Fetch lại danh sách cuộc trò chuyện
                await fetchConversations();
                // Step 2: Chuyển sang cuộc trò chuyện mới
                await switchConversation(newConversationId);

                // [INSTRUCTION_B]
                // This is the crucial new step. After all data is loaded and the
                // conversation is switched, this line sets the global state to true,
                // signaling the DraggableChatWindow component to open.
                // [INSTRUCTION_E]
                setIsChatWindowOpen(true);
            }
        } catch (err) {
            console.error("Failed to initialize task discussion:", err);
            setError("Không thể bắt đầu cuộc trò chuyện cho công việc này.");
            alert("Lỗi: Không thể bắt đầu cuộc trò chuyện. Vui lòng thử lại.");
        } finally {
            setIsInitializingDiscussion(false);
        }
    };


    const value = {
        messages,
        isLoading: isLoading || isLoadingMessages,
        isAwaitingResponse, // Export trạng thái mớ
        error,
        sendMessage,
        isInitialized,
        initializeChat,
        conversations,
        currentConversationId,
        switchConversation,
        deleteConversation,
        startNewConversation,
        initializeTaskDiscussion, // Expose the updated function
    };

    return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

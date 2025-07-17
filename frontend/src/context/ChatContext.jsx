// src/context/ChatContext.jsx - PHIÊN BẢN CÓ PHÂN TRANG

import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import axiosInstance from '../utils/axiosInstance';
import { API_PATHS } from '../utils/apiPaths';
import { UserContext } from './UserContext';

export const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
    const { user } = useContext(UserContext);
    const [messages, setMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(true); // Loading for initial fetch
    const [isFetchingMore, setIsFetchingMore] = useState(false); // Loading for subsequent pages
    const [error, setError] = useState(null);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Fetch initial page of history
    useEffect(() => {
        if (!user?._id) return;

        const fetchInitialHistory = async () => {
            setIsLoading(true);
            try {
                // Fetch page 1 with a limit (e.g., 20 messages)
                const response = await axiosInstance.get(API_PATHS.GEMINI.HISTORY, {
                    params: { page: 1, limit: 20 }
                });

                const { history, totalPages: newTotalPages } = response.data;

                const formatted = history.map((msg, index) => ({
                    id: `hist-${msg._id || index}`, // Use a unique ID from DB if available
                    user: msg.role === 'model' ? 'Bot' : 'You',
                    text: msg.parts[0].text,
                }));

                setMessages(formatted);
                setTotalPages(newTotalPages);
                setCurrentPage(1);
            } catch (err) {
                setError(err.response?.data?.error || 'Could not fetch history.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchInitialHistory();
    }, [user]);

    // Function to fetch more messages (older pages)
    const fetchMoreHistory = useCallback(async () => {
        // Prevent fetching if already fetching or no more pages
        if (isFetchingMore || currentPage >= totalPages) return;

        setIsFetchingMore(true);
        const nextPage = currentPage + 1;

        try {
            const response = await axiosInstance.get(API_PATHS.GEMINI.HISTORY, {
                params: { page: nextPage, limit: 20 }
            });
            const { history } = response.data;

            const formatted = history.map((msg, index) => ({
                id: `hist-${msg._id || `${nextPage}-${index}`}`,
                user: msg.role === 'model' ? 'Bot' : 'You',
                text: msg.parts[0].text,
            }));

            // Prepend older messages to the top of the list
            setMessages(prev => [...formatted, ...prev]);
            setCurrentPage(nextPage);
        } catch (err) {
            // You might want to show a small error toast here instead of a full-page error
            console.error("Failed to fetch more history:", err);
        } finally {
            setIsFetchingMore(false);
        }
    }, [isFetchingMore, currentPage, totalPages]);


    const sendMessage = async (messageText) => {
        const userMessage = { id: `msg-${Date.now()}`, user: 'You', text: messageText };
        setMessages(prev => [...prev, userMessage]);

        try {
            const response = await axiosInstance.post(API_PATHS.GEMINI.QUERY, { message: messageText });
            const botMessage = { id: `bot-${Date.now()}`, user: 'Bot', text: response.data.response };
            setMessages(prev => [...prev, botMessage]);
        } catch (err) {
            const errorMessage = { id: `err-${Date.now()}`, user: 'Bot', text: `_Error: ${err.message}_` };
            setMessages(prev => [...prev, errorMessage]);
        }
    };

    const value = { messages, isLoading, error, sendMessage, fetchMoreHistory, isFetchingMore };

    return (
        <ChatContext.Provider value={value}>
            {children}
        </ChatContext.Provider>
    );
};
import { useState, useEffect } from 'react';
import axiosInstance from '../utils/axiosInstance';
import { API_PATHS } from '../utils/apiPaths';

/**
 * A custom hook to manage chat state and API interactions.
 */
export const useChat = () => {
    const [messages, setMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const response = await axiosInstance.get(API_PATHS.GEMINI.HISTORY);
                const formatted = response.data.history.map((msg, index) => ({
                    id: `hist-${index}`,
                    user: msg.role === 'model' ? 'Bot' : 'You',
                    text: msg.parts[0].text,
                }));
                setMessages(formatted);
            } catch (err) {
                setError(err.response?.data?.error || 'Could not fetch history.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchHistory();
    }, []); // Runs only once on mount

    const sendMessage = async (messageText) => {
        const userMessage = {
            id: `msg-${Date.now()}`,
            user: 'You',
            text: messageText,
        };
        setMessages(prev => [...prev, userMessage]);

        try {
            const response = await axiosInstance.post(API_PATHS.GEMINI.QUERY, { message: messageText });
            const botMessage = {
                id: `bot-${Date.now()}`,
                user: 'Bot',
                text: response.data.response,
            };
            setMessages(prev => [...prev, botMessage]);
        } catch (err) {
            const errorMessage = {
                id: `err-${Date.now()}`,
                user: 'Bot',
                text: `_Error: ${err.response?.data?.error || err.message}_`,
            };
            setMessages(prev => [...prev, errorMessage]);
        }
    };

    return { messages, isLoading, error, sendMessage };
};
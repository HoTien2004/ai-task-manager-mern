// src/hooks/useChat.jsx

import { useContext } from 'react';
import { ChatContext } from '../context/ChatContext';

/**
 * A custom hook that provides chat state and actions from ChatContext.
 */
export const useChat = () => {
    const context = useContext(ChatContext);
    if (context === undefined) {
        throw new Error('useChat must be used within a ChatProvider');
    }
    return context;
};
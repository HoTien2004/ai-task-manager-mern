// src/components/layouts/AdminLayout.jsx

import React from 'react';
import { Outlet } from 'react-router-dom';
import DraggableChatWindow from '../DraggableChatWindow';
import { ChatProvider } from '../../context/ChatContext';

const AdminLayout = () => {
    return (
        <>
            <ChatProvider>
                <Outlet />
                <DraggableChatWindow />
            </ChatProvider>
        </>
    );
};

export default AdminLayout;
// src/components/layouts/AdminLayout.jsx

import React from 'react';
import { Outlet } from 'react-router-dom';
import DraggableChatWindow from '../DraggableChatWindow';

const AdminLayout = () => {
    return (
        <>
            <Outlet />
            <DraggableChatWindow />
        </>
    );
};

export default AdminLayout;
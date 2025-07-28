import React from 'react'
import { Outlet } from 'react-router-dom'
import { ChatProvider } from '../context/ChatContext'
import DraggableChatWindow from '../components/DraggableChatWindow'

const PrivateRoute = ({ allowedRoles }) => {
  return (
    <>
      <ChatProvider>
        <Outlet />
        <DraggableChatWindow />
      </ChatProvider>
    </>
  )
}

export default PrivateRoute

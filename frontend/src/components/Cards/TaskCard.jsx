import React from 'react';
import moment from 'moment';
import { LuPaperclip } from 'react-icons/lu';
import { FiMessageSquare } from 'react-icons/fi';
import Progress from '../Progress';
import AvatarGroup from '../AvatarGroup';
import { useChat } from '../../hooks/useChat';
import { useUser } from '../../context/UserContext';

const TaskCard = ({
    _id,
    title,
    description,
    priority,
    status,
    progress,
    createdAt,
    dueDate,
    assignedTo,
    attachmentCount,
    completedTodoCount,
    todoChecklist,
    onClick
}) => {
    const { initializeTaskDiscussion, askForConfirmation } = useChat();
    const { user } = useUser();

    const getStatusTagColor = () => {
        switch (status) {
            case "In Progress": return "text-cyan-500 bg-cyan-50 border border-cyan-500/10";
            case "Completed": return "text-lime-500 bg-lime-50 border border-lime-500/10";
            default: return "text-violet-500 bg-violet-50 border border-violet-500/10";
        }
    };

    const getPriorityTagColor = () => {
        switch (priority) {
            case "Low": return "text-emerald-500 bg-emerald-50 border border-emerald-500/10";
            case "Medium": return "text-amber-500 bg-amber-50 border border-amber-500/20";
            default: return "text-rose-500 bg-rose-50 border border-rose-500/10";
        }
    };

    const handleDiscussTask = (e) => {
        e.stopPropagation();
        const modalContent = (
            <p className="text-base leading-relaxed text-gray-500 dark:text-gray-400">
                Bạn có chắc chắn muốn tạo một cuộc thảo luận mới với chatbot về công việc "{title}" không?
            </p>
        );

        askForConfirmation(
            'Xác nhận thảo luận',
            modalContent,
            () => initializeTaskDiscussion(_id)
        );
    };

    return (
        <div
            className='bg-white rounded-xl py-4 shadow-md shadow-gray-100 border border-gray-200/50 cursor-pointer'
            onClick={onClick}
        >
            <div className='flex items-end gap-3 px-4'>
                <div className={`text-[11px] font-medium ${getStatusTagColor()} px-4 py-0.5 rounded`}>
                    {status}
                </div>
                <div className={`text-[11px] font-medium ${getPriorityTagColor()} px-4 py-0.5 rounded`}>
                    {priority} Priority
                </div>
            </div>

            <div className={`px-4 mt-4 border-l-[3px] ${status === "In Progress" ? "border-cyan-500" :
                status === "Completed" ? "border-lime-500" : "border-violet-500"
                }`}>
                <p className='text-sm font-medium text-gray-800 line-clamp-2'>{title}</p>
                <p className='text-xs text-gray-500 mt-1.5 line-clamp-2 leading-[18px]'>{description}</p>
                <p className='text-[13px] text-gray-700/80 font-medium mt-2 mb-2'>
                    Task Done: <span className='font-semibold text-gray-700'>
                        {completedTodoCount} / {todoChecklist?.length || 0}
                    </span>
                </p>
                <Progress progress={progress} status={status} />
            </div>

            <div className='px-4 mt-2'>
                <div className='flex items-center justify-between my-1'>
                    <div>
                        <label className='text-xs text-gray-500'>Start Date</label>
                        <p className='text-[13px] font-medium text-gray-900'>
                            {moment(createdAt).format("Do MMM YYYY")}
                        </p>
                    </div>
                    <div>
                        <label className='text-xs text-gray-500'>Due Date</label>
                        <p className='text-[13px] font-medium text-gray-900'>
                            {moment(dueDate).format("Do MMM YYYY")}
                        </p>
                    </div>
                </div>

                <div className='w-full mt-3'>
                    {/* Hàng trên chứa avatar và số lượng tệp đính kèm */}
                    <div className='flex items-center justify-between'>
                        <AvatarGroup avatars={assignedTo || []} />
                        {attachmentCount > 0 && (
                            <div className='flex items-center gap-2 bg-gray-100 px-2.5 py-1.5 rounded-lg'>
                                <LuPaperclip className='text-gray-600' />
                                <span className='text-xs text-gray-900'>{attachmentCount}</span>
                            </div>
                        )}
                    </div>
                    <div className='flex justify-end w-full mt-2'>{user?.role === 'admin' && (
                        <button
                            onClick={handleDiscussTask}
                            className='p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors w-full'
                            title="Thảo luận về công việc này"

                        >
                            <FiMessageSquare className='text-gray-600' />
                            <span className='font-family: sans-serif'>Thảo luận với Chat Bot về công việc này ?</span>
                        </button>
                    )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TaskCard;
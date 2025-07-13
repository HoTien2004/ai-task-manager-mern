// import React from 'react'

// const Progress = ({ progress, status }) => {
//     const getColor = () => {
//         switch (status) {
//             case "In Progress":
//                 return "text-cyan-500 bg-cyan-50 border border-cyan-500/10";
//             case "Completed":
//                 return "text-indigo-500 bg-indigo-50 border border-indigo-500/10";
//             default:
//                 return "text-violet-500 bg-violet-50 border border-violet-500/10";
//         }
//     }
//     return (
//         <div className='w-full bg-gray-200 rounded-full h-1.5'>
//             <div className={`${getColor()} h-1.5 rounded-full text-center text-xs font-medium`} style={{ width: `${progress}%` }}>

//             </div>
//         </div>
//     )
// }

// export default Progress


import React from 'react';

const Progress = ({ progress, status }) => {
    const getProgressBarColor = () => {
        if (status === "Completed") {
            return "bg-lime-500";
        } else if (status === "In Progress") {
            return "bg-cyan-500";
        }
        return "bg-violet-500";
    };

    const getProgressBarBgColor = () => {
        if (status === "Completed") {
            return "bg-lime-100";
        } else if (status === "In Progress") {
            return "bg-cyan-100";
        }
        return "bg-violet-100";
    };

    return (
        <div className={`w-full h-1.5 rounded-full ${getProgressBarBgColor()}`}>
            <div
                className={`h-full rounded-full ${getProgressBarColor()}`}
                style={{ width: `${progress}%` }}
            ></div>
        </div>
    );
};

export default Progress;
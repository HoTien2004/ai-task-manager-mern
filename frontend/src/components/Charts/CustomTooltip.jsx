import React from 'react';

const CustomTooltip = ({ active, payload, getStatusColor }) => {
    if (active && payload && payload.length) {
        const dataEntry = payload[0].payload;

        const currentColor = getStatusColor(dataEntry);

        return (
            <div className='bg-white shadow-md rounded-lg p-2 border border-gray-300'>
                <p className='text-xs font-semibold mb-1' style={{ color: currentColor }}>
                    {dataEntry.status}
                </p>
                <p className='text-sm text-gray-600'>
                    Count:{" "}
                    <span className='text-sm font-medium text-gray-900'>
                        {dataEntry.count}
                    </span>
                </p>
            </div>
        );
    }
    return null;
};

export default CustomTooltip;
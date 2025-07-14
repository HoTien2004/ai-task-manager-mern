import React from 'react';

const CustomLegend = ({ payload, getStatusColor }) => {
    return (
        <ul className="flex flex-row flex-wrap justify-center gap-x-4 gap-y-2 p-2 mt-2">
            {payload.map((entry, index) => (
                <li key={`item-${index}`} className="flex items-center gap-2 text-sm text-gray-700">
                    <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: getStatusColor(entry.payload) }}
                    ></div>
                    <span>{entry.value}</span>
                </li>
            ))}
        </ul>
    );
};

export default CustomLegend;
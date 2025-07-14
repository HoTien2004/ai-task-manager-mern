import React from 'react'
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    Cell
} from "recharts";

const CustomBarChart = ({ data }) => {
    const getBarColor = (entry) => {
        switch (entry?.priority) {
            case 'Low':
                return '#00BC7D'
            case 'Medium':
                return '#FE9901'
            case 'High':
                return '#FF1F57'
            default:
                return '#00BC7D';
        }
    };

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const currentColor = getBarColor(payload[0].payload);

            return (
                <div className='bg-white shadow-md rounded-lg p-2 border border-gray-300'>
                    <p
                        className='text-xs font-semibold mb-1'
                        style={{ color: currentColor }}
                    >
                        {payload[0].payload.priority}
                    </p>
                    <p className='text-sm text-gray-600'>
                        Count:{""}
                        <span className='text-sm font-medium text-gray-900'>
                            {payload[0].payload.count}
                        </span>
                    </p>
                </div>
            );
        }
        return null;
    }
    return (
        <div className='bg-white mt-6'>
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data}>
                    <CartesianGrid stroke="none" />

                    <XAxis
                        dataKey="priority"
                        tick={{ fontSize: 12, fill: "#555" }}
                        stroke='none'
                    />
                    <YAxis
                        tick={{ fontSize: 12, fill: "#555" }}
                        stroke='none'
                    />

                    <Tooltip content={CustomTooltip} cursor={{ fill: "transparent" }} />

                    <Bar
                        dataKey="count"
                        nameKey="priority"
                        radius={[10, 10, 0, 0]}
                        activeDot={{ r: 8, fill: "Yellow" }}
                        activeStyle={{ fill: "green" }}
                    >
                        {data.map((entry, index) => (
                            <Cell key={index} fill={getBarColor(entry)} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    )
}

export default CustomBarChart

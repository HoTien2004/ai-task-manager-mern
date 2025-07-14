import React from 'react';
import {
    PieChart,
    Pie,
    Cell,
    Tooltip,
    ResponsiveContainer,
    Legend
} from 'recharts';
import CustomTooltip from './CustomTooltip';
import CustomLegend from './CustomLegend';

const CustomPieChart = ({ data }) => {
    const getStatusColor = (entry) => {
        switch (entry?.status) {
            case 'Pending':
                return '#8d51ff';
            case 'Completed':
                return '#7bce00';
            case 'In Progress':
                return '#00b9d8';
            default:
                return '#A0A0A0';
        }
    };

    return (
        <ResponsiveContainer width='100%' height={325}>
            <PieChart>
                <Pie
                    data={data}
                    dataKey='count'
                    nameKey='status'
                    cx='50%'
                    cy='50%'
                    outerRadius={130}
                    innerRadius={100}
                    labelLine={false}
                >
                    {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={getStatusColor(entry)} />
                    ))}
                </Pie>
                <Tooltip content={<CustomTooltip getStatusColor={getStatusColor} />} />
                <Legend content={<CustomLegend getStatusColor={getStatusColor} />} />
            </PieChart>
        </ResponsiveContainer>
    );
};

export default CustomPieChart;
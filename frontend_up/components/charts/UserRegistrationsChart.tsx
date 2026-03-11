"use client"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';
import moment from 'moment'; // Import moment for date formatting

interface UserGrowthData {
  _id: { year: number; month: number; }; // Grouped by year and month
  count: number;
}

interface UserRegistrationsChartProps {
  data: UserGrowthData[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-2 bg-card border border-border rounded-lg shadow-lg text-foreground">
        <p className="text-sm font-semibold">{`${label}`}</p>
        <p className="text-xs text-muted-foreground">{`New Users: ${payload[0].value}`}</p>
      </div>
    );
  }

  return null;
};

export default function UserRegistrationsChart({ data }: UserRegistrationsChartProps) {
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  // Generate last 6 months with default data
  const lastSixMonthsData = Array.from({ length: 6 }).map((_, i) => {
    const date = moment().subtract(5 - i, 'months'); // Go back 5 months from current, then forward
    return {
      _id: { year: date.year(), month: date.month() + 1 },
      count: 0,
    };
  });

  // Merge backend data with the last six months data
  const mergedData = lastSixMonthsData.map(monthData => {
    const found = data.find(item => item._id.year === monthData._id.year && item._id.month === monthData._id.month);
    return {
      date: `${monthNames[monthData._id.month - 1]} ${monthData._id.year}`,
      users: found ? found.count : 0,
    };
  });

  // Calculate KPI for month-over-month growth using mergedData
  let registrationGrowth = 0;
  let currentMonthRegistrations = 0;
  let previousMonthRegistrations = 0;

  if (mergedData.length >= 2) {
    const lastMonth = mergedData[mergedData.length - 1];
    const secondLastMonth = mergedData[mergedData.length - 2];

    currentMonthRegistrations = lastMonth.users;
    previousMonthRegistrations = secondLastMonth.users;

    if (previousMonthRegistrations > 0) {
      registrationGrowth = ((currentMonthRegistrations - previousMonthRegistrations) / previousMonthRegistrations) * 100;
    } else if (currentMonthRegistrations > 0) {
      registrationGrowth = 100; // Infinite growth if previous was 0
    }
  } else if (mergedData.length === 1) {
    currentMonthRegistrations = mergedData[0].users;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">New Users (Last Month)</p>
          <p className="text-2xl font-bold text-foreground">{currentMonthRegistrations}</p>
        </div>
        {mergedData.length >= 2 && ( // Only show growth if at least two months of data
          <div className={`flex items-center text-sm font-medium ${registrationGrowth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {registrationGrowth >= 0 ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
            {registrationGrowth.toFixed(2)}%
          </div>
        )}
      </div>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart
          data={mergedData} // Use mergedData for the chart
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#D1D5DB" />
          <XAxis dataKey="date" stroke="#6B7280" tickLine={false} axisLine={false} tick={{ fill: '#6B7280' }} />
          <YAxis stroke="#6B7280" tickLine={false} axisLine={false} tick={{ fill: '#6B7280' }} label={{ value: 'Users', angle: -90, position: 'insideLeft', fill: '#6B7280' }} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ paddingTop: '10px', color: '#6B7280' }} />
          <Line type="monotone" dataKey="users" stroke="#4299E1" strokeWidth={3} dot={{ r: 4, fill: '#4299E1', stroke: '#4299E1', strokeWidth: 2 }} activeDot={{ r: 6, fill: '#4299E1', stroke: '#4299E1', strokeWidth: 2 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

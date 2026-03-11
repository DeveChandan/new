"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface JobCategoryData {
  category: string; // Flattened category name
  count: number;
}

interface JobsByCategoryChartProps {
  data: JobCategoryData[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-2 bg-card border border-border rounded-lg shadow-lg text-foreground">
        <p className="text-sm font-semibold">{`${label}`}</p>
        <p className="text-xs text-muted-foreground">{`Jobs: ${payload[0].value}`}</p>
      </div>
    );
  }

  return null;
};

export default function JobsByCategoryChart({ data }: JobsByCategoryChartProps) {
  // The backend now returns data already aggregated and flattened: { category: string, count: number }
  // We just need to map 'count' to 'jobs' for the chart
  const formattedData = data.map(item => ({
    category: item.category,
    jobs: item.count,
  }));

  // Sort by jobs count descending and take top 5
  const sortedAndSlicedData = formattedData.sort((a, b) => b.jobs - a.jobs).slice(0, 5);

  if (!sortedAndSlicedData || sortedAndSlicedData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <p className="text-sm font-medium">No jobs posted in this time range</p>
        <p className="text-xs">Try selecting a wider date range (30d or 90d)</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={sortedAndSlicedData} // Use the sorted and sliced data
        margin={{
          top: 5,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#D1D5DB" />
        <XAxis dataKey="category" stroke="#6B7280" tickLine={false} axisLine={false} tick={{ fill: '#6B7280' }} />
        <YAxis stroke="#6B7280" tickLine={false} axisLine={false} tick={{ fill: '#6B7280' }} label={{ value: 'Jobs', angle: -90, position: 'insideLeft', fill: '#6B7280' }} />
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ paddingTop: '10px', color: '#6B7280' }} />
        <Bar dataKey="jobs" fill="#F6AD55" stroke="#F6AD55" strokeWidth={1} />
      </BarChart>
    </ResponsiveContainer>
  );
}

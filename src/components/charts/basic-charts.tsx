"use client";

import { Bar, BarChart, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Line, LineChart, CartesianGrid } from "recharts";

export function CategoryPieChart({ data }: { data: Array<{ name: string; value: number; color: string }> }) {
  return (
    <div className="h-72 rounded-lg border border-black/10 bg-white p-4">
      <h2 className="mb-3 text-sm font-bold text-ink">Despesas por categoria</h2>
      <ResponsiveContainer width="100%" height="88%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90}>
            {data.map((item) => <Cell key={item.name} fill={item.color} />)}
          </Pie>
          <Tooltip formatter={(value) => `R$ ${Number(value).toFixed(2)}`} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function IncomeExpenseChart({ data }: { data: Array<{ month: string; receitas: number; despesas: number }> }) {
  return (
    <div className="h-72 rounded-lg border border-black/10 bg-white p-4">
      <h2 className="mb-3 text-sm font-bold text-ink">Receitas x despesas</h2>
      <ResponsiveContainer width="100%" height="88%">
        <BarChart data={data}>
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="receitas" fill="#16a085" />
          <Bar dataKey="despesas" fill="#e76f51" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function BalanceLineChart({ data }: { data: Array<{ month: string; saldo: number }> }) {
  return (
    <div className="h-72 rounded-lg border border-black/10 bg-white p-4">
      <h2 className="mb-3 text-sm font-bold text-ink">Evolução do saldo</h2>
      <ResponsiveContainer width="100%" height="88%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="saldo" stroke="#2a9d8f" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

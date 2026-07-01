"use client";

import { Bar, BarChart, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Line, LineChart, CartesianGrid } from "recharts";

const tooltipStyle = {
  backgroundColor: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "0.5rem",
  color: "hsl(var(--foreground))"
};

const axisStyle = {
  fill: "hsl(var(--muted-foreground))"
};

const axisLineStyle = {
  stroke: "hsl(var(--border))"
};

export function CategoryPieChart({ data }: { data: Array<{ name: string; value: number; color: string }> }) {
  return (
    <div className="h-72 rounded-lg border border-border bg-card p-4">
      <h2 className="mb-3 text-sm font-bold text-foreground">Despesas por categoria</h2>
      {data.length ? (
        <ResponsiveContainer width="100%" height="88%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90}>
              {data.map((item) => <Cell key={item.name} fill={item.color} />)}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} itemStyle={{ color: "hsl(var(--foreground))" }} formatter={(value) => `R$ ${Number(value).toFixed(2)}`} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex h-[88%] items-center justify-center rounded-md border border-dashed border-border text-center text-sm font-semibold text-muted-foreground">
          Nenhuma despesa neste mês.
        </div>
      )}
    </div>
  );
}

export function IncomeExpenseChart({ data }: { data: Array<{ month: string; receitas: number; despesas: number }> }) {
  return (
    <div className="h-72 rounded-lg border border-border bg-card p-4">
      <h2 className="mb-3 text-sm font-bold text-foreground">Receitas x despesas</h2>
      <ResponsiveContainer width="100%" height="88%">
        <BarChart data={data}>
          <XAxis dataKey="month" tick={axisStyle} axisLine={axisLineStyle} tickLine={axisLineStyle} />
          <YAxis tick={axisStyle} axisLine={axisLineStyle} tickLine={axisLineStyle} />
          <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: "hsl(var(--foreground))" }} itemStyle={{ color: "hsl(var(--foreground))" }} />
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
    <div className="h-72 rounded-lg border border-border bg-card p-4">
      <h2 className="mb-3 text-sm font-bold text-foreground">Evolução do saldo</h2>
      <ResponsiveContainer width="100%" height="88%">
        <LineChart data={data}>
          <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" />
          <XAxis dataKey="month" tick={axisStyle} axisLine={axisLineStyle} tickLine={axisLineStyle} />
          <YAxis tick={axisStyle} axisLine={axisLineStyle} tickLine={axisLineStyle} />
          <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: "hsl(var(--foreground))" }} itemStyle={{ color: "hsl(var(--foreground))" }} />
          <Line type="monotone" dataKey="saldo" stroke="#2a9d8f" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

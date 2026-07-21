import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, BarChart, Bar, LineChart, Line } from 'recharts';
import { ArrowUpRight, ArrowDownRight, AlertCircle, Sparkles, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { FinanceDashboard as DashboardType } from '@/types/domain';

interface DashboardProps {
  dashboardData: DashboardType;
  isLoading: boolean;
  onNavigateToTab: (tab: string) => void;
}

const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#64748B'];

// Mini Sparkline component
const Sparkline = ({ data, color = '#10B981' }: { data: number[]; color?: string }) => {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const points = data
    .map((val, index) => {
      const x = (index / (data.length - 1)) * 60;
      const y = 20 - ((val - min) / range) * 15;
      return `${x},${y}`;
    })
    .join(' ');
  return (
    <svg className="w-16 h-8 shrink-0 overflow-visible" viewBox="0 0 60 20">
      <polyline fill="none" stroke={color} strokeWidth="1.5" points={points} />
    </svg>
  );
};

export default function FinanceDashboard({ dashboardData, isLoading, onNavigateToTab }: DashboardProps) {
  const { t } = useTranslation('finance');
  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-28 bg-muted rounded-xl border border-border" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 h-80 bg-muted rounded-xl border border-border" />
          <div className="h-80 bg-muted rounded-xl border border-border" />
        </div>
      </div>
    );
  }

  // Fallback defaults
  const d = dashboardData || {};
  const revToday = d.revenueToday ?? 0;
  const revMonth = d.revenueMonth ?? 0;
  const expToday = d.expensesToday ?? 0;
  const expMonth = d.expensesMonth ?? 0;
  const netProfit = d.netProfit ?? 0;
  const cashAvailable = d.cashAvailable ?? 0;
  const inventoryValue = d.inventoryValue ?? 0;
  const outstandingPayments = d.outstandingPayments ?? 0;
  const budgetUtilization = d.budgetUtilization ?? 0;
  const roi = d.roi ?? 0;

  const nowStr = new Date().toLocaleTimeString();

  return (
    <div className="space-y-8 sf-stagger p-1 animate-fade-in">
      
      {/* 1. TOP KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* Revenue Today */}
        <div className="bg-card/85 backdrop-blur p-4 rounded-xl border border-border flex flex-col justify-between shadow-sm relative overflow-hidden transition-all hover:shadow-md hover:border-emerald-500/10">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{t('cards.revenueToday')}</span>
            <span className="text-[9px] text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded-full flex items-center font-bold">
              <ArrowUpRight className="w-2.5 h-2.5 mr-0.5" /> +4%
            </span>
          </div>
          <div className="my-2.5">
            <h3 className="text-xl font-black text-foreground">₹{revToday.toLocaleString()}</h3>
            <span className="text-[8px] text-muted-foreground block">{t('status.lastSync')}: {nowStr}</span>
          </div>
          <div className="flex justify-between items-center pt-1 border-t border-border/30">
            <span className="text-[9px] font-semibold text-muted-foreground">{t('cards.revenueMonth')}: ₹{revMonth.toLocaleString()}</span>
            <Sparkline data={[10, 15, 8, 20, 25, revToday > 0 ? 30 : 10]} color="#10B981" />
          </div>
        </div>

        {/* Expenses Today */}
        <div className="bg-card/85 backdrop-blur p-4 rounded-xl border border-border flex flex-col justify-between shadow-sm relative overflow-hidden transition-all hover:shadow-md hover:border-red-500/10">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{t('cards.expensesToday')}</span>
            <span className="text-[9px] text-red-600 bg-red-500/10 px-1.5 py-0.5 rounded-full flex items-center font-bold">
              <ArrowDownRight className="w-2.5 h-2.5 mr-0.5" /> -2%
            </span>
          </div>
          <div className="my-2.5">
            <h3 className="text-xl font-black text-foreground">₹{expToday.toLocaleString()}</h3>
            <span className="text-[8px] text-muted-foreground block">{t('status.lastSync')}: {nowStr}</span>
          </div>
          <div className="flex justify-between items-center pt-1 border-t border-border/30">
            <span className="text-[9px] font-semibold text-muted-foreground">{t('cards.expensesMonth')}: ₹{expMonth.toLocaleString()}</span>
            <Sparkline data={[30, 25, 28, 12, 10, expToday > 0 ? 15 : 5]} color="#EF4444" />
          </div>
        </div>

        {/* Net Profit */}
        <div className="bg-card/85 backdrop-blur p-4 rounded-xl border border-border flex flex-col justify-between shadow-sm relative overflow-hidden transition-all hover:shadow-md">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{t('cards.netProfit')}</span>
            <span className="text-[9px] text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded-full flex items-center font-bold">
              <ArrowUpRight className="w-2.5 h-2.5 mr-0.5" /> +12%
            </span>
          </div>
          <div className="my-2.5">
            <h3 className={`text-xl font-black ${netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              ₹{netProfit.toLocaleString()}
            </h3>
            <span className="text-[8px] text-muted-foreground block">{t('badges.stable')}</span>
          </div>
          <div className="flex justify-between items-center pt-1 border-t border-border/30">
            <span className="text-[9px] font-semibold text-muted-foreground">{t('badges.efficiency')}</span>
            <Sparkline data={[5, 12, 15, 10, 18, netProfit > 0 ? 25 : 5]} color="#10B981" />
          </div>
        </div>

        {/* Cash Available */}
        <div className="bg-card/85 backdrop-blur p-4 rounded-xl border border-border flex flex-col justify-between shadow-sm relative overflow-hidden transition-all hover:shadow-md">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{t('cards.cashAvailable')}</span>
            <span className="text-[9px] text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded-full flex items-center font-bold">
              <ArrowUpRight className="w-2.5 h-2.5 mr-0.5" /> {t('badges.stable')}
            </span>
          </div>
          <div className="my-2.5">
            <h3 className="text-xl font-black text-foreground">₹{cashAvailable.toLocaleString()}</h3>
            <span className="text-[8px] text-muted-foreground block">{t('badges.stable')}</span>
          </div>
          <div className="flex justify-between items-center pt-1 border-t border-border/30">
            <span className="text-[9px] font-semibold text-muted-foreground">{t('cards.cashAvailable')}</span>
            <Sparkline data={[40, 42, 38, 45, 50, cashAvailable > 0 ? 55 : 40]} color="#3B82F6" />
          </div>
        </div>

        {/* Inventory Value */}
        <div className="bg-card/85 backdrop-blur p-4 rounded-xl border border-border flex flex-col justify-between shadow-sm relative overflow-hidden transition-all hover:shadow-md">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{t('cards.inventoryValue')}</span>
            <span className="text-[9px] text-blue-600 bg-blue-500/10 px-1.5 py-0.5 rounded-full flex items-center font-bold">
              {t('badges.assetValue')}
            </span>
          </div>
          <div className="my-2.5">
            <h3 className="text-xl font-black text-foreground">₹{inventoryValue.toLocaleString()}</h3>
            <span className="text-[8px] text-muted-foreground block">{t('badges.assetValue')}</span>
          </div>
          <div className="flex justify-between items-center pt-1 border-t border-border/30">
            <span className="text-[9px] font-semibold text-muted-foreground">{t('cards.inventoryValue')}</span>
            <Sparkline data={[20, 22, 25, 24, 28, inventoryValue > 0 ? 30 : 20]} color="#8B5CF6" />
          </div>
        </div>

        {/* Outstanding Payments */}
        <div className="bg-card/85 backdrop-blur p-4 rounded-xl border border-border flex flex-col justify-between shadow-sm relative overflow-hidden transition-all hover:shadow-md">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{t('cards.outstandingPayments')}</span>
            <span className="text-[9px] text-amber-600 bg-amber-500/10 px-1.5 py-0.5 rounded-full flex items-center font-bold">
              {t('badges.receivables')}
            </span>
          </div>
          <div className="my-2.5">
            <h3 className="text-xl font-black text-foreground">₹{outstandingPayments.toLocaleString()}</h3>
            <span className="text-[8px] text-muted-foreground block">{t('badges.receivables')}</span>
          </div>
          <div className="flex justify-between items-center pt-1 border-t border-border/30">
            <span className="text-[9px] font-semibold text-muted-foreground">{t('cards.outstandingPayments')}</span>
            <Sparkline data={[10, 8, 12, 14, 15, outstandingPayments > 0 ? 20 : 10]} color="#F59E0B" />
          </div>
        </div>

        {/* Budget Utilization */}
        <div className="bg-card/85 backdrop-blur p-4 rounded-xl border border-border flex flex-col justify-between shadow-sm relative overflow-hidden transition-all hover:shadow-md">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{t('cards.budgetUtilization')}</span>
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${budgetUtilization > 90 ? 'text-red-600 bg-red-500/10' : 'text-primary bg-primary/10'}`}>
              {budgetUtilization}% {t('badges.used')}
            </span>
          </div>
          <div className="my-2.5">
            <h3 className="text-xl font-black text-foreground">{budgetUtilization}%</h3>
            <span className="text-[8px] text-muted-foreground block">{t('cards.budgetUtilization')}</span>
          </div>
          <div className="flex justify-between items-center pt-1 border-t border-border/30">
            <span className="text-[9px] font-semibold text-muted-foreground">{t('cards.budgetUtilization')}</span>
            <Sparkline data={[60, 65, 70, 75, 78, budgetUtilization > 0 ? budgetUtilization : 40]} color="#10B981" />
          </div>
        </div>

        {/* Return on Investment (ROI) */}
        <div className="bg-card/85 backdrop-blur p-4 rounded-xl border border-border flex flex-col justify-between shadow-sm relative overflow-hidden transition-all hover:shadow-md">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{t('cards.roi')}</span>
            <span className="text-[9px] text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded-full flex items-center font-bold">
              {t('badges.efficiency')}
            </span>
          </div>
          <div className="my-2.5">
            <h3 className="text-xl font-black text-foreground">{roi}%</h3>
            <span className="text-[8px] text-muted-foreground block">{t('cards.roi')}</span>
          </div>
          <div className="flex justify-between items-center pt-1 border-t border-border/30">
            <span className="text-[9px] font-semibold text-muted-foreground">{t('cards.roi')}</span>
            <Sparkline data={[10, 15, 20, 22, 28, roi > 0 ? roi : 15]} color="#10B981" />
          </div>
        </div>

      </div>

      {/* 2. REAL-TIME ALERTS & AI FINANCIAL INSIGHTS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Real-time Alerts */}
        <div className="bg-card p-5 rounded-xl border border-border shadow-sm flex flex-col justify-between">
          <div>
            <h4 className="text-sm font-bold text-foreground mb-1">{t('dashboard.alerts')}</h4>
            <p className="text-[10px] text-muted-foreground mb-4">{t('dashboard.alertsSubtitle')}</p>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto max-h-[160px] pr-1">
            {d.alerts && d.alerts.length > 0 ? (
              d.alerts.map((alert: any, idx: number) => (
                <div key={idx} className="flex gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg animate-fade-in items-center">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <div>
                    <h5 className="text-xs font-bold text-red-800">{alert.title}</h5>
                    <p className="text-[10px] text-red-700">{alert.description}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex gap-3 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg items-center">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <div>
                  <h5 className="text-xs font-bold text-emerald-800">{t('alerts.operationalStable')}</h5>
                  <p className="text-[10px] text-emerald-700">{t('alerts.operationalStableDescription')}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* AI Recommendations */}
        <div className="bg-card p-5 rounded-xl border border-border shadow-sm flex flex-col justify-between">
          <div>
            <h4 className="text-sm font-bold text-foreground flex items-center gap-1.5 mb-1">
              <Sparkles className="w-4.5 h-4.5 text-primary" /> {t('dashboard.aiInsights')}
            </h4>
            <p className="text-[10px] text-muted-foreground mb-4">{t('dashboard.aiInsightsSubtitle')}</p>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto max-h-[160px] pr-1">
            {d.aiInsights && d.aiInsights.map((ins: any, idx: number) => (
              <div key={idx} className="flex gap-3 p-3 bg-primary/5 border border-primary/10 rounded-lg animate-fade-in">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                <div>
                  <h5 className="text-xs font-bold text-foreground">{ins.title}</h5>
                  <p className="text-[10px] text-muted-foreground">{ins.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. CHARTS OVERVIEW GRID (Housed for future release) */}
      {false && (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Revenue vs Expenses */}
        <div className="bg-card p-5 rounded-xl border border-border shadow-sm">
          <h4 className="text-sm font-bold text-foreground mb-1">Revenue vs Expenses</h4>
          <p className="text-[10px] text-muted-foreground mb-4">Comparison of income stream and outflows</p>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={d.revenueVsExpenses}>
                <XAxis dataKey="name" fontSize={9} tickLine={false} axisLine={false} />
                <YAxis fontSize={9} tickLine={false} axisLine={false} />
                <Tooltip />
                <Bar dataKey="revenue" fill="#10B981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" fill="#EF4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Cash Flow */}
        <div className="bg-card p-5 rounded-xl border border-border shadow-sm">
          <h4 className="text-sm font-bold text-foreground mb-1">Monthly Cash Flow</h4>
          <p className="text-[10px] text-muted-foreground mb-4">Net cash flow trajectory</p>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={d.monthlyCashFlow}>
                <defs>
                  <linearGradient id="flowGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" fontSize={9} tickLine={false} axisLine={false} />
                <YAxis fontSize={9} tickLine={false} axisLine={false} />
                <Tooltip />
                <Area type="monotone" dataKey="value" stroke="#3B82F6" fillOpacity={1} fill="url(#flowGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Profit Trend */}
        <div className="bg-card p-5 rounded-xl border border-border shadow-sm">
          <h4 className="text-sm font-bold text-foreground mb-1">Profit Trend</h4>
          <p className="text-[10px] text-muted-foreground mb-4">Farm profit line fluctuations</p>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={d.profitTrend}>
                <XAxis dataKey="date" fontSize={9} tickLine={false} axisLine={false} />
                <YAxis fontSize={9} tickLine={false} axisLine={false} />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#10B981" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expense Breakdown */}
        <div className="bg-card p-5 rounded-xl border border-border shadow-sm">
          <h4 className="text-sm font-bold text-foreground mb-1">Expense Breakdown</h4>
          <p className="text-[10px] text-muted-foreground mb-4">Distribution by category</p>
          <div className="h-52 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={d.expenseBreakdown} innerRadius={45} outerRadius={60} paddingAngle={3} dataKey="value">
                  {d.expenseBreakdown?.map((_, idx) => (
                    <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-2 text-[9px] font-semibold max-h-16 overflow-y-auto mt-2">
            {d.expenseBreakdown?.map((entry, idx) => (
              <div key={idx} className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                <span className="text-muted-foreground truncate">{entry.name.replace('_', ' ')}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Revenue Sources */}
        <div className="bg-card p-5 rounded-xl border border-border shadow-sm">
          <h4 className="text-sm font-bold text-foreground mb-1">Revenue Sources</h4>
          <p className="text-[10px] text-muted-foreground mb-4">Top contributors to income</p>
          <div className="h-52 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={d.revenueSources} innerRadius={45} outerRadius={60} paddingAngle={3} dataKey="value">
                  {d.revenueSources?.map((_, idx) => (
                    <Cell key={`cell-${idx}`} fill={COLORS[(idx + 2) % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-2 text-[9px] font-semibold max-h-16 overflow-y-auto mt-2">
            {d.revenueSources?.map((entry, idx) => (
              <div key={idx} className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[(idx + 2) % COLORS.length] }} />
                <span className="text-muted-foreground truncate">{entry.name.replace('_', ' ')}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Budget Usage */}
        <div className="bg-card p-5 rounded-xl border border-border shadow-sm">
          <h4 className="text-sm font-bold text-foreground mb-1">Budget Usage comparison</h4>
          <p className="text-[10px] text-muted-foreground mb-4">Budget limit vs. actual spending</p>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={d.budgetUsage}>
                <XAxis dataKey="category" fontSize={9} tickLine={false} axisLine={false} tickFormatter={(v) => v.substring(0,6)} />
                <YAxis fontSize={9} tickLine={false} axisLine={false} />
                <Tooltip />
                <Bar dataKey="limit" fill="#CBD5E1" radius={[2, 2, 0, 0]} />
                <Bar dataKey="spent" fill="#8B5CF6" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Farm-wise Profit */}
        <div className="bg-card p-5 rounded-xl border border-border shadow-sm">
          <h4 className="text-sm font-bold text-foreground mb-1">Farm-wise Profit</h4>
          <p className="text-[10px] text-muted-foreground mb-4">Net profit per active farm location</p>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={d.farmWiseProfit}>
                <XAxis dataKey="farm" fontSize={9} tickLine={false} axisLine={false} />
                <YAxis fontSize={9} tickLine={false} axisLine={false} />
                <Tooltip />
                <Bar dataKey="profit" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Field-wise Cost */}
        <div className="bg-card p-5 rounded-xl border border-border shadow-sm">
          <h4 className="text-sm font-bold text-foreground mb-1">Field-wise Cost</h4>
          <p className="text-[10px] text-muted-foreground mb-4">Operational costs split across fields</p>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={d.fieldWiseCost}>
                <XAxis dataKey="field" fontSize={9} tickLine={false} axisLine={false} />
                <YAxis fontSize={9} tickLine={false} axisLine={false} />
                <Tooltip />
                <Bar dataKey="cost" fill="#F59E0B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Inventory Purchase Trend */}
        <div className="bg-card p-5 rounded-xl border border-border shadow-sm">
          <h4 className="text-sm font-bold text-foreground mb-1">Inventory Purchase Trend</h4>
          <p className="text-[10px] text-muted-foreground mb-4">Outlays on stock purchases over time</p>
          <div className="h-60">
            {d.inventoryPurchaseTrend?.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
                No inventory purchase transactions found.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={d.inventoryPurchaseTrend}>
                  <XAxis dataKey="date" fontSize={9} tickLine={false} axisLine={false} />
                  <YAxis fontSize={9} tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="value" stroke="#8B5CF6" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

      </div>
      )}

      {/* 4. BUDGET PROGRESS STATUS */}
      <div className="bg-card p-5 rounded-xl border border-border shadow-sm">
        <h4 className="text-sm font-bold text-foreground mb-1">{t('dashboard.budgetUtilization')}</h4>
        <p className="text-[10px] text-muted-foreground mb-4">{t('dashboard.budgetUtilizationSubtitle')}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {d.budgetUsage && d.budgetUsage.map((item: any, idx: number) => {
            const percent = Math.min((item.spent / (item.limit || 1)) * 100, 100);
            const overrun = item.spent > item.limit;
            return (
              <div key={idx} className="bg-background border border-border p-4 rounded-lg space-y-2">
                <div className="flex justify-between items-start text-xs font-semibold text-foreground">
                  <span className="font-bold truncate">{item.category.replace('_', ' ')}</span>
                  <span className={overrun ? 'text-amber-600' : 'text-primary'}>{Math.round(percent)}%</span>
                </div>
                <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${overrun ? 'bg-amber-600' : 'bg-primary'}`} style={{ width: `${percent}%` }} />
                </div>
                <div className="flex justify-between text-[9px] text-muted-foreground">
                  <span>{t('ledger.spent')}: ₹{item.spent}</span>
                  <span>{t('ledger.limit')}: ₹{item.limit}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. TOP CATEGORIES & TIMELINE FEED */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Top Expenses & Revenues Table */}
        <div className="bg-card p-5 rounded-xl border border-border shadow-sm flex flex-col justify-between">
          <div>
            <h4 className="text-sm font-bold text-foreground mb-1">{t('dashboard.topExpenses')}</h4>
            <p className="text-[10px] text-muted-foreground mb-4">{t('dashboard.topExpensesSubtitle')}</p>
            <div className="space-y-3">
              {d.topExpenses && d.topExpenses.map((exp: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between text-xs border-b border-border/50 pb-2">
                  <span className="font-bold text-foreground">{exp.category.replace('_', ' ')}</span>
                  <span className="font-semibold">₹{exp.amount.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-border/30">
            <h4 className="text-sm font-bold text-foreground mb-1">{t('dashboard.topRevenue')}</h4>
            <p className="text-[10px] text-muted-foreground mb-4">{t('dashboard.topRevenueSubtitle')}</p>
            <div className="space-y-3">
              {d.topRevenue && d.topRevenue.map((rev: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between text-xs border-b border-border/50 pb-2">
                  <span className="font-bold text-foreground">{rev.category.replace('_', ' ')}</span>
                  <span className="font-semibold text-emerald-600">₹{rev.amount.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Financial Activities Timeline */}
        <div className="bg-card p-5 rounded-xl border border-border shadow-sm lg:col-span-2">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h4 className="text-sm font-bold text-foreground">{t('dashboard.recentActivities')}</h4>
              <p className="text-[10px] text-muted-foreground">{t('dashboard.recentActivitiesSubtitle')}</p>
            </div>
            <button
              onClick={() => onNavigateToTab('transactions')}
              className="text-[10px] text-primary font-bold uppercase hover:underline"
            >
              {t('buttons.goToLedger')}
            </button>
          </div>

          <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
            {d.activities && d.activities.map((act: any) => {
              const isRev = act.transactionType === 'REVENUE';
              return (
                <div key={act.id} className="flex gap-4 items-start text-xs border-b border-border/40 pb-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 ${isRev ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'}`}>
                    {isRev ? 'IN' : 'OUT'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <span className="font-bold text-foreground block truncate">{act.category.replace('_', ' ')}</span>
                      <span className={`font-black ${isRev ? 'text-emerald-600' : 'text-foreground'}`}>
                        {isRev ? '+' : '-'} ₹{act.amount}
                      </span>
                    </div>
                    <div className="flex justify-between text-[10px] text-muted-foreground mt-0.5">
                      <span>Ref: #{act.refNumber} • {act.farm}</span>
                      <span>{new Date(act.timestamp).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
}

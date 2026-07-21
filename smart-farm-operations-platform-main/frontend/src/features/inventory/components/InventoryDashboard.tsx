import { useTranslation } from 'react-i18next';
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { AlertCircle, ArrowUpRight, Package, TrendingDown } from 'lucide-react';
import type { InventoryItem, Warehouse, InventoryCategory } from '@/types/domain';

interface DashboardProps {
  items: InventoryItem[];
  warehouses: Warehouse[];
  categories: InventoryCategory[];
  onNavigateToTab: (tab: string) => void;
}

export default function InventoryDashboard({ items, warehouses, categories, onNavigateToTab }: DashboardProps) {
  const { t, i18n } = useTranslation('inventory');
  const isTa = i18n.language === 'ta';
  
  // Real-time state from store (Commented out since IoT panel is deactivated)
  // const { simulatedTankLevel, simulatedFertilizerLevel, simulateDepletion, resetSimulation } = useInventoryStore();

  // Summary Metrics calculations
  const totalItems = items.length;
  const lowStockItems = items.filter(item => item.currentQuantity > 0 && item.currentQuantity <= item.minimumStock).length;
  const outOfStockItems = items.filter(item => item.currentQuantity <= 0).length;
  
  const totalValue = items.reduce((acc, item) => {
    return acc + (item.currentQuantity * (item.cost || 0));
  }, 0);



  // Chart 1: Stock by Category
  const categoryDataMap: Record<string, number> = {};
  items.forEach(item => {
    const matchedCategory = categories.find(c => c.id === item.categoryId || c.id === item.category?.id);
    const cat = matchedCategory ? (isTa && matchedCategory.nameTa ? matchedCategory.nameTa : matchedCategory.name) : (item.category?.name || 'Unassigned');
    categoryDataMap[cat] = (categoryDataMap[cat] || 0) + 1;
  });
  const categoryChartData = Object.entries(categoryDataMap).map(([name, value]) => ({ name, value }));

  // Chart 2: Warehouse Occupancy
  const warehouseDataMap: Record<string, number> = {};
  items.forEach(item => {
    const matchedWarehouse = warehouses.find(w => w.id === item.warehouseId || w.id === item.warehouse?.id);
    const wh = matchedWarehouse ? (isTa && matchedWarehouse.nameTa ? matchedWarehouse.nameTa : matchedWarehouse.name) : (item.warehouse?.name || 'Shed/Unassigned');
    warehouseDataMap[wh] = (warehouseDataMap[wh] || 0) + (item.currentQuantity * (item.cost || 1));
  });
  const warehouseChartData = Object.entries(warehouseDataMap).map(([name, value]) => ({ name, value }));

  const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

  return (
    <div className="space-y-6 sf-stagger">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="sf-card p-5 bg-background border border-border flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-muted-foreground uppercase">{t('total_items')}</span>
            <h3 className="text-2xl font-bold tracking-tight text-foreground mt-1">{totalItems}</h3>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
            <Package className="w-5 h-5" />
          </div>
        </div>

        <div 
          onClick={() => onNavigateToTab('items')} 
          className="sf-card p-5 bg-background border border-border flex items-center justify-between cursor-pointer hover:border-amber-500/30 transition-all"
        >
          <div>
            <span className="text-xs font-semibold text-muted-foreground uppercase">{t('low_stock')}</span>
            <h3 className="text-2xl font-bold tracking-tight text-amber-500 mt-1">{lowStockItems}</h3>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>

        <div 
          onClick={() => onNavigateToTab('items')} 
          className="sf-card p-5 bg-background border border-border flex items-center justify-between cursor-pointer hover:border-red-500/30 transition-all"
        >
          <div>
            <span className="text-xs font-semibold text-muted-foreground uppercase">{t('out_of_stock')}</span>
            <h3 className="text-2xl font-bold tracking-tight text-red-500 mt-1">{outOfStockItems}</h3>
          </div>
          <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center text-red-500">
            <TrendingDown className="w-5 h-5" />
          </div>
        </div>

        <div className="sf-card p-5 bg-background border border-border flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-muted-foreground uppercase">{t('total_value')}</span>
            <h3 className="text-2xl font-bold tracking-tight text-foreground mt-1">
              ₹{totalValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </h3>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
            <ArrowUpRight className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Real-time Simulated IoT Telemetry Panel (Commented out for future use)
      <div className="sf-card p-6 border border-border bg-gradient-to-r from-primary/5 to-emerald-500/5 dark:from-primary/10 dark:to-emerald-500/10">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-emerald-500 animate-pulse" />
            <div>
              <h3 className="text-sm font-bold text-foreground">IoT Telemetry & Automated Consumption (Simulated)</h3>
              <p className="text-xs text-muted-foreground">Water tanks, silos, and automatic nutrient dispensaries broadcast state updates in real-time.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => simulateDepletion(350, 15)} 
              className="text-[10px] font-bold uppercase bg-primary hover:bg-primary-hover text-primary-foreground py-1.5 px-3 rounded-lg transition-all"
            >
              Trigger Activity Depletion
            </button>
            <button 
              onClick={resetSimulation} 
              className="text-[10px] font-bold uppercase border border-border hover:bg-muted py-1.5 px-3 rounded-lg transition-all"
            >
              Reset
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-muted-foreground">Main Water Tank Capacity</span>
              <span className="text-emerald-500 font-bold">{simulatedTankLevel.toLocaleString()} Liters</span>
            </div>
            <div className="h-2 w-full bg-border rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 transition-all duration-700" 
                style={{ width: `${(simulatedTankLevel / 15000) * 100}%` }}
              />
            </div>
            <span className="text-[10px] text-muted-foreground block">Sensor Node #WT-01 • Active • updates automatically</span>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-muted-foreground">Silo Nitrogen NPK level</span>
              <span className="text-amber-500 font-bold">{simulatedFertilizerLevel} kg / 500 kg</span>
            </div>
            <div className="h-2 w-full bg-border rounded-full overflow-hidden">
              <div 
                className="h-full bg-amber-500 transition-all duration-700" 
                style={{ width: `${(simulatedFertilizerLevel / 500) * 100}%` }}
              />
            </div>
            <span className="text-[10px] text-muted-foreground block">Silo Dispenser #SD-04 • Active • updates automatically</span>
          </div>
        </div>
      </div>
      */}

      {/* Recharts Graphics Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1 */}
        <div className="sf-card p-6 border border-border bg-background">
          <h3 className="text-sm font-bold text-foreground mb-4">Stock Value Distribution (By Warehouse)</h3>
          <div className="h-64">
            {warehouseChartData.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground text-xs">
                No items with value data.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={warehouseChartData}>
                  <XAxis dataKey="name" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value}`} />
                  <Tooltip formatter={(value) => `₹${value}`} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {warehouseChartData.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Chart 2 */}
        <div className="sf-card p-6 border border-border bg-background">
          <h3 className="text-sm font-bold text-foreground mb-4">Stock count by Category</h3>
          <div className="h-64 flex items-center">
            {categoryChartData.length === 0 ? (
              <div className="flex items-center justify-center w-full h-full text-muted-foreground text-xs">
                No categories mapping.
              </div>
            ) : (
              <>
                <div className="w-1/2 h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {categoryChartData.map((_entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-1/2 space-y-2">
                  {categoryChartData.map((entry, index) => (
                    <div key={entry.name} className="flex items-center gap-2 text-xs">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                      <span className="font-semibold text-foreground truncate">{entry.name}</span>
                      <span className="text-muted-foreground ml-auto">({entry.value})</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* AI Smart Recommendations panel (Commented out for future use)
      <div className="sf-card p-6 border border-border bg-background">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-primary" />
          <h3 className="text-sm font-bold text-foreground">{t('ai_recommendations')}</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/[0.02] space-y-2">
            <div className="flex justify-between items-start">
              <span className="text-xs font-bold text-amber-600 bg-amber-500/10 py-0.5 px-2 rounded-full">Reorder Forecast</span>
              <span className="text-[10px] text-muted-foreground">Confidence: 94%</span>
            </div>
            <h4 className="text-sm font-semibold text-foreground">Fertilizer depletion predicted within 12 days</h4>
            <p className="text-xs text-muted-foreground">NPK fertilizer is depleted at 15kg/day due to ongoing cotton irrigation cycles. We recommend placing a reorder of 300kg with Organic Agra Supplies.</p>
          </div>

          <div className="p-4 rounded-xl border border-blue-500/20 bg-blue-500/[0.02] space-y-2">
            <div className="flex justify-between items-start">
              <span className="text-xs font-bold text-blue-600 bg-blue-500/10 py-0.5 px-2 rounded-full">Usage Anomaly</span>
              <span className="text-[10px] text-muted-foreground">Confidence: 89%</span>
            </div>
            <h4 className="text-sm font-semibold text-foreground">Unusual Fuel consumption rate detected</h4>
            <p className="text-xs text-muted-foreground">Tractor Diesel usage spiked by 40% yesterday compared to standard cultivation profiles for field B. Check tractor diagnostic logs or coordinate with field workers.</p>
          </div>
        </div>
      </div>
      */}
    </div>
  );
}

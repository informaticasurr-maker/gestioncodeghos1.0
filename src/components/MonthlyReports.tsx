import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  PieChart as PieIcon,
  Smartphone,
  Laptop,
  CheckCircle,
  Clock,
  Award,
  DollarSign,
  Calendar,
  Layers,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { useApp } from '../context/AppContext';

export const MonthlyReports: React.FC = () => {
  const { orders, formatMoney, companySettings } = useApp();
  const [selectedPeriod, setSelectedPeriod] = useState<'30days' | 'all'>('all');

  // Colors for charts
  const COLORS = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#64748b'];

  // Metrics computation
  const metrics = useMemo(() => {
    const totalOrders = orders.length;
    const completedOrders = orders.filter((o) => o.status === 'entregado' || o.status === 'listo_entrega');
    const totalRevenue = orders.reduce((sum, o) => sum + o.depositPaid, 0);
    const totalPotential = orders.reduce((sum, o) => sum + o.totalAmount, 0);

    const approvedBudgets = orders.filter(
      (o) => o.status !== 'presupuesto_rechazado' && o.status !== 'cancelado' && o.status !== 'recibido'
    ).length;
    const rejectedBudgets = orders.filter((o) => o.status === 'presupuesto_rechazado').length;
    const budgetConversionRate =
      approvedBudgets + rejectedBudgets > 0
        ? Math.round((approvedBudgets / (approvedBudgets + rejectedBudgets)) * 100)
        : 100;

    const avgTicket = totalOrders > 0 ? Math.round(totalPotential / totalOrders) : 0;

    // Device breakdown
    const deviceCounts: Record<string, number> = {};
    orders.forEach((o) => {
      let typeLabel = 'Otros';
      if (o.device.type === 'smartphone') typeLabel = 'Móviles / Celulares';
      else if (o.device.type === 'notebook') typeLabel = 'Notebooks / Laptops';
      else if (o.device.type === 'tablet') typeLabel = 'Tablets / iPads';
      else if (o.device.type === 'pc') typeLabel = 'PC / All-in-One';
      else if (o.device.type === 'console') typeLabel = 'Consolas';
      deviceCounts[typeLabel] = (deviceCounts[typeLabel] || 0) + 1;
    });

    const deviceData = Object.entries(deviceCounts).map(([name, value]) => ({
      name,
      value,
    }));

    // Brand breakdown
    const brandCounts: Record<string, number> = {};
    orders.forEach((o) => {
      const b = o.device.brand.trim() || 'Genérico';
      brandCounts[b] = (brandCounts[b] || 0) + 1;
    });
    const topBrands = Object.entries(brandCounts)
      .map(([brand, count]) => ({ brand, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Status breakdown
    const statusCounts: Record<string, number> = {};
    orders.forEach((o) => {
      statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
    });

    // Monthly revenue simulation data based on orders
    const monthlyData = [
      { month: 'May 2026', facturado: 240000, cobrado: 220000, reparaciones: 6 },
      { month: 'Jun 2026', facturado: 310000, cobrado: 290000, reparaciones: 9 },
      { month: 'Jul 2026', facturado: 420000, cobrado: 380000, reparaciones: 12 },
      {
        month: 'Ago 2026 (Actual)',
        facturado: totalPotential,
        cobrado: totalRevenue,
        reparaciones: totalOrders,
      },
    ];

    return {
      totalOrders,
      completedOrdersCount: completedOrders.length,
      totalRevenue,
      totalPotential,
      budgetConversionRate,
      avgTicket,
      deviceData,
      topBrands,
      monthlyData,
    };
  }, [orders]);

  return (
    <div className="space-y-4">
      
      {/* Title Header */}
      <div className="bg-white p-4 sm:p-6 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-600" />
            <span>Reportes Estadísticos y Rendimiento del Taller</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Métricas mensuales de facturación, efectividad de presupuestos, equipos más atendidos y marcas líderes.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="font-semibold text-slate-600">Período:</span>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value as any)}
            className="p-1.5 border border-slate-300 rounded-lg bg-slate-50 text-slate-700 font-medium"
          >
            <option value="all">Histórico Completo (2026)</option>
            <option value="30days">Últimos 30 días</option>
          </select>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Ticket Promedio</span>
            <DollarSign className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-xl font-black text-slate-900 font-mono mt-1">
            {formatMoney(metrics.avgTicket)}
          </p>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Por orden de servicio</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Aprobación de Presupuestos</span>
            <CheckCircle className="w-4 h-4 text-teal-600" />
          </div>
          <p className="text-xl font-black text-teal-600 font-mono mt-1">
            {metrics.budgetConversionRate}%
          </p>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Tasa de conversión positiva</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Reparaciones Completadas</span>
            <Award className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-xl font-black text-slate-900 font-mono mt-1">
            {metrics.completedOrdersCount} / {metrics.totalOrders}
          </p>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Entregadas o listas p/ retiro</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Tiempo Medio de Entrega</span>
            <Clock className="w-4 h-4 text-sky-600" />
          </div>
          <p className="text-xl font-black text-slate-900 font-mono mt-1">
            2.4 días
          </p>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Promedio turno de taller</span>
        </div>

      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Monthly Revenue Bar Chart */}
        <div className="lg:col-span-2 bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-600" />
              <span>Evolución Mensual de Facturación & Cobros</span>
            </h3>
            <span className="text-xs text-slate-500 font-medium">Valores en {companySettings.currency}</span>
          </div>

          <div className="h-64 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.monthlyData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(value: any) => [formatMoney(Number(value)), '']}
                  contentStyle={{ backgroundColor: '#1e293b', color: '#fff', borderRadius: '8px', border: 'none', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar dataKey="facturado" name="Total Presupuestado" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="cobrado" name="Total Cobrado en Caja" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Device Distribution Pie Chart */}
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2 mb-2">
              <PieIcon className="w-4 h-4 text-indigo-600" />
              <span>Distribución por Tipo de Equipo</span>
            </h3>
            <p className="text-xs text-slate-500 mb-2">Proporción de móviles vs notebooks atendidos.</p>

            <div className="h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={metrics.deviceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {metrics.deviceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: any) => [`${val} orden(es)`, 'Cantidad']}
                    contentStyle={{ backgroundColor: '#1e293b', color: '#fff', borderRadius: '8px', border: 'none', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Legend Items */}
          <div className="space-y-1 pt-2 border-t border-slate-100 text-xs">
            {metrics.deviceData.map((d, idx) => (
              <div key={d.name} className="flex justify-between items-center text-slate-600">
                <span className="flex items-center gap-1.5 truncate">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                  />
                  <span>{d.name}</span>
                </span>
                <span className="font-bold font-mono text-slate-900">{d.value}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Top Brands & Summary Table */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Top Repaired Brands */}
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-sm text-slate-900 mb-3 flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-indigo-600" />
            <span>Marcas Más Atendidas en el Laboratorio</span>
          </h3>

          <div className="space-y-3">
            {metrics.topBrands.map((b, idx) => {
              const percentage = Math.round((b.count / metrics.totalOrders) * 100) || 0;
              return (
                <div key={b.brand} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-800">
                      {idx + 1}. {b.brand}
                    </span>
                    <span className="font-mono text-slate-600">
                      {b.count} equipos ({percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Operational Workshop Summary */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 rounded-xl shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-100 mb-2 flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-400" />
              <span>Resumen Operativo del Taller</span>
            </h3>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              El taller mantiene un flujo constante de servicios con una excelente tasa de conformidad de clientes.
            </p>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between p-2 rounded bg-slate-800 border border-slate-700">
                <span className="text-slate-300">Garantía Estándar Otorgada:</span>
                <span className="font-bold text-indigo-400">{companySettings.orderConfig.defaultWarrantyDays || 90} Días</span>
              </div>
              <div className="flex justify-between p-2 rounded bg-slate-800 border border-slate-700">
                <span className="text-slate-300">Copia de Seguridad:</span>
                <span className="font-bold text-emerald-400">
                  {companySettings.googleDrive.connected ? 'Google Drive Activo' : 'Local'}
                </span>
              </div>
              <div className="flex justify-between p-2 rounded bg-slate-800 border border-slate-700">
                <span className="text-slate-300">Administrador / Técnico:</span>
                <span className="font-bold text-slate-200">{companySettings.defaultTechnician}</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400 text-center">
            Informes exportables y compatibles con planillas contables.
          </div>
        </div>

      </div>

    </div>
  );
};

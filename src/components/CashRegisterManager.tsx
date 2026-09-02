import React, { useState, useMemo } from 'react';
import {
  Wallet,
  ArrowDownRight,
  ArrowUpRight,
  Plus,
  Search,
  Filter,
  Calendar,
  DollarSign,
  FileSpreadsheet,
  Trash2,
  Receipt,
  CreditCard,
  Building2,
  Tag,
  CheckCircle2,
  X,
  Printer,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Scale,
} from 'lucide-react';
import { CashMovement, PaymentMethod } from '../types';
import { useApp } from '../context/AppContext';

export const CashRegisterManager: React.FC = () => {
  const { cashMovements, addCashMovement, deleteCashMovement, formatMoney, companySettings, orders } = useApp();

  const [filterType, setFilterType] = useState<'todos' | 'ingreso' | 'egreso'>('todos');
  const [filterMethod, setFilterMethod] = useState<string>('todos');
  const [filterDateRange, setFilterDateRange] = useState<'hoy' | 'semana' | 'mes' | 'todos'>('hoy');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCloseRegisterModalOpen, setIsCloseRegisterModalOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    type: 'ingreso' as 'ingreso' | 'egreso',
    category: 'Cobro de Reparación',
    amount: 0,
    paymentMethod: 'efectivo' as PaymentMethod,
    description: '',
    recipientOrPayer: '',
  });

  const categoriesIncome = [
    'Cobro de Reparación',
    'Seña de Orden de Trabajo',
    'Venta de Repuesto / Accesorio',
    'Aporte de Capital / Fondo de Caja',
    'Otros Ingresos',
  ];

  const categoriesExpense = [
    'Compra de Repuestos / Insumos',
    'Pago a Proveedor',
    'Gastos Generales / Servicios / Alquiler',
    'Herramientas / Maquinaria',
    'Retiro de Ganancias / Sueldos',
    'Devolución a Cliente',
    'Otros Egresos',
  ];

  // Filtered movements based on date and queries
  const filteredMovements = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay())).getTime();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    return cashMovements.filter((m) => {
      const movementTime = new Date(m.date).getTime();

      let matchDate = true;
      if (filterDateRange === 'hoy') {
        matchDate = movementTime >= startOfToday;
      } else if (filterDateRange === 'semana') {
        matchDate = movementTime >= startOfWeek;
      } else if (filterDateRange === 'mes') {
        matchDate = movementTime >= startOfMonth;
      }

      const matchType = filterType === 'todos' || m.type === filterType;
      const matchMethod = filterMethod === 'todos' || m.paymentMethod === filterMethod;
      const q = (searchQuery || '').toLowerCase().trim();
      const matchSearch =
        !q ||
        (m.concept || '').toLowerCase().includes(q) ||
        (m.description || '').toLowerCase().includes(q) ||
        (m.category || '').toLowerCase().includes(q) ||
        (m.recipientOrPayer || '').toLowerCase().includes(q) ||
        (m.orderNumber || '').toLowerCase().includes(q);

      return matchDate && matchType && matchMethod && matchSearch;
    });
  }, [cashMovements, filterDateRange, filterType, filterMethod, searchQuery]);

  // Overall and filtered financial calculations
  const totals = useMemo(() => {
    let income = 0;
    let expense = 0;
    let cashInDrawer = 0;
    let digitalIncome = 0;

    filteredMovements.forEach((m) => {
      if (m.type === 'ingreso') {
        income += m.amount;
        if (m.paymentMethod === 'efectivo') {
          cashInDrawer += m.amount;
        } else {
          digitalIncome += m.amount;
        }
      } else {
        expense += m.amount;
        if (m.paymentMethod === 'efectivo') {
          cashInDrawer -= m.amount;
        }
      }
    });

    return {
      income,
      expense,
      balance: income - expense,
      cashInDrawer: Math.max(0, cashInDrawer),
      digitalIncome,
    };
  }, [filteredMovements]);

  const handleOpenAdd = (type: 'ingreso' | 'egreso') => {
    setFormData({
      type,
      category: type === 'ingreso' ? 'Cobro de Reparación' : 'Compra de Repuestos / Insumos',
      amount: 0,
      paymentMethod: 'efectivo',
      description: '',
      recipientOrPayer: '',
    });
    setIsAddModalOpen(true);
  };

  const handleSaveMovement = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.amount <= 0) return;

    addCashMovement({
      type: formData.type,
      concept: formData.description.trim() || `${formData.type === 'ingreso' ? 'Ingreso' : 'Egreso'}: ${formData.category}`,
      category: formData.category,
      amount: Number(formData.amount),
      paymentMethod: formData.paymentMethod,
      description: formData.description.trim() || `${formData.type === 'ingreso' ? 'Ingreso' : 'Egreso'}: ${formData.category}`,
      date: new Date().toISOString(),
      recipientOrPayer: formData.recipientOrPayer.trim() || undefined,
    });

    setIsAddModalOpen(false);
  };

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['Fecha', 'Tipo', 'Categoria', 'Monto', 'Metodo', 'Descripcion', 'Orden Ref', 'Pagador/Destinatario'];
    const rows = filteredMovements.map((m) => [
      `"${new Date(m.date).toLocaleString('es-AR')}"`,
      m.type.toUpperCase(),
      `"${m.category}"`,
      m.amount,
      m.paymentMethod,
      `"${m.description.replace(/"/g, '""')}"`,
      `"${m.orderNumber || ''}"`,
      `"${m.recipientOrPayer || ''}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Caja_Taller_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintCloseSheet = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header & Main Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
              Caja Diaria & Movimientos Financieros
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Ingresos de reparaciones, señas, compras de repuestos y cierre de caja
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsCloseRegisterModalOpen(true)}
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-2 transition-colors"
          >
            <Receipt className="w-4 h-4 text-purple-600" />
            <span>Cierre de Caja</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-2 transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Exportar CSV</span>
          </button>

          <button
            onClick={() => handleOpenAdd('egreso')}
            className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-rose-600/20 transition-colors"
          >
            <ArrowDownRight className="w-4 h-4" />
            <span>Registrar Gasto</span>
          </button>

          <button
            onClick={() => handleOpenAdd('ingreso')}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar Ingreso</span>
          </button>
        </div>
      </div>

      {/* Financial Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-medium">Ingresos ({filterDateRange.toUpperCase()})</span>
            <ArrowUpRight className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {formatMoney(totals.income)}
          </div>
          <span className="text-[11px] text-emerald-600/80">Cobros y señas</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-medium">Gastos / Egresos</span>
            <ArrowDownRight className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">
            {formatMoney(totals.expense)}
          </div>
          <span className="text-[11px] text-rose-600/80">Repuestos, insumos y gastos</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-medium">Balance Neto</span>
            <Scale className="w-4 h-4 text-blue-600" />
          </div>
          <div
            className={`text-2xl font-bold ${
              totals.balance >= 0 ? 'text-slate-800 dark:text-slate-100' : 'text-rose-600'
            }`}
          >
            {formatMoney(totals.balance)}
          </div>
          <span className="text-[11px] text-slate-400">Diferencia neta periodo</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-medium">Efectivo en Caja Física</span>
            <Wallet className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
            {formatMoney(totals.cashInDrawer)}
          </div>
          <span className="text-[11px] text-slate-400">
            Digital / MP: {formatMoney(totals.digitalIncome)}
          </span>
        </div>
      </div>

      {/* Date Filter & Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            data-search-input="true"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por descripción, orden OT-2026-..., cliente o proveedor..."
            className="search-input-fluor w-full text-xs sm:text-sm pl-9 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Period selector */}
          <div className="flex rounded-lg border border-slate-200 dark:border-slate-700 p-0.5 bg-slate-50 dark:bg-slate-800 text-xs">
            {(['hoy', 'semana', 'mes', 'todos'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setFilterDateRange(range)}
                className={`px-3 py-1.5 rounded-md font-medium capitalize transition-all ${
                  filterDateRange === range
                    ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {range === 'hoy' ? 'Hoy' : range === 'semana' ? 'Esta Semana' : range === 'mes' ? 'Este Mes' : 'Todo'}
              </button>
            ))}
          </div>

          {/* Type dropdown */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="text-xs sm:text-sm px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none"
          >
            <option value="todos">Todos los tipos</option>
            <option value="ingreso">🟢 Solo Ingresos</option>
            <option value="egreso">🔴 Solo Egresos / Gastos</option>
          </select>

          {/* Payment method dropdown */}
          <select
            value={filterMethod}
            onChange={(e) => setFilterMethod(e.target.value)}
            className="text-xs sm:text-sm px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none"
          >
            <option value="todos">Todos los métodos</option>
            <option value="efectivo">💵 Efectivo</option>
            <option value="transferencia">🏦 Transferencia / CBU</option>
            <option value="mercado_pago">📱 Mercado Pago</option>
            <option value="tarjeta_debito">💳 Tarjeta Débito</option>
            <option value="tarjeta_credito">💳 Tarjeta Crédito</option>
          </select>
        </div>
      </div>

      {/* Movements Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 text-xs font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-3.5">Fecha y Hora</th>
                <th className="p-3.5">Tipo</th>
                <th className="p-3.5">Categoría / Concepto</th>
                <th className="p-3.5">Detalle / Descripción</th>
                <th className="p-3.5">Método de Pago</th>
                <th className="p-3.5 text-right">Monto</th>
                <th className="p-3.5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {filteredMovements.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400 dark:text-slate-500">
                    <Wallet className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="font-medium text-sm">No hay movimientos registrados en este periodo</p>
                    <p className="text-xs text-slate-400 mt-0.5">Los cobros de reparaciones y gastos aparecerán aquí</p>
                  </td>
                </tr>
              ) : (
                filteredMovements.map((m) => {
                  const isIncome = m.type === 'ingreso';

                  return (
                    <tr
                      key={m.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="p-3.5 whitespace-nowrap text-xs text-slate-500 dark:text-slate-400">
                        {new Date(m.date).toLocaleString('es-AR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>

                      <td className="p-3.5">
                        <span
                          className={`inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-bold ${
                            isIncome
                              ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                              : 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                          }`}
                        >
                          {isIncome ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                          {isIncome ? 'Ingreso' : 'Egreso'}
                        </span>
                      </td>

                      <td className="p-3.5 font-medium text-slate-800 dark:text-slate-200">
                        {m.category}
                      </td>

                      <td className="p-3.5 max-w-xs">
                        <div className="truncate font-medium">{m.description}</div>
                        {(m.orderNumber || m.recipientOrPayer) && (
                          <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                            {m.orderNumber && (
                              <span className="font-mono text-blue-600 dark:text-blue-400 font-semibold">
                                {m.orderNumber}
                              </span>
                            )}
                            {m.recipientOrPayer && <span>• {m.recipientOrPayer}</span>}
                          </div>
                        )}
                      </td>

                      <td className="p-3.5 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {m.paymentMethod === 'efectivo' && '💵 Efectivo'}
                          {m.paymentMethod === 'transferencia' && '🏦 Transferencia'}
                          {(m.paymentMethod === 'mercado_pago' || (m.paymentMethod as string) === 'mercadopago') && '📱 Mercado Pago'}
                          {m.paymentMethod === 'tarjeta_debito' && '💳 Débito'}
                          {m.paymentMethod === 'tarjeta_credito' && '💳 Crédito'}
                          {m.paymentMethod === 'otro' && 'Otro'}
                        </span>
                      </td>

                      <td
                        className={`p-3.5 text-right font-bold text-sm ${
                          isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {isIncome ? '+' : '-'}
                        {formatMoney(m.amount)}
                      </td>

                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => {
                            if (confirm('¿Eliminar este movimiento de caja?')) {
                              deleteCashMovement(m.id);
                            }
                          }}
                          className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-500 transition-colors"
                          title="Eliminar registro"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Movement Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div
                  className={`p-2 rounded-xl ${
                    formData.type === 'ingreso' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                  }`}
                >
                  {formData.type === 'ingreso' ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                </div>
                <h3 className="font-bold text-slate-800 dark:text-slate-100">
                  {formData.type === 'ingreso' ? 'Nuevo Ingreso a Caja' : 'Nuevo Egreso / Gasto'}
                </h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMovement} className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setFormData({
                      ...formData,
                      type: 'ingreso',
                      category: 'Cobro de Reparación',
                    });
                  }}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                    formData.type === 'ingreso'
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/20'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-600'
                  }`}
                >
                  🟢 Ingreso (+ Dinero)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFormData({
                      ...formData,
                      type: 'egreso',
                      category: 'Compra de Repuestos / Insumos',
                    });
                  }}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                    formData.type === 'egreso'
                      ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 text-rose-700 dark:text-rose-300 ring-2 ring-rose-500/20'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-600'
                  }`}
                >
                  🔴 Egreso (- Gasto)
                </button>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                  Monto ($) *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={formData.amount || ''}
                  onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                  className="w-full text-lg font-bold px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                    Categoría *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none"
                  >
                    {(formData.type === 'ingreso' ? categoriesIncome : categoriesExpense).map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                    Método de Pago *
                  </label>
                  <select
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value as any })}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none"
                  >
                    <option value="efectivo">💵 Efectivo (Caja Física)</option>
                    <option value="transferencia">🏦 Transferencia Bancaria</option>
                    <option value="mercado_pago">📱 Mercado Pago</option>
                    <option value="tarjeta_debito">💳 Tarjeta Débito</option>
                    <option value="tarjeta_credito">💳 Tarjeta Crédito</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                  Descripción o Concepto
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Ej: Módulo Moto G22 comprado a proveedor Mayorista..."
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                  {formData.type === 'ingreso' ? 'Cliente / Pagador (opcional)' : 'Proveedor / Destinatario (opcional)'}
                </label>
                <input
                  type="text"
                  value={formData.recipientOrPayer}
                  onChange={(e) => setFormData({ ...formData, recipientOrPayer: e.target.value })}
                  placeholder="Ej: Distribuidora Sur / Juan Pérez..."
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 rounded-xl text-white text-xs font-semibold shadow-md ${
                    formData.type === 'ingreso'
                      ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                      : 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20'
                  }`}
                >
                  Registrar Movimiento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cierre de Caja Modal */}
      {isCloseRegisterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-xl p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Receipt className="w-6 h-6 text-purple-600" />
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-slate-100">
                    Planilla de Cierre de Caja
                  </h3>
                  <p className="text-xs text-slate-400">
                    {companySettings.name} • {new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCloseRegisterModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="flex justify-between items-center text-sm font-semibold">
                <span className="text-slate-600 dark:text-slate-400">Total Ingresos Registrados:</span>
                <span className="text-emerald-600 font-bold">{formatMoney(totals.income)}</span>
              </div>
              <div className="flex justify-between items-center text-sm font-semibold">
                <span className="text-slate-600 dark:text-slate-400">Total Egresos / Gastos:</span>
                <span className="text-rose-600 font-bold">-{formatMoney(totals.expense)}</span>
              </div>
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center text-base font-bold">
                <span className="text-slate-800 dark:text-slate-100">Balance Neto del Turno:</span>
                <span className="text-blue-600">{formatMoney(totals.balance)}</span>
              </div>
            </div>

            {/* Breakdown by method */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Desglose por Medio de Cobro
              </h4>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                  <div className="text-slate-500 mb-1">Efectivo en Mano (Cajón)</div>
                  <div className="text-lg font-bold text-amber-600">{formatMoney(totals.cashInDrawer)}</div>
                </div>
                <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                  <div className="text-slate-500 mb-1">Cuentas Digitales (MP / Banco)</div>
                  <div className="text-lg font-bold text-emerald-600">{formatMoney(totals.digitalIncome)}</div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
              <div className="text-xs text-slate-400">
                Técnico / Responsable: {companySettings.defaultTechnician || 'Lucas Almada'}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrintCloseSheet}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimir Planilla</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsCloseRegisterModalOpen(false)}
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-md shadow-purple-600/20"
                >
                  Listo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

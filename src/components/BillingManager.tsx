import React, { useState, useMemo } from 'react';
import {
  ReceiptText,
  DollarSign,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Search,
  Filter,
  Plus,
  Printer,
  Eye,
  Calendar,
  Wallet,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PaymentStatus, PaymentMethod } from '../types';
import { PaymentBadge, StatusBadge } from './StatusBadge';

export const BillingManager: React.FC = () => {
  const {
    orders,
    setSelectedOrderForModal,
    setSelectedOrderForPrint,
    addOrderPayment,
    formatMoney,
  } = useApp();

  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showQuickPayModal, setShowQuickPayModal] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState<PaymentMethod>('efectivo');
  const [payNote, setPayNote] = useState('');

  // Financial calculations
  const stats = useMemo(() => {
    let totalInvoiced = 0;
    let totalCollected = 0;
    let totalPending = 0;
    let totalOrdersWithPending = 0;

    orders.forEach((o) => {
      totalInvoiced += o.totalAmount;
      totalCollected += o.depositPaid;
      totalPending += o.balanceDue;
      if (o.balanceDue > 0) {
        totalOrdersWithPending += 1;
      }
    });

    return {
      totalInvoiced,
      totalCollected,
      totalPending,
      totalOrdersWithPending,
    };
  }, [orders]);

  const filteredOrders = orders.filter((ord) => {
    const matchStatus = paymentFilter === 'all' || ord.paymentStatus === paymentFilter;
    const q = (searchTerm || '').toLowerCase().trim();
    const matchSearch =
      !q ||
      (ord.orderNumber || '').toLowerCase().includes(q) ||
      (ord.client?.name || '').toLowerCase().includes(q) ||
      `${ord.device?.brand || ''} ${ord.device?.model || ''}`.toLowerCase().includes(q);

    return matchStatus && matchSearch;
  });

  const handleOpenQuickPay = (orderId: string) => {
    const ord = orders.find((o) => o.id === orderId);
    if (!ord) return;
    setSelectedOrderId(orderId);
    setPayAmount(ord.balanceDue.toString());
    setPayNote('Cobro de saldo');
    setShowQuickPayModal(true);
  };

  const handleQuickPaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(payAmount);
    if (isNaN(amount) || amount <= 0 || !selectedOrderId) return;

    addOrderPayment(selectedOrderId, amount, payMethod, payNote);
    setShowQuickPayModal(false);
    setSelectedOrderId('');
    setPayAmount('');
    setPayNote('');
  };

  const activeOrderForQuickPay = orders.find((o) => o.id === selectedOrderId);

  return (
    <div className="space-y-4">
      
      {/* Title Header */}
      <div className="bg-white p-4 sm:p-6 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
            <ReceiptText className="w-5 h-5 text-indigo-600" />
            <span>Módulo de Facturación & Control de Cobros</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Gestión de pagos, cobro de señas, control de saldos pendientes y registro de métodos de cobro.
          </p>
        </div>
      </div>

      {/* Financial KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        
        {/* Total Invoiced */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Total Facturado / Presupuestado</span>
            <TrendingUp className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 font-mono mt-1">
            {formatMoney(stats.totalInvoiced)}
          </p>
          <span className="text-[11px] text-slate-400 mt-0.5 block">
            {orders.length} órdenes generadas
          </span>
        </div>

        {/* Total Collected */}
        <div className="bg-emerald-50/70 p-4 rounded-xl border border-emerald-200 shadow-sm">
          <div className="flex items-center justify-between text-emerald-800 text-xs font-semibold">
            <span>Total Cobrado en Caja</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-emerald-700 font-mono mt-1">
            {formatMoney(stats.totalCollected)}
          </p>
          <span className="text-[11px] text-emerald-600 mt-0.5 block">
            Señas y pagos totales acreditados
          </span>
        </div>

        {/* Total Pending */}
        <div className="bg-rose-50/70 p-4 rounded-xl border border-rose-200 shadow-sm">
          <div className="flex items-center justify-between text-rose-800 text-xs font-semibold">
            <span>Saldos Pendientes de Cobro</span>
            <AlertCircle className="w-4 h-4 text-rose-600" />
          </div>
          <p className="text-2xl font-black text-rose-700 font-mono mt-1">
            {formatMoney(stats.totalPending)}
          </p>
          <span className="text-[11px] text-rose-600 mt-0.5 block">
            En {stats.totalOrdersWithPending} órdenes por cobrar
          </span>
        </div>

      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
        
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              data-search-input="true"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por orden, cliente, equipo..."
              className="search-input-fluor w-full text-xs pl-9 pr-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-900"
            />
          </div>

          {/* Payment Status Filter */}
          <div className="flex gap-1">
            {[
              { id: 'all', label: 'Todos' },
              { id: 'pendiente', label: 'Saldo Pendiente' },
              { id: 'seña_parcial', label: 'Seña Parcial' },
              { id: 'pagado', label: '100% Pagados' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setPaymentFilter(f.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  paymentFilter === f.id
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* Orders Invoices Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Orden / Cliente</th>
                <th className="py-3 px-4">Equipo Registrado</th>
                <th className="py-3 px-4">Estado del Pago</th>
                <th className="py-3 px-4 text-right">Total</th>
                <th className="py-3 px-4 text-right">Abonado (Seña)</th>
                <th className="py-3 px-4 text-right">Saldo Restante</th>
                <th className="py-3 px-4 text-center">Acciones de Cobro</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-50/80 transition">
                  {/* Order & Client */}
                  <td className="py-3 px-4 align-top">
                    <div
                      onClick={() => setSelectedOrderForModal(order)}
                      className="font-mono font-bold text-indigo-600 hover:underline cursor-pointer"
                    >
                      {order.orderNumber}
                    </div>
                    <div className="font-semibold text-slate-900 mt-0.5">{order.client.name}</div>
                    <p className="text-[11px] text-slate-400 font-mono">{order.client.phone}</p>
                  </td>

                  {/* Device */}
                  <td className="py-3 px-4 align-top">
                    <div className="font-medium text-slate-900">{order.device.brand} {order.device.model}</div>
                    <StatusBadge status={order.status} size="sm" />
                  </td>

                  {/* Payment Status */}
                  <td className="py-3 px-4 align-top">
                    <PaymentBadge status={order.paymentStatus} size="sm" />
                    {order.payments && order.payments.length > 0 && (
                      <p className="text-[10px] text-slate-400 mt-1">
                        {order.payments.length} movimiento(s) de caja
                      </p>
                    )}
                  </td>

                  {/* Total */}
                  <td className="py-3 px-4 align-top text-right font-mono font-bold text-slate-900 text-sm">
                    {formatMoney(order.totalAmount)}
                  </td>

                  {/* Deposit */}
                  <td className="py-3 px-4 align-top text-right font-mono font-semibold text-emerald-700">
                    {formatMoney(order.depositPaid)}
                  </td>

                  {/* Balance Due */}
                  <td className="py-3 px-4 align-top text-right font-mono font-bold">
                    {order.balanceDue > 0 ? (
                      <span className="text-rose-600 text-sm">{formatMoney(order.balanceDue)}</span>
                    ) : (
                      <span className="text-emerald-600 text-xs">Saldado</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-4 align-top text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      {order.balanceDue > 0 ? (
                        <button
                          onClick={() => handleOpenQuickPay(order.id)}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-sm transition flex items-center gap-1"
                        >
                          <DollarSign className="w-3.5 h-3.5" />
                          <span>Cobrar</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => setSelectedOrderForPrint(order)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition flex items-center gap-1"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Recibo</span>
                        </button>
                      )}

                      <button
                        onClick={() => setSelectedOrderForModal(order)}
                        className="p-1 text-slate-400 hover:text-indigo-600 rounded transition"
                        title="Ver detalle"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: QUICK RECORD PAYMENT */}
      {showQuickPayModal && activeOrderForQuickPay && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-400" />
                <span>Registrar Cobro: {activeOrderForQuickPay.orderNumber}</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowQuickPayModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleQuickPaySubmit} className="p-4 sm:p-6 space-y-3.5 text-xs">
              
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
                <p><span className="font-semibold text-slate-700">Cliente:</span> {activeOrderForQuickPay.client.name}</p>
                <p><span className="font-semibold text-slate-700">Equipo:</span> {activeOrderForQuickPay.device.brand} {activeOrderForQuickPay.device.model}</p>
                <p className="flex justify-between pt-1 border-t border-slate-200">
                  <span className="font-semibold text-slate-700">Saldo pendiente:</span>
                  <span className="font-bold font-mono text-rose-600">{formatMoney(activeOrderForQuickPay.balanceDue)}</span>
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Monto a Cobrar ({activeOrderForQuickPay.client.name}):</label>
                <input
                  type="number"
                  min="1"
                  max={activeOrderForQuickPay.balanceDue}
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg bg-white font-mono font-bold text-base text-slate-900"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Medio de Cobro:</label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value as PaymentMethod)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg bg-white font-medium"
                >
                  <option value="efectivo">Efectivo en Caja</option>
                  <option value="transferencia">Transferencia Bancaria</option>
                  <option value="mercadopago">MercadoPago / QR</option>
                  <option value="tarjeta_debito">Tarjeta de Débito</option>
                  <option value="tarjeta_credito">Tarjeta de Crédito</option>
                  <option value="otro">Otro medio</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Concepto / Comprobante N°:</label>
                <input
                  type="text"
                  value={payNote}
                  onChange={(e) => setPayNote(e.target.value)}
                  placeholder="Ej: Pago total al retirar equipo"
                  className="w-full p-2.5 border border-slate-300 rounded-lg bg-white"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowQuickPayModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold shadow"
                >
                  Confirmar Cobro
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};

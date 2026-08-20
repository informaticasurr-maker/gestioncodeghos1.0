import React from 'react';
import {
  Clock,
  CheckCircle,
  XCircle,
  Wrench,
  PackageCheck,
  RotateCcw,
  Sparkles,
  Smartphone,
  Laptop,
  Tablet,
  Monitor,
  Watch,
  Gamepad2,
  Cpu,
  HelpCircle,
} from 'lucide-react';
import { OrderStatus, DeviceType, PaymentStatus } from '../types';

export const getStatusDetails = (status: OrderStatus) => {
  switch (status) {
    case 'recibido':
      return {
        label: 'Recibido / Ingresado',
        bg: 'bg-blue-50 text-blue-700 border-blue-200',
        badgeColor: 'bg-blue-600',
        icon: Clock,
      };
    case 'en_revision':
      return {
        label: 'En Diagnóstico / Revisión',
        bg: 'bg-amber-50 text-amber-800 border-amber-200',
        badgeColor: 'bg-amber-500',
        icon: Wrench,
      };
    case 'presupuesto_pendiente':
      return {
        label: 'Presupuesto Pendiente',
        bg: 'bg-purple-50 text-purple-700 border-purple-200',
        badgeColor: 'bg-purple-600',
        icon: Clock,
      };
    case 'presupuesto_aprobado':
      return {
        label: 'Presupuesto Aprobado',
        bg: 'bg-teal-50 text-teal-700 border-teal-200',
        badgeColor: 'bg-teal-600',
        icon: CheckCircle,
      };
    case 'presupuesto_rechazado':
      return {
        label: 'Presupuesto Rechazado',
        bg: 'bg-rose-50 text-rose-700 border-rose-200',
        badgeColor: 'bg-rose-600',
        icon: XCircle,
      };
    case 'en_reparacion':
      return {
        label: 'En Reparación',
        bg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        badgeColor: 'bg-indigo-600',
        icon: Wrench,
      };
    case 'esperando_repuesto':
      return {
        label: 'Esperando Repuesto',
        bg: 'bg-orange-50 text-orange-700 border-orange-200',
        badgeColor: 'bg-orange-500',
        icon: RotateCcw,
      };
    case 'listo_entrega':
      return {
        label: 'Listo para Retiro',
        bg: 'bg-emerald-50 text-emerald-700 border-emerald-300 font-semibold',
        badgeColor: 'bg-emerald-600',
        icon: Sparkles,
      };
    case 'entregado':
      return {
        label: 'Entregado / Finalizado',
        bg: 'bg-slate-100 text-slate-700 border-slate-300',
        badgeColor: 'bg-slate-600',
        icon: PackageCheck,
      };
    case 'cancelado':
      return {
        label: 'Cancelado',
        bg: 'bg-red-50 text-red-700 border-red-200',
        badgeColor: 'bg-red-600',
        icon: XCircle,
      };
    default:
      return {
        label: status,
        bg: 'bg-slate-50 text-slate-700 border-slate-200',
        badgeColor: 'bg-slate-500',
        icon: HelpCircle,
      };
  }
};

export const StatusBadge: React.FC<{
  status: OrderStatus;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}> = ({ status, size = 'md', showIcon = true }) => {
  const details = getStatusDetails(status);
  const Icon = details.icon;

  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3 py-1.5 gap-2 font-medium',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border ${details.bg} ${sizeClasses[size]}`}
    >
      {showIcon && <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />}
      <span>{details.label}</span>
    </span>
  );
};

export const PaymentBadge: React.FC<{
  status: PaymentStatus;
  size?: 'sm' | 'md';
}> = ({ status, size = 'sm' }) => {
  const getPaymentDetails = () => {
    switch (status) {
      case 'pagado':
        return { label: 'Pagado Total', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'seña_parcial':
        return { label: 'Seña Abonada', bg: 'bg-blue-50 text-blue-700 border-blue-200' };
      case 'reembolsado':
        return { label: 'Reembolsado', bg: 'bg-slate-50 text-slate-600 border-slate-200' };
      case 'pendiente':
      default:
        return { label: 'Saldo Pendiente', bg: 'bg-amber-50 text-amber-700 border-amber-200' };
    }
  };

  const details = getPaymentDetails();

  return (
    <span
      className={`inline-flex items-center rounded-md border font-medium ${details.bg} ${
        size === 'sm' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-1'
      }`}
    >
      {details.label}
    </span>
  );
};

export const DeviceIcon: React.FC<{ type: DeviceType; className?: string }> = ({
  type,
  className = 'w-4 h-4',
}) => {
  switch (type) {
    case 'smartphone':
      return <Smartphone className={className} />;
    case 'notebook':
      return <Laptop className={className} />;
    case 'tablet':
      return <Tablet className={className} />;
    case 'pc':
    case 'all_in_one':
      return <Monitor className={className} />;
    case 'smartwatch':
      return <Watch className={className} />;
    case 'console':
      return <Gamepad2 className={className} />;
    default:
      return <Cpu className={className} />;
  }
};

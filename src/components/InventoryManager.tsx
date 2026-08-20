import React, { useState, useMemo } from 'react';
import {
  Package,
  Plus,
  Search,
  AlertTriangle,
  ArrowUpDown,
  Filter,
  Trash2,
  Edit2,
  DollarSign,
  TrendingDown,
  Tag,
  Check,
  X,
  Boxes,
  Layers,
  FileSpreadsheet,
  RefreshCw,
  SlidersHorizontal,
  FolderPlus,
  Info,
} from 'lucide-react';
import { InventoryItem } from '../types';
import { useApp } from '../context/AppContext';

export const InventoryManager: React.FC = () => {
  const { inventory, addInventoryItem, updateInventoryItem, deleteInventoryItem, adjustInventoryStock, formatMoney } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [stockFilter, setStockFilter] = useState<'todos' | 'bajo_stock' | 'agotados'>('todos');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [adjustModalItem, setAdjustModalItem] = useState<InventoryItem | null>(null);
  const [adjustQuantity, setAdjustQuantity] = useState<number>(1);
  const [adjustType, setAdjustType] = useState<'add' | 'remove'>('add');
  const [adjustReason, setAdjustReason] = useState<string>('Compra / Reposición');

  // New Item Form State
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    category: 'Pantallas / Displays',
    stock: 5,
    minStock: 2,
    costPrice: 0,
    salePrice: 0,
    location: '',
    supplier: '',
    compatibleModels: '',
    notes: '',
  });

  // Categories list
  const categories = [
    'Pantallas / Displays',
    'Baterías',
    'Pines y Módulos de Carga',
    'Flex y Cables',
    'Cámaras y Lentes',
    'Chips / CI / Microelectrónica',
    'Memorias / Almacenamiento',
    'Teclados y Touchpads',
    'Insumos / Químicos / Soldadura',
    'Accesorios y Fundas',
    'Otros Repuestos',
  ];

  // Inventory stats calculations
  const stats = useMemo(() => {
    const totalItems = inventory.length;
    const totalUnits = inventory.reduce((acc, item) => acc + (item.stock || 0), 0);
    const totalCostValuation = inventory.reduce((acc, item) => acc + (item.costPrice || 0) * (item.stock || 0), 0);
    const totalSaleValuation = inventory.reduce((acc, item) => acc + (item.salePrice || 0) * (item.stock || 0), 0);
    const lowStockItems = inventory.filter((item) => item.stock <= item.minStock && item.stock > 0);
    const outOfStockItems = inventory.filter((item) => item.stock <= 0);

    return {
      totalItems,
      totalUnits,
      totalCostValuation,
      totalSaleValuation,
      lowStockCount: lowStockItems.length,
      outOfStockCount: outOfStockItems.length,
      estimatedProfit: totalSaleValuation - totalCostValuation,
    };
  }, [inventory]);

  // Helper to normalize compatibleModels to string[]
  const getCompatList = (models?: string | string[]): string[] => {
    if (!models) return [];
    if (Array.isArray(models)) return models;
    return typeof models === 'string' ? models.split(',').map((s) => s.trim()).filter(Boolean) : [];
  };

  // Filtered inventory list
  const filteredInventory = useMemo(() => {
    return inventory.filter((item) => {
      const compat = getCompatList(item.compatibleModels);
      const matchSearch =
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        compat.some((m) => m.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.location || '').toLowerCase().includes(searchTerm.toLowerCase());

      const matchCategory = selectedCategory === 'todos' || item.category === selectedCategory;

      const currentStock = item.quantity ?? item.stock ?? 0;
      const minStock = item.minQuantity ?? item.minStock ?? 0;
      let matchStock = true;
      if (stockFilter === 'bajo_stock') {
        matchStock = currentStock <= minStock && currentStock > 0;
      } else if (stockFilter === 'agotados') {
        matchStock = currentStock <= 0;
      }

      return matchSearch && matchCategory && matchStock;
    });
  }, [inventory, searchTerm, selectedCategory, stockFilter]);

  const handleOpenAdd = () => {
    const autoSku = `REP-${Date.now().toString().slice(-5)}`;
    setFormData({
      sku: autoSku,
      name: '',
      category: 'Pantallas / Displays',
      stock: 5,
      minStock: 2,
      costPrice: 0,
      salePrice: 0,
      location: 'Cajón A-1',
      supplier: '',
      compatibleModels: '',
      notes: '',
    });
    setEditingItem(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (item: InventoryItem) => {
    setEditingItem(item);
    const compat = getCompatList(item.compatibleModels);
    setFormData({
      sku: item.sku,
      name: item.name,
      category: item.category,
      stock: item.quantity ?? item.stock ?? 0,
      minStock: item.minQuantity ?? item.minStock ?? 0,
      costPrice: item.costPrice || item.cost || 0,
      salePrice: item.sellingPrice || item.salePrice || item.price || 0,
      location: item.location || '',
      supplier: item.supplier || '',
      compatibleModels: compat.join(', '),
      notes: item.notes || '',
    });
    setIsAddModalOpen(true);
  };

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    const models = formData.compatibleModels
      ? formData.compatibleModels.split(',').map((s) => s.trim()).filter(Boolean)
      : [];

    const stockNum = Number(formData.stock) || 0;
    const minStockNum = Number(formData.minStock) || 0;
    const costNum = Number(formData.costPrice) || 0;
    const saleNum = Number(formData.salePrice) || 0;

    if (editingItem) {
      updateInventoryItem({
        ...editingItem,
        sku: formData.sku.trim() || editingItem.sku,
        name: formData.name.trim(),
        category: formData.category,
        quantity: stockNum,
        stock: stockNum,
        minQuantity: minStockNum,
        minStock: minStockNum,
        costPrice: costNum,
        cost: costNum,
        sellingPrice: saleNum,
        salePrice: saleNum,
        price: saleNum,
        location: formData.location.trim(),
        supplier: formData.supplier.trim(),
        compatibleModels: models,
        notes: formData.notes.trim(),
        updatedAt: new Date().toISOString(),
      });
    } else {
      addInventoryItem({
        sku: formData.sku.trim() || `REP-${Date.now().toString().slice(-5)}`,
        name: formData.name.trim(),
        category: formData.category,
        quantity: stockNum,
        stock: stockNum,
        minQuantity: minStockNum,
        minStock: minStockNum,
        costPrice: costNum,
        cost: costNum,
        sellingPrice: saleNum,
        salePrice: saleNum,
        price: saleNum,
        location: formData.location.trim(),
        supplier: formData.supplier.trim(),
        compatibleModels: models,
        notes: formData.notes.trim(),
      });
    }

    setIsAddModalOpen(false);
  };

  const handleConfirmStockAdjust = () => {
    if (!adjustModalItem) return;
    const change = adjustType === 'add' ? Number(adjustQuantity) : -Number(adjustQuantity);
    adjustInventoryStock(adjustModalItem.id, change, adjustReason);
    setAdjustModalItem(null);
  };

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['SKU', 'Nombre', 'Categoria', 'Stock', 'Minimo', 'Costo', 'Venta', 'Ubicacion', 'Modelos Compatibles'];
    const rows = inventory.map((i) => [
      `"${i.sku}"`,
      `"${i.name.replace(/"/g, '""')}"`,
      `"${i.category}"`,
      i.quantity ?? i.stock ?? 0,
      i.minQuantity ?? i.minStock ?? 0,
      i.costPrice || i.cost || 0,
      i.sellingPrice || i.salePrice || i.price || 0,
      `"${i.location || ''}"`,
      `"${getCompatList(i.compatibleModels).join(', ')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Inventario_Repuestos_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header & Main Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <Boxes className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                Inventario & Control de Repuestos
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Stock en tiempo real, alertas de reposición, precios y trazabilidad
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-2 transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Exportar CSV</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-2 shadow-md shadow-blue-600/20 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Repuesto</span>
          </button>
        </div>
      </div>

      {/* Metric Cards Banner */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-medium">Total de Artículos</span>
            <Package className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-800 dark:text-slate-100">
            {stats.totalItems} <span className="text-xs text-slate-400 font-normal">({stats.totalUnits} un.)</span>
          </div>
          <span className="text-[11px] text-slate-400">En catálogo activo</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-medium">Bajo Stock / Críticos</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
            {stats.lowStockCount + stats.outOfStockCount}
          </div>
          <span className="text-[11px] text-amber-600/80">
            {stats.outOfStockCount} sin stock • {stats.lowStockCount} por reponer
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-medium">Valuación en Costo</span>
            <TrendingDown className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-800 dark:text-slate-100">
            {formatMoney(stats.totalCostValuation)}
          </div>
          <span className="text-[11px] text-slate-400">Capital invertido</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-medium">Potencial de Venta</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {formatMoney(stats.totalSaleValuation)}
          </div>
          <span className="text-[11px] text-emerald-600/80">
            Ganancia est: {formatMoney(stats.estimatedProfit)}
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por SKU, nombre, modelo compatible (ej: Moto G22, iPhone 11, Cajón B)..."
            className="w-full text-xs sm:text-sm pl-9 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Category dropdown */}
        <div className="flex items-center gap-2">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-xs sm:text-sm px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-800 dark:text-slate-100 outline-none"
          >
            <option value="todos">Todas las categorías</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* Stock Filter status */}
          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value as any)}
            className="text-xs sm:text-sm px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-800 dark:text-slate-100 outline-none"
          >
            <option value="todos">Todos los stocks</option>
            <option value="bajo_stock">⚠️ Bajo Stock (Mínimo)</option>
            <option value="agotados">🚫 Agotados (0)</option>
          </select>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 text-xs font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-3.5">SKU / Código</th>
                <th className="p-3.5">Repuesto / Compatibilidad</th>
                <th className="p-3.5">Categoría</th>
                <th className="p-3.5 text-center">Stock</th>
                <th className="p-3.5 text-right">Precio Costo</th>
                <th className="p-3.5 text-right">Precio Venta</th>
                <th className="p-3.5">Ubicación</th>
                <th className="p-3.5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {filteredInventory.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400 dark:text-slate-500">
                    <Boxes className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="font-medium text-sm">No se encontraron repuestos con los filtros aplicados</p>
                    <p className="text-xs text-slate-400 mt-0.5">Intenta buscar con otros términos o agregar un nuevo repuesto</p>
                  </td>
                </tr>
              ) : (
                filteredInventory.map((item) => {
                  const currentStock = item.quantity ?? item.stock ?? 0;
                  const minStock = item.minQuantity ?? item.minStock ?? 0;
                  const isOutOfStock = currentStock <= 0;
                  const isLowStock = currentStock <= minStock && !isOutOfStock;
                  const compatList = getCompatList(item.compatibleModels);

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="p-3.5 font-mono text-xs font-semibold text-blue-600 dark:text-blue-400">
                        {item.sku}
                      </td>

                      <td className="p-3.5 max-w-xs">
                        <div className="font-semibold text-slate-800 dark:text-slate-100">{item.name}</div>
                        {compatList.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {compatList.slice(0, 3).map((m, idx) => (
                              <span
                                key={idx}
                                className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
                              >
                                {m}
                              </span>
                            ))}
                            {compatList.length > 3 && (
                              <span className="text-[10px] text-slate-400">
                                +{compatList.length - 3} más
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      <td className="p-3.5">
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {item.category}
                        </span>
                      </td>

                      <td className="p-3.5 text-center">
                        <div className="inline-flex flex-col items-center">
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                              isOutOfStock
                                ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                                : isLowStock
                                ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                                : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                            }`}
                          >
                            {item.stock} un.
                          </span>
                          <span className="text-[10px] text-slate-400 mt-0.5">mín: {item.minStock}</span>
                        </div>
                      </td>

                      <td className="p-3.5 text-right font-medium text-slate-600 dark:text-slate-400">
                        {formatMoney(item.costPrice)}
                      </td>

                      <td className="p-3.5 text-right font-bold text-slate-800 dark:text-slate-100">
                        {formatMoney(item.salePrice)}
                      </td>

                      <td className="p-3.5">
                        <span className="text-xs text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                          {item.location || 'Sin asignar'}
                        </span>
                      </td>

                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setAdjustModalItem(item);
                              setAdjustQuantity(1);
                              setAdjustType('add');
                              setAdjustReason('Compra / Reposición');
                            }}
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
                            title="Ajustar Stock (+/-)"
                          >
                            <SlidersHorizontal className="w-4 h-4 text-blue-600" />
                          </button>

                          <button
                            onClick={() => handleOpenEdit(item)}
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
                            title="Editar Repuesto"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => {
                              if (confirm(`¿Eliminar ${item.name} del inventario?`)) {
                                deleteInventoryItem(item.id);
                              }
                            }}
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-800 dark:text-slate-100">
                  {editingItem ? 'Editar Repuesto / Artículo' : 'Nuevo Repuesto para Taller'}
                </h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="p-6 overflow-y-auto space-y-4 flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                    Código SKU / Referencia *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full text-sm px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                    Categoría *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full text-sm px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                  Nombre descriptivo del repuesto *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ej: Módulo Display OLED Samsung A52 con Marco Original"
                  className="w-full text-sm px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                    Stock Actual *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value, 10) || 0 })}
                    className="w-full text-sm px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                    Stock Mínimo *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.minStock}
                    onChange={(e) => setFormData({ ...formData, minStock: parseInt(e.target.value, 10) || 0 })}
                    className="w-full text-sm px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                    Costo Compra ($)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.costPrice}
                    onChange={(e) => setFormData({ ...formData, costPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full text-sm px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                    Precio Venta ($) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.salePrice}
                    onChange={(e) => setFormData({ ...formData, salePrice: parseFloat(e.target.value) || 0 })}
                    className="w-full text-sm px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                    Ubicación en taller / Cajonera
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Ej: Estante 3 - Gaveta 12"
                    className="w-full text-sm px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                    Proveedor habitual
                  </label>
                  <input
                    type="text"
                    value={formData.supplier}
                    onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                    placeholder="Ej: FixParts Mayorista / Distribuidor"
                    className="w-full text-sm px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                  Modelos compatibles (separar por comas)
                </label>
                <input
                  type="text"
                  value={formData.compatibleModels}
                  onChange={(e) => setFormData({ ...formData, compatibleModels: e.target.value })}
                  placeholder="Ej: Samsung A52 4G, Samsung A52s, SM-A525F, SM-A528B"
                  className="w-full text-sm px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                  Notas / Observaciones
                </label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Garantía de proveedor 30 días, requiere pegamento B7000..."
                  className="w-full text-sm px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-md shadow-blue-600/20"
                >
                  {editingItem ? 'Guardar Cambios' : 'Registrar en Inventario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock Quick Adjustment Modal */}
      {adjustModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-800 dark:text-slate-100">Ajuste de Stock Rápido</h3>
              </div>
              <button
                onClick={() => setAdjustModalItem(null)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{adjustModalItem.name}</p>
              <p className="text-xs text-slate-400">SKU: {adjustModalItem.sku} • Stock actual: <strong className="text-blue-600">{adjustModalItem.stock} un.</strong></p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setAdjustType('add')}
                className={`py-2 rounded-lg font-semibold text-xs border transition-all ${
                  adjustType === 'add'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/20'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                + Ingresar Stock
              </button>
              <button
                type="button"
                onClick={() => setAdjustType('remove')}
                className={`py-2 rounded-lg font-semibold text-xs border transition-all ${
                  adjustType === 'remove'
                    ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 text-rose-700 dark:text-rose-300 ring-2 ring-rose-500/20'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                - Descontar Stock
              </button>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                Cantidad a {adjustType === 'add' ? 'sumar' : 'restar'}
              </label>
              <input
                type="number"
                min="1"
                value={adjustQuantity}
                onChange={(e) => setAdjustQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="w-full text-base font-bold text-center px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-center text-slate-400 mt-1">
                Nuevo stock resultante:{' '}
                <strong className="text-slate-700 dark:text-slate-200">
                  {adjustType === 'add'
                    ? adjustModalItem.stock + adjustQuantity
                    : Math.max(0, adjustModalItem.stock - adjustQuantity)}{' '}
                  un.
                </strong>
              </p>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                Motivo del ajuste
              </label>
              <select
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none"
              >
                <option value="Compra / Reposición">Compra a proveedor / Reposición</option>
                <option value="Uso en taller">Uso en orden / Reparación</option>
                <option value="Merma / Dañado">Pieza dañada / Fallada</option>
                <option value="Ajuste de inventario">Auditoría / Recuento físico</option>
                <option value="Devolución">Devolución de cliente</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setAdjustModalItem(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmStockAdjust}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md shadow-blue-600/20"
              >
                Confirmar Ajuste
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

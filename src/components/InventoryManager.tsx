import React, { useState, useMemo, useRef, useEffect } from 'react';
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
  UploadCloud,
  FileUp,
  FileText,
  Sparkles,
  ChevronDown,
  CheckCircle2,
  Upload,
  ArrowLeft,
} from 'lucide-react';
import { InventoryItem } from '../types';
import { useApp } from '../context/AppContext';
import {
  processInventoryFile,
  downloadInventoryTemplateExcel,
  parseRawText,
  ImportResult,
  ParsedInventoryItem,
  INVENTORY_CATEGORIES,
} from '../services/inventoryImportService';

export const InventoryManager: React.FC = () => {
  const {
    inventory,
    addInventoryItem,
    updateInventoryItem,
    deleteInventoryItem,
    adjustInventoryStock,
    formatMoney,
    syncInventoryBatch,
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [stockFilter, setStockFilter] = useState<'todos' | 'bajo_stock' | 'agotados'>('todos');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [adjustModalItem, setAdjustModalItem] = useState<InventoryItem | null>(null);
  const [adjustQuantity, setAdjustQuantity] = useState<number>(1);
  const [adjustType, setAdjustType] = useState<'add' | 'remove'>('add');
  const [adjustReason, setAdjustReason] = useState<string>('Compra / Reposición');

  // Custom Dropdowns State (Panel que se despliega con letras violeta brillante)
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isStockOpen, setIsStockOpen] = useState(false);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);
  const stockDropdownRef = useRef<HTMLDivElement>(null);

  // File Upload & Auto-Sync State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importActiveTab, setImportActiveTab] = useState<'file' | 'text'>('file');
  const [pastedText, setPastedText] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [syncMode, setSyncMode] = useState<'smart_merge' | 'add_all'>('smart_merge');
  const [syncFeedback, setSyncFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target as Node)) {
        setIsCategoryOpen(false);
      }
      if (stockDropdownRef.current && !stockDropdownRef.current.contains(event.target as Node)) {
        setIsStockOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
  const categories = INVENTORY_CATEGORIES;


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

  // Handle File Upload for Auto-Sync (.pdf, .xlsx, .txt, .ods, .csv, .json, .xml, .xls)
  const handleProcessFileDirectly = async (file: File) => {
    setIsProcessingFile(true);
    try {
      const result = await processInventoryFile(file);
      setImportResult(result);
    } catch (err: any) {
      console.error('Error procesando archivo de inventario:', err);
      alert(`Error al procesar el archivo: ${err?.message || 'Formato no válido o archivo dañado'}`);
    } finally {
      setIsProcessingFile(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await handleProcessFileDirectly(file);
    }
  };

  const handleDropFile = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      await handleProcessFileDirectly(file);
    }
  };

  const handleProcessPastedText = () => {
    if (!pastedText.trim()) {
      alert('Por favor pega una lista de repuestos en el cuadro de texto.');
      return;
    }
    setIsProcessingFile(true);
    try {
      const result = parseRawText(pastedText);
      if (result.items.length === 0) {
        alert('No se pudieron reconocer artículos en el texto. Asegúrate de incluir nombres de repuestos y precios.');
      } else {
        setImportResult(result);
      }
    } catch (err: any) {
      alert(`Error al procesar el texto: ${err?.message || 'Error desconocido'}`);
    } finally {
      setIsProcessingFile(false);
    }
  };

  // Confirm and Sync Batch
  const handleConfirmSync = () => {
    if (!importResult || importResult.items.length === 0) return;

    const stats = syncInventoryBatch(importResult.items as any, syncMode);
    setSyncFeedback({
      message: `¡Sincronización completada! ${stats.added} repuestos nuevos agregados y ${stats.updated} actualizados.`,
      type: 'success',
    });

    setIsImportModalOpen(false);
    setImportResult(null);

    setTimeout(() => {
      setSyncFeedback(null);
    }, 6000);
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

        <div className="flex flex-wrap items-center gap-2">
          {/* Subir y Sincronizar Archivo Multiformato */}
          <button
            onClick={() => {
              setImportResult(null);
              setImportActiveTab('file');
              setPastedText('');
              setIsImportModalOpen(true);
            }}
            disabled={isProcessingFile}
            className="px-3.5 py-2 rounded-xl border border-sky-500/40 bg-sky-50 dark:bg-sky-950/40 hover:bg-sky-100 dark:hover:bg-sky-900/60 text-sky-700 dark:text-sky-300 text-xs font-semibold flex items-center gap-2 transition-all shadow-sm shadow-sky-500/10"
            title="Importación Inteligente de Artículos (Excel / CSV / PDF)"
          >
            {isProcessingFile ? (
              <RefreshCw className="w-4 h-4 animate-spin text-sky-600 dark:text-sky-400" />
            ) : (
              <Upload className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            )}
            <span className="font-bold">Subir y Sincronizar</span>
            <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] font-mono bg-sky-200/60 dark:bg-sky-900/80 text-sky-800 dark:text-sky-200 border border-sky-500/30">
              PDF • Excel • CSV...
            </span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.xlsx,.txt,.ods,.csv,.json,.xml,.xls"
            className="hidden"
            onChange={handleFileSelected}
          />

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

      {/* Feedback Banner */}
      {syncFeedback && (
        <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 flex items-center justify-between text-xs font-semibold animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>{syncFeedback.message}</span>
          </div>
          <button
            onClick={() => setSyncFeedback(null)}
            className="text-emerald-600 hover:text-emerald-800 dark:hover:text-white p-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            data-search-input="true"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por SKU, nombre, modelo compatible (ej: Moto G22, iPhone 11, Cajón B)..."
            className="search-input-fluor w-full text-xs sm:text-sm pl-9 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 outline-none transition"
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

        {/* Custom Category & Stock Dropdowns with Glowing Violet Panels */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Custom Category Dropdown */}
          <div className="relative" ref={categoryDropdownRef}>
            <button
              type="button"
              onClick={() => {
                setIsCategoryOpen(!isCategoryOpen);
                setIsStockOpen(false);
              }}
              className={`text-xs sm:text-sm px-3.5 py-2 rounded-lg border flex items-center justify-between gap-2 transition-all ${
                isCategoryOpen
                  ? 'border-fuchsia-500 bg-fuchsia-50/80 dark:bg-fuchsia-950/40 ring-2 ring-fuchsia-500/20'
                  : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-1.5 overflow-hidden text-ellipsis whitespace-nowrap max-w-[170px] sm:max-w-[210px]">
                <Tag className="w-3.5 h-3.5 text-fuchsia-500 shrink-0" />
                <span className="text-violet-fluor font-semibold truncate">
                  {selectedCategory === 'todos' ? 'Todas las categorías' : selectedCategory}
                </span>
              </div>
              <ChevronDown
                className={`w-3.5 h-3.5 text-fuchsia-500 transition-transform duration-150 ${
                  isCategoryOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Panel Desplegable de Categorías (Letras Violetas Brillante) */}
            {isCategoryOpen && (
              <div className="absolute right-0 sm:left-0 sm:right-auto mt-1.5 w-64 max-h-72 overflow-y-auto rounded-xl border border-fuchsia-500/40 bg-white dark:bg-slate-900 shadow-2xl shadow-fuchsia-500/15 z-50 p-1.5 space-y-0.5 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-2.5 py-1 text-[10px] font-bold text-fuchsia-500/80 uppercase tracking-wider">
                  Seleccionar Categoría
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory('todos');
                    setIsCategoryOpen(false);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors ${
                    selectedCategory === 'todos'
                      ? 'bg-fuchsia-500/15 border border-fuchsia-500/30'
                      : 'hover:bg-fuchsia-500/10'
                  }`}
                >
                  <span className="text-violet-fluor panel-option-violet font-semibold">
                    Todas las categorías
                  </span>
                  {selectedCategory === 'todos' && <Check className="w-3.5 h-3.5 text-fuchsia-500" />}
                </button>

                {categories.map((c) => {
                  const isSelected = selectedCategory === c;
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => {
                        setSelectedCategory(c);
                        setIsCategoryOpen(false);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors ${
                        isSelected
                          ? 'bg-fuchsia-500/15 border border-fuchsia-500/30'
                          : 'hover:bg-fuchsia-500/10'
                      }`}
                    >
                      <span className="text-violet-fluor panel-option-violet font-semibold">
                        {c}
                      </span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-fuchsia-500" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Custom Stock Filter Dropdown */}
          <div className="relative" ref={stockDropdownRef}>
            <button
              type="button"
              onClick={() => {
                setIsStockOpen(!isStockOpen);
                setIsCategoryOpen(false);
              }}
              className={`text-xs sm:text-sm px-3.5 py-2 rounded-lg border flex items-center justify-between gap-2 transition-all ${
                isStockOpen
                  ? 'border-fuchsia-500 bg-fuchsia-50/80 dark:bg-fuchsia-950/40 ring-2 ring-fuchsia-500/20'
                  : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-1.5 overflow-hidden text-ellipsis whitespace-nowrap max-w-[150px]">
                <Layers className="w-3.5 h-3.5 text-fuchsia-500 shrink-0" />
                <span className="text-violet-fluor font-semibold truncate">
                  {stockFilter === 'todos'
                    ? 'Todos los stocks'
                    : stockFilter === 'bajo_stock'
                    ? '⚠️ Bajo Stock'
                    : '🚫 Agotados'}
                </span>
              </div>
              <ChevronDown
                className={`w-3.5 h-3.5 text-fuchsia-500 transition-transform duration-150 ${
                  isStockOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Panel Desplegable de Stocks (Letras Violetas Brillante) */}
            {isStockOpen && (
              <div className="absolute right-0 mt-1.5 w-56 rounded-xl border border-fuchsia-500/40 bg-white dark:bg-slate-900 shadow-2xl shadow-fuchsia-500/15 z-50 p-1.5 space-y-0.5 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-2.5 py-1 text-[10px] font-bold text-fuchsia-500/80 uppercase tracking-wider">
                  Nivel de Existencia
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setStockFilter('todos');
                    setIsStockOpen(false);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors ${
                    stockFilter === 'todos'
                      ? 'bg-fuchsia-500/15 border border-fuchsia-500/30'
                      : 'hover:bg-fuchsia-500/10'
                  }`}
                >
                  <span className="text-violet-fluor panel-option-violet font-semibold">
                    Todos los stocks
                  </span>
                  {stockFilter === 'todos' && <Check className="w-3.5 h-3.5 text-fuchsia-500" />}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setStockFilter('bajo_stock');
                    setIsStockOpen(false);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors ${
                    stockFilter === 'bajo_stock'
                      ? 'bg-fuchsia-500/15 border border-fuchsia-500/30'
                      : 'hover:bg-fuchsia-500/10'
                  }`}
                >
                  <span className="text-violet-fluor panel-option-violet font-semibold">
                    ⚠️ Bajo Stock (Mínimo)
                  </span>
                  {stockFilter === 'bajo_stock' && <Check className="w-3.5 h-3.5 text-fuchsia-500" />}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setStockFilter('agotados');
                    setIsStockOpen(false);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors ${
                    stockFilter === 'agotados'
                      ? 'bg-fuchsia-500/15 border border-fuchsia-500/30'
                      : 'hover:bg-fuchsia-500/10'
                  }`}
                >
                  <span className="text-violet-fluor panel-option-violet font-semibold">
                    🚫 Agotados (0 un.)
                  </span>
                  {stockFilter === 'agotados' && <Check className="w-3.5 h-3.5 text-fuchsia-500" />}
                </button>
              </div>
            )}
          </div>
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
                    className="select-violet-fluor text-violet-fluor w-full text-sm px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-fuchsia-500 font-semibold"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c} className="panel-option-violet text-violet-fluor">
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

      {/* Auto-Sync & Import Modal (.pdf, .xlsx, .txt, .ods, .csv, .json, .xml, .xls) */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-[#0b1220] rounded-2xl shadow-2xl border border-slate-700/60 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden text-white relative">
            {/* FASE 1: Subida de archivo / Pegar texto (IDÉNTICO A LA IMAGEN) */}
            {!importResult ? (
              <div className="p-6 space-y-5 overflow-y-auto">
                {/* Modal Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-cyan-400 flex items-center justify-center text-white shadow-[0_0_15px_rgba(14,165,233,0.4)] shrink-0">
                      <Upload className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-base sm:text-lg font-bold text-white leading-tight">
                        Importación Inteligente de Artículos (Excel / CSV / PDF)
                      </h2>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Sube un archivo para detectar automáticamente nuevos rubros, precios y stock inicial.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setIsImportModalOpen(false);
                      setImportResult(null);
                    }}
                    className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Top Action Tabs */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setImportActiveTab('file')}
                    className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold transition ${
                      importActiveTab === 'file'
                        ? 'bg-[#0ea5e9] hover:bg-[#0284c7] text-white shadow-md'
                        : 'bg-[#0f172a] hover:bg-[#1e293b] border border-slate-700/80 text-slate-300'
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                    <span>Subir Archivo Excel o PDF</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setImportActiveTab('text')}
                    className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold transition ${
                      importActiveTab === 'text'
                        ? 'bg-[#0ea5e9] hover:bg-[#0284c7] text-white shadow-md'
                        : 'bg-[#0f172a] hover:bg-[#1e293b] border border-slate-700/80 text-slate-300'
                    }`}
                  >
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>Pegar Texto / Lista con IA</span>
                  </button>
                </div>

                {/* Recognized Columns Bar */}
                <div className="rounded-xl bg-[#080e1a] border border-slate-800 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
                  <div className="flex items-center gap-2 text-slate-300">
                    <Tag className="w-4 h-4 text-sky-400 shrink-0" />
                    <span>
                      Columnas reconocidas:{' '}
                      <strong className="text-white font-bold">
                        Rubro, Marca, Descripción, Cantidad y Precio.
                      </strong>
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={downloadInventoryTemplateExcel}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-500/30 text-emerald-400 text-xs font-semibold shrink-0 transition"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>Descargar Plantilla Excel</span>
                  </button>
                </div>

                {/* Tab 1: Drag & Drop Upload Zone */}
                {importActiveTab === 'file' && (
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      setIsDragging(false);
                    }}
                    onDrop={handleDropFile}
                    className={`border-2 border-dashed ${
                      isDragging ? 'border-sky-400 bg-sky-950/20' : 'border-slate-700/80 bg-[#080e1a]/50'
                    } rounded-2xl p-8 sm:p-10 flex flex-col items-center justify-center text-center transition`}
                  >
                    {isProcessingFile ? (
                      <div className="py-6 flex flex-col items-center space-y-3">
                        <RefreshCw className="w-8 h-8 text-sky-400 animate-spin" />
                        <p className="text-sm font-semibold text-white">
                          Analizando catálogo y autocompletando categorías y precios...
                        </p>
                        <p className="text-xs text-slate-400">Por favor aguarda unos instantes</p>
                      </div>
                    ) : (
                      <>
                        <div className="w-12 h-12 rounded-2xl bg-[#0f172a] border border-slate-700/60 flex items-center justify-center text-sky-400 mb-3 shadow-inner">
                          <UploadCloud className="w-6 h-6" />
                        </div>
                        <h3 className="text-sm sm:text-base font-bold text-white mb-1">
                          Arrastra y suelta tu archivo PDF, Excel o Texto aquí
                        </h3>
                        <p className="text-xs text-slate-400 max-w-md">
                          Soporta catálogos en .PDF, .XLSX, .XLS, .CSV y .TXT con detección automática
                        </p>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#131f37] hover:bg-[#1a2b4c] border border-slate-700 text-slate-200 text-xs font-semibold shadow transition"
                        >
                          <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                          <span>Explorar en tu equipo</span>
                        </button>
                      </>
                    )}
                  </div>
                )}

                {/* Tab 2: Paste Text / List with AI */}
                {importActiveTab === 'text' && (
                  <div className="space-y-3">
                    <label className="text-xs font-semibold text-slate-300 block">
                      Pega la lista de repuestos enviada por tu proveedor o distribuidor:
                    </label>
                    <textarea
                      rows={5}
                      value={pastedText}
                      onChange={(e) => setPastedText(e.target.value)}
                      placeholder={`Ejemplo:\n10 Pantallas OLED Samsung A54 5G $ 35.000\n8 Baterías iPhone 13 3227mAh $ 21.000\n15 Pines de carga Moto G22 Tipo C $ 2.500\n5 Flux en pasta Mechanic UV50 $ 4.500`}
                      className="w-full text-xs font-mono p-3 rounded-xl bg-[#080e1a] border border-slate-700 text-slate-200 outline-none focus:border-sky-500 placeholder-slate-500 resize-none"
                    />
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={handleProcessPastedText}
                        disabled={isProcessingFile || !pastedText.trim()}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 shadow"
                      >
                        {isProcessingFile ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                        )}
                        <span>Procesar y Detectar con IA</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Modal Footer */}
                <div className="flex items-center justify-end pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      setIsImportModalOpen(false);
                      setImportResult(null);
                    }}
                    className="px-5 py-2 rounded-xl bg-[#1e293b] hover:bg-[#334155] text-slate-300 text-xs font-semibold transition"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              /* FASE 2: Vista previa con categorías violetas y confirmación */
              <div className="flex flex-col h-full overflow-hidden">
                {/* Header */}
                <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-sky-500/10 via-purple-500/5 to-transparent">
                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => setImportResult(null)}
                      className="p-1.5 rounded-lg bg-[#0f172a] hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1 transition"
                      title="Volver a seleccionar archivo"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Volver</span>
                    </button>
                    <div>
                      <h3 className="font-bold text-white flex items-center gap-2 text-sm sm:text-base">
                        <span>Sincronización Automática de Inventario</span>
                        <span className="px-2 py-0.5 rounded-full text-[11px] bg-sky-500/20 text-sky-300 font-mono font-semibold border border-sky-500/30">
                          {importResult.fileType}
                        </span>
                      </h3>
                      <p className="text-xs text-slate-400">
                        Archivo: <strong className="text-slate-200">{importResult.fileName}</strong>
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setIsImportModalOpen(false);
                      setImportResult(null);
                    }}
                    className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Highlights */}
                <div className="p-4 bg-[#080e1a]/60 border-b border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                  <div className="p-2.5 rounded-xl bg-[#0b1322] border border-slate-700 flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-blue-950 text-blue-400">
                      <Boxes className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px] block">Artículos Detectados</span>
                      <span className="font-bold text-white text-sm">
                        {importResult.totalParsed} repuestos
                      </span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-[#0b1322] border border-fuchsia-900/60 flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-fuchsia-950 text-fuchsia-400">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px] block">Categorías Autollenadas</span>
                      <span className="font-bold text-violet-fluor text-sm">
                        {importResult.autoCategorizedCount} asignadas por IA
                      </span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-[#0b1322] border border-emerald-900/60 flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-emerald-950 text-emerald-400">
                      <DollarSign className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px] block">Precios Autollenados</span>
                      <span className="font-bold text-emerald-400 text-sm">
                        {importResult.autoPricedCount > 0
                          ? `${importResult.autoPricedCount} con margen +40%`
                          : 'Completados'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Sync Mode Selector */}
                <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0b1220]">
                  <span className="text-xs font-semibold text-slate-300">
                    Modo de Sincronización:
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSyncMode('smart_merge')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                        syncMode === 'smart_merge'
                          ? 'bg-sky-500/20 border-sky-500 text-sky-300 ring-2 ring-sky-500/20'
                          : 'bg-[#080e1a] border-slate-700 text-slate-400'
                      }`}
                    >
                      ⚡ Sincronización Inteligente (Cruzar SKU/Nombre)
                    </button>
                    <button
                      type="button"
                      onClick={() => setSyncMode('add_all')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                        syncMode === 'add_all'
                          ? 'bg-sky-500/20 border-sky-500 text-sky-300 ring-2 ring-sky-500/20'
                          : 'bg-[#080e1a] border-slate-700 text-slate-400'
                      }`}
                    >
                      ➕ Agregar Todos como Nuevos
                    </button>
                  </div>
                </div>

                {/* Table Preview */}
                <div className="flex-1 overflow-y-auto p-4 max-h-[46vh]">
                  <div className="overflow-x-auto border border-slate-800 rounded-xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#080e1a] text-slate-400 font-semibold border-b border-slate-800 sticky top-0">
                        <tr>
                          <th className="p-2.5">SKU</th>
                          <th className="p-2.5">Repuesto / Artículo</th>
                          <th className="p-2.5">Categoría (Autollenada)</th>
                          <th className="p-2.5 text-center">Stock</th>
                          <th className="p-2.5 text-right">Costo ($)</th>
                          <th className="p-2.5 text-right">Venta ($)</th>
                          <th className="p-2.5">Ubicación</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/80 text-slate-300">
                        {importResult.items.slice(0, 100).map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-800/40">
                            <td className="p-2.5 font-mono text-[11px] text-sky-400 font-semibold">
                              {item.sku}
                            </td>
                            <td className="p-2.5 font-medium max-w-[220px] truncate">
                              {item.name}
                            </td>
                            <td className="p-2.5">
                              <span className="text-violet-fluor font-semibold text-[11px] px-2 py-0.5 rounded-md bg-fuchsia-950/60 border border-fuchsia-500/30 inline-block">
                                {item.category}
                              </span>
                            </td>
                            <td className="p-2.5 text-center font-bold">
                              {item.stock} un.
                            </td>
                            <td className="p-2.5 text-right font-mono text-slate-400">
                              {formatMoney(item.costPrice)}
                            </td>
                            <td className="p-2.5 text-right font-mono font-bold text-white">
                              {formatMoney(item.salePrice)}
                            </td>
                            <td className="p-2.5 text-[11px] text-slate-400">
                              {item.location || 'Taller'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {importResult.items.length > 100 && (
                    <p className="text-[11px] text-slate-400 text-center mt-2">
                      Mostrando primeros 100 de {importResult.items.length} artículos a sincronizar
                    </p>
                  )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-800 flex items-center justify-between bg-[#080e1a]/80">
                  <span className="text-xs text-slate-400">
                    Se sincronizará en base de datos local y Google Drive
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setImportResult(null)}
                      className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 text-xs font-semibold hover:bg-slate-800 transition"
                    >
                      Volver
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmSync}
                      className="px-5 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white text-xs font-bold shadow-lg shadow-sky-500/25 flex items-center gap-1.5 transition"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Sincronizar {importResult.totalParsed} Repuestos Ahora</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

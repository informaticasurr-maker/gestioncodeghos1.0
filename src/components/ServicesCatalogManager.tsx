import React, { useState } from 'react';
import {
  Wrench,
  Plus,
  Edit2,
  Trash2,
  DollarSign,
  Clock,
  CheckCircle,
  Smartphone,
  Laptop,
  Layers,
  Search,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { CatalogService } from '../types';

export const ServicesCatalogManager: React.FC = () => {
  const {
    servicesCatalog,
    addCatalogService,
    updateCatalogService,
    deleteCatalogService,
    companySettings,
    formatMoney,
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState<CatalogService | null>(null);

  // Form fields
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Móviles');
  const [defaultPrice, setDefaultPrice] = useState('');
  const [estimatedMinutes, setEstimatedMinutes] = useState('60');
  const [description, setDescription] = useState('');

  const categories = ['Móviles', 'Notebooks', 'Tablets', 'Electrónica', 'Software / SO', 'General'];

  const openNewModal = () => {
    setEditingService(null);
    setName('');
    setCategory('Móviles');
    setDefaultPrice('');
    setEstimatedMinutes('60');
    setDescription('');
    setShowModal(true);
  };

  const openEditModal = (svc: CatalogService) => {
    setEditingService(svc);
    setName(svc.name);
    setCategory(svc.category);
    setDefaultPrice(svc.defaultPrice.toString());
    setEstimatedMinutes((svc.estimatedMinutes || 60).toString());
    setDescription(svc.description || '');
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const priceNum = parseFloat(defaultPrice);
    if (!name.trim() || isNaN(priceNum) || priceNum < 0) {
      alert('Por favor complete el nombre y precio del servicio.');
      return;
    }

    if (editingService) {
      updateCatalogService({
        ...editingService,
        name: name.trim(),
        category,
        defaultPrice: priceNum,
        estimatedMinutes: parseInt(estimatedMinutes) || 60,
        description: description.trim(),
        active: true,
      });
    } else {
      addCatalogService({
        name: name.trim(),
        category,
        defaultPrice: priceNum,
        estimatedMinutes: parseInt(estimatedMinutes) || 60,
        description: description.trim(),
        active: true,
      });
    }

    setShowModal(false);
  };

  const filteredServices = servicesCatalog.filter((s) => {
    const matchCategory = categoryFilter === 'all' || s.category === categoryFilter;
    const q = (searchTerm || '').toLowerCase().trim();
    if (!q) return matchCategory;
    const matchSearch =
      (s.name || '').toLowerCase().includes(q) ||
      (s.description || '').toLowerCase().includes(q) ||
      (s.category || '').toLowerCase().includes(q);
    return matchCategory && matchSearch;
  });

  return (
    <div className="space-y-4">
      
      {/* Title Header */}
      <div className="bg-white p-4 sm:p-6 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
              <Wrench className="w-5 h-5 text-indigo-600" />
              <span>Catálogo y Tarifario de Servicios Técnicos</span>
            </h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
              Admin Técnico
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Carga servicios predefinidos y repuestos con precios base para agilizar la confección de órdenes de trabajo.
          </p>
        </div>

        <button
          onClick={openNewModal}
          className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow transition transform active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>+ Agregar Servicio al Catálogo</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
        
        <div className="flex flex-wrap items-center gap-2 flex-1">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar servicio en catálogo..."
              className="w-full text-xs pl-9 pr-3 py-2 border border-slate-300 rounded-lg bg-slate-50 focus:bg-white"
            />
          </div>

          {/* Category Chips */}
          <div className="flex flex-wrap gap-1">
            <button
              onClick={() => setCategoryFilter('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                categoryFilter === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Todos ({servicesCatalog.length})
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                  categoryFilter === cat
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <span className="text-xs text-slate-500 font-medium">
          Mostrando <strong>{filteredServices.length}</strong> tareas
        </span>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredServices.map((svc) => (
          <div
            key={svc.id}
            className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 hover:border-indigo-300 transition flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {svc.category}
                </span>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(svc)}
                    className="p-1 text-slate-400 hover:text-indigo-600 rounded transition"
                    title="Editar servicio"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`¿Eliminar el servicio "${svc.name}" del catálogo?`)) {
                        deleteCatalogService(svc.id);
                      }
                    }}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded transition"
                    title="Eliminar del catálogo"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <h3 className="font-bold text-sm text-slate-900 leading-snug">{svc.name}</h3>

              {svc.description && (
                <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                  {svc.description}
                </p>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-1 text-xs text-slate-500 font-medium">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>{svc.estimatedMinutes || 60} min est.</span>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-slate-400 block leading-none">Precio Base</span>
                <span className="text-base font-black text-indigo-900 font-mono">
                  {formatMoney(svc.defaultPrice)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL: ADD / EDIT SERVICE */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                <Wrench className="w-4 h-4 text-indigo-400" />
                <span>{editingService ? 'Editar Servicio de Catálogo' : 'Nuevo Servicio / Tarifa'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nombre de la Tarea / Servicio *:</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Cambio de Módulo Display Original"
                  className="w-full p-2.5 border border-slate-300 rounded-lg bg-white font-medium"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Categoría:</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-lg bg-white"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tiempo Estimado (minutos):</label>
                  <input
                    type="number"
                    value={estimatedMinutes}
                    onChange={(e) => setEstimatedMinutes(e.target.value)}
                    placeholder="60"
                    className="w-full p-2.5 border border-slate-300 rounded-lg bg-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Precio Base / Sugerido ({companySettings.currency}) *:</label>
                <input
                  type="number"
                  value={defaultPrice}
                  onChange={(e) => setDefaultPrice(e.target.value)}
                  placeholder="Ej: 45000"
                  className="w-full p-2.5 border border-slate-300 rounded-lg bg-white font-mono font-bold text-sm"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Descripción / Procedimiento Técnico:</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detalle sobre qué repuestos incluye, pruebas de control de calidad..."
                  className="w-full p-2.5 border border-slate-300 rounded-lg bg-white"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold shadow"
                >
                  {editingService ? 'Guardar Cambios' : 'Agregar al Catálogo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

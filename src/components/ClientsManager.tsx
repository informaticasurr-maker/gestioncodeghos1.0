import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Phone,
  Mail,
  MapPin,
  FileText,
  MessageCircle,
  Edit2,
  Trash2,
  Calendar,
  Wrench,
  Download,
  Upload,
  ExternalLink,
  Smartphone,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Client } from '../types';
import { DeviceContactSyncModal } from './DeviceContactSyncModal';

export const ClientsManager: React.FC = () => {
  const {
    clients,
    addClient,
    updateClient,
    deleteClient,
    orders,
    setSelectedOrderForModal,
    setActiveTab,
    formatMoney,
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [viewingHistoryClient, setViewingHistoryClient] = useState<Client | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [documentId, setDocumentId] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [notes, setNotes] = useState('');

  const openNewModal = () => {
    setEditingClient(null);
    setName('');
    setPhone('');
    setEmail('');
    setDocumentId('');
    setAddress('');
    setCity('');
    setNotes('');
    setShowModal(true);
  };

  const openEditModal = (client: Client) => {
    setEditingClient(client);
    setName(client.name);
    setPhone(client.phone);
    setEmail(client.email);
    setDocumentId(client.documentId);
    setAddress(client.address);
    setCity(client.city);
    setNotes(client.notes || '');
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      alert('Nombre y teléfono son requeridos.');
      return;
    }

    if (editingClient) {
      updateClient({
        ...editingClient,
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        documentId: documentId.trim(),
        address: address.trim(),
        city: city.trim(),
        notes: notes.trim(),
      });
    } else {
      addClient({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        documentId: documentId.trim(),
        address: address.trim(),
        city: city.trim(),
        notes: notes.trim(),
      });
    }

    setShowModal(false);
  };

  const filteredClients = clients.filter((c) => {
    const q = (searchTerm || '').toLowerCase().trim();
    if (!q) return true;
    return (
      (c.name || '').toLowerCase().includes(q) ||
      (c.phone || '').includes(q) ||
      (c.documentId || '').toLowerCase().includes(q) ||
      (c.email || '').toLowerCase().includes(q) ||
      (c.city || '').toLowerCase().includes(q) ||
      (c.notes || '').toLowerCase().includes(q)
    );
  });

  // Client's order history
  const getClientOrders = (clientId: string) => {
    return orders.filter((o) => o.client.id === clientId);
  };

  return (
    <div className="space-y-4">
      
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-4 transition-colors">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-xl border border-indigo-100 dark:border-indigo-900/50">
              <Users className="w-5 h-5" />
            </div>
            <span>Directorio de Clientes & Contactos</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Administración de clientes, sincronización con tu teléfono móvil / agenda, historial de servicios y WhatsApp directo.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Sincronizar Contactos del Dispositivo Button */}
          <button
            type="button"
            onClick={() => setShowSyncModal(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-xs font-bold px-3.5 py-2.5 rounded-xl shadow-sm border border-blue-500 transition"
            title="Sincronizar contactos desde la agenda del teléfono, archivo vCard .vcf o lista CSV"
          >
            <Smartphone className="w-4 h-4 text-blue-200 animate-pulse" />
            <span>Sincronizar Contactos</span>
          </button>

          {/* Nuevo Contacto Manual Button */}
          <button
            type="button"
            onClick={openNewModal}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm border border-indigo-500 transition"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Nuevo Contacto</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-3 transition-colors">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            data-search-input="true"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre, teléfono, DNI, email, ciudad..."
            className="search-input-fluor w-full text-xs pl-10 pr-3.5 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 transition"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowSyncModal(true)}
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-semibold"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sincronizar agenda</span>
          </button>

          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Total: <strong className="text-slate-800 dark:text-slate-200">{clients.length}</strong> clientes
          </span>
        </div>
      </div>

      {/* Clients Grid */}
      {filteredClients.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center space-y-3">
          <Users className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
          <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">
            {searchTerm ? 'No se encontraron clientes con esa búsqueda' : 'No hay clientes registrados aún'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Puedes registrar un cliente manualmente o sincronizar rápidamente tus contactos desde tu teléfono celular.
          </p>
          <div className="pt-2 flex justify-center gap-2">
            <button
              onClick={() => setShowSyncModal(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow flex items-center gap-2"
            >
              <Smartphone className="w-4 h-4" />
              <span>Sincronizar del Teléfono</span>
            </button>
            <button
              onClick={openNewModal}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              <span>Nuevo Cliente</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClients.map((client) => {
            const clientOrders = getClientOrders(client.id);
            const cleanPhone = client.phone.replace(/[^0-9]/g, '');

            return (
              <div
                key={client.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 hover:border-indigo-300 dark:hover:border-indigo-700 transition flex flex-col justify-between"
              >
                <div>
                  {/* Name & Actions */}
                  <div className="flex items-start justify-between gap-2 mb-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white">{client.name}</h3>
                      {client.documentId && (
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                          DNI / CUIT: {client.documentId}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(client)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg transition"
                        title="Editar cliente"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`¿Eliminar al cliente ${client.name}?`)) {
                            deleteClient(client.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg transition"
                        title="Eliminar cliente"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Contact Data */}
                  <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                      <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{client.phone}</span>
                    </div>

                    {client.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{client.email}</span>
                      </div>
                    )}

                    {client.address && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{client.address}, {client.city}</span>
                      </div>
                    )}

                    {client.notes && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 italic bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl border border-slate-200 dark:border-slate-800 mt-2">
                        "{client.notes}"
                      </p>
                    )}
                  </div>
                </div>

                {/* Bottom Quick Links */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <button
                    onClick={() => setViewingHistoryClient(client)}
                    className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 px-2.5 py-1.5 rounded-lg transition flex items-center gap-1.5"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>{clientOrders.length} orden(es)</span>
                  </button>

                  <div className="flex items-center gap-1.5">
                    <a
                      href={`https://wa.me/${cleanPhone}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-600 hover:text-white rounded-xl transition shadow-xs"
                      title="Enviar WhatsApp directo"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </a>

                    <a
                      href={`tel:${client.phone}`}
                      className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-800 hover:text-white rounded-xl transition shadow-xs"
                      title="Llamar por teléfono"
                    >
                      <Phone className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: SYNC DEVICE CONTACTS */}
      <DeviceContactSyncModal
        isOpen={showSyncModal}
        onClose={() => setShowSyncModal(false)}
      />

      {/* MODAL: ADD / EDIT CLIENT */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 dark:border-slate-800 transition-colors">
            <div className="bg-slate-900 dark:bg-slate-950 text-white p-4 flex items-center justify-between border-b border-slate-800">
              <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-indigo-400" />
                <span>{editingClient ? 'Editar Cliente' : 'Registrar Nuevo Cliente'}</span>
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
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Nombre Completo *:</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Juan Carlos Pérez"
                  className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Teléfono / WhatsApp *:</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Ej: +54 9 11 1234-5678"
                    className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">DNI / CUIT / ID:</label>
                  <input
                    type="text"
                    value={documentId}
                    onChange={(e) => setDocumentId(e.target.value)}
                    placeholder="Ej: 38.412.901"
                    className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Email:</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ejemplo@email.com"
                  className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Domicilio / Dirección:</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Calle y N°"
                    className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Ciudad:</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Ciudad"
                    className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Notas / Observaciones del Cliente:</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Preferencias de contacto, solicitudes especiales..."
                  className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold shadow"
                >
                  {editingClient ? 'Guardar Cambios' : 'Crear Cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CLIENT REPAIR HISTORY */}
      {viewingHistoryClient && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 dark:border-slate-800">
            <div className="bg-slate-900 dark:bg-slate-950 text-white p-4 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-400" />
                <h3 className="font-bold text-sm text-slate-100">
                  Historial de Reparaciones de: {viewingHistoryClient.name}
                </h3>
              </div>
              <button
                onClick={() => setViewingHistoryClient(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-4 sm:p-6 max-h-[70vh] overflow-y-auto space-y-3">
              {getClientOrders(viewingHistoryClient.id).length === 0 ? (
                <p className="text-center py-6 text-xs text-slate-500 dark:text-slate-400">
                  No hay órdenes generadas todavía para este cliente.
                </p>
              ) : (
                getClientOrders(viewingHistoryClient.id).map((ord) => (
                  <div
                    key={ord.id}
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{ord.orderNumber}</span>
                        <span className="font-medium text-slate-900 dark:text-white">{ord.device.brand} {ord.device.model}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Fecha: {new Date(ord.createdAt).toLocaleDateString('es-AR')} • Total: {formatMoney(ord.totalAmount)}
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        setViewingHistoryClient(null);
                        setSelectedOrderForModal(ord);
                      }}
                      className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-500"
                    >
                      Ver Orden
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="p-3 bg-slate-100 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 text-right">
              <button
                onClick={() => setViewingHistoryClient(null)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-medium"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

import { useState, type FormEvent } from 'react';
import { useClients } from '../hooks/useClients';
import ClientCard from '../components/ClientCard';
import Modal from '../../../shared/components/Modal';
import { Plus, Search, Users, RefreshCw, AlertCircle } from 'lucide-react';
import { validateClient } from '../../../shared/utils/validators';
import type { Client, ClientFormData, ClientPayload } from '../types';

export const ClientPage = () => {
  const { clients, loading, error, refetch, addClient, updateClient, removeClient, restoreClient } = useClients();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState('ALL'); // ALL, ACTIVE, INACTIVE

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState<ClientFormData>({
    businessName: '',
    documentNumber: '',
    email: '',
    phone: '',
    address: '',
    primaryContact: '',
  });
  const [formError, setFormError] = useState<string | null>('');

  const handleOpenCreateModal = () => {
    setEditingClient(null);
    setFormData({
      businessName: '',
      documentNumber: '',
      email: '',
      phone: '',
      address: '',
      primaryContact: '',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (client: Client) => {
    setEditingClient(client);
    setFormData({
      businessName: client.businessName || client.fullName || client.firstName || '',
      documentNumber: client.documentNumber || client.ruc || '',
      email: client.email || '',
      phone: client.phone || '',
      address: client.address || '',
      primaryContact: client.primaryContact || '',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError('');

    const validationError = validateClient(formData);
    if (validationError) {
      setFormError(validationError);
      return;
    }

    const payload: ClientPayload = {
      ...formData,
      firstName: formData.businessName,
      fullName: formData.businessName,
      ruc: formData.documentNumber,
      state: 'A',
      active: true,
    };

    if (editingClient?.id) {
      const result = await updateClient(editingClient.id, payload);
      if (result.success) {
        setIsModalOpen(false);
        void refetch();
      } else {
        setFormError(result.error ?? 'No se pudo actualizar el cliente');
      }
    } else {
      const result = await addClient(payload);
      if (result.success) {
        setIsModalOpen(false);
        void refetch();
      } else {
        setFormError(result.error ?? 'No se pudo crear el cliente');
      }
    }
  };

  // Filtering
  const filteredClients = clients.filter((c) => {
    const name = c.businessName || c.fullName || `${c.firstName || ''} ${c.lastName || ''}`;
    const doc = c.documentNumber || c.ruc || '';

    const matchesName =
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.includes(searchTerm);

    const isActive = c.active !== undefined ? c.active : (c.state === 'A' || c.state === 'ACTIVE');
    if (filterActive === 'ACTIVE') return matchesName && isActive;
    if (filterActive === 'INACTIVE') return matchesName && !isActive;
    return matchesName;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-emerald-400" />
            Gestión de Clientes
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Administración de productores agrícolas y clientes registrados.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={refetch}
            className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
            title="Actualizar datos"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-medium text-sm hover:from-emerald-500 hover:to-teal-500 shadow-lg shadow-emerald-950 transition-all"
          >
            <Plus className="w-4 h-4" />
            Nuevo Cliente
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="glass-card rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nombre o DNI/RUC..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full md:w-auto bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setFilterActive('ALL')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              filterActive === 'ALL' ? 'bg-emerald-500 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Todos ({clients.length})
          </button>
          <button
            onClick={() => setFilterActive('ACTIVE')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              filterActive === 'ACTIVE' ? 'bg-emerald-500 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Activos
          </button>
          <button
            onClick={() => setFilterActive('INACTIVE')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              filterActive === 'INACTIVE' ? 'bg-emerald-500 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Inactivos
          </button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-900/50 text-rose-300 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
          {error}
        </div>
      )}

      {/* Grid view */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-44 rounded-2xl bg-slate-900/60 animate-pulse border border-slate-800" />
          ))}
        </div>
      ) : filteredClients.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center text-slate-400 space-y-3">
          <Users className="w-12 h-12 mx-auto text-slate-600" />
          <p className="text-base font-medium">No se encontraron clientes</p>
          <p className="text-xs text-slate-500">Prueba con otro término de búsqueda o crea un nuevo cliente.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClients.map((client, index) => (
            <ClientCard
              key={client.id || `client-${index}`}
              client={client}
              onEdit={handleOpenEditModal}
              onDelete={removeClient}
              onRestore={restoreClient}
            />
          ))}
        </div>
      )}

      {/* Modal Form */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingClient ? 'Editar Cliente' : 'Nuevo Cliente'}
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {formError && (
            <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-900/50 text-rose-300">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 mb-1">Razón Social / Nombre *</label>
              <input
                type="text"
                required
                placeholder="P.Ej. Agrícola Valle Verde S.A.C."
                value={formData.businessName}
                onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">DNI (8 dígitos) / RUC (11 dígitos)</label>
              <input
                type="text"
                maxLength={11}
                placeholder="P.Ej. 20123456789 o 45678912"
                value={formData.documentNumber}
                onChange={(e) => setFormData({ ...formData, documentNumber: e.target.value.replace(/\D/g, '') })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 mb-1">Teléfono (9 dígitos)</label>
              <input
                type="text"
                maxLength={9}
                placeholder="P.Ej. 987654321"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '') })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Persona de Contacto</label>
              <input
                type="text"
                placeholder="P.Ej. Juan Pérez (Administrador)"
                value={formData.primaryContact}
                onChange={(e) => setFormData({ ...formData, primaryContact: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-400 mb-1">Correo Electrónico</label>
            <input
              type="email"
              placeholder="cliente@ejemplo.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1">Dirección / Fundo</label>
            <input
              type="text"
              placeholder="P.Ej. Av. Los Viñedos 123, Cañete"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium shadow-md shadow-emerald-950"
            >
              {editingClient ? 'Guardar Cambios' : 'Crear Cliente'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ClientPage;

import { useState, type FormEvent } from 'react';
import { useAgrochemicals } from '../hooks/useAgrochemicals';
import AgrochemicalCard from '../components/AgrochemicalCard';
import Modal from '../../../shared/components/Modal';
import { Plus, Search, FlaskConical, RefreshCw, AlertCircle } from 'lucide-react';
import { validateAgrochemical } from '../../../shared/utils/validators';
import type { Agrochemical, AgrochemicalFormData, AgrochemicalPayload } from '../types';

export const AgrochemicalPage = () => {
  const {
    agrochemicals,
    loading,
    error,
    refetch,
    addAgrochemical,
    updateAgrochemical,
    removeAgrochemical,
    restoreAgrochemical,
  } = useAgrochemicals();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [filterActive, setFilterActive] = useState('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Agrochemical | null>(null);
  const [formData, setFormData] = useState<AgrochemicalFormData>({
    commercialName: '',
    activeIngredient: '',
    category: 'INSECTICIDE',
    senasaRegistrationNumber: '',
    registrationExpiry: '',
    maxDose: '',
    waitingPeriodDays: '',
    manufacturer: '',
  });
  const [formError, setFormError] = useState<string | null>('');

  const handleOpenCreateModal = () => {
    setEditingItem(null);
    setFormData({
      commercialName: '',
      activeIngredient: '',
      category: 'INSECTICIDE',
      senasaRegistrationNumber: '',
      registrationExpiry: new Date().toISOString().split('T')[0],
      maxDose: '',
      waitingPeriodDays: '7',
      manufacturer: '',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: Agrochemical) => {
    setEditingItem(item);
    setFormData({
      commercialName: item.commercialName || '',
      activeIngredient: item.activeIngredient || '',
      category: item.category || 'INSECTICIDE',
      senasaRegistrationNumber: item.senasaRegistrationNumber || '',
      registrationExpiry: item.registrationExpiry ? item.registrationExpiry.split('T')[0] : '',
      maxDose: item.maxDose?.toString() || '',
      waitingPeriodDays: item.waitingPeriodDays?.toString() || '',
      manufacturer: item.manufacturer || '',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError('');

    const validationError = validateAgrochemical(formData);
    if (validationError) {
      setFormError(validationError);
      return;
    }

    const payload: AgrochemicalPayload = {
      ...formData,
      maxDose: formData.maxDose ? Number.parseFloat(formData.maxDose) : 0,
      waitingPeriodDays: formData.waitingPeriodDays
        ? Number.parseInt(formData.waitingPeriodDays, 10)
        : 0,
    };

    if (editingItem?.id) {
      const result = await updateAgrochemical(editingItem.id, payload);
      if (result.success) {
        setIsModalOpen(false);
      } else {
        setFormError(result.error ?? 'No se pudo actualizar el agroquímico');
      }
    } else {
      const result = await addAgrochemical(payload);
      if (result.success) {
        setIsModalOpen(false);
      } else {
        setFormError(result.error ?? 'No se pudo crear el agroquímico');
      }
    }
  };

  // Filter
  const filteredAgrochemicals = agrochemicals.filter((item) => {
    const matchesSearch =
      item.commercialName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.activeIngredient.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.senasaRegistrationNumber && item.senasaRegistrationNumber.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = filterCategory === 'ALL' || item.category === filterCategory;
    const isActive = item.active !== false;

    if (filterActive === 'ACTIVE') return matchesSearch && matchesCategory && isActive;
    if (filterActive === 'INACTIVE') return matchesSearch && matchesCategory && !isActive;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <FlaskConical className="w-6 h-6 text-emerald-400" />
            Catálogo de Agroquímicos
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Gestión reactiva de agroquímicos con registro SENASA e intervalo de seguridad.
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
            Nuevo Agroquímico
          </button>
        </div>
      </div>

      {/* Control Bar */}
      <div className="glass-card rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por producto, activo o SENASA..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto text-xs">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="ALL">Todas las Categorías</option>
            <option value="INSECTICIDE">Insecticidas</option>
            <option value="FUNGICIDE">Fungicidas</option>
            <option value="HERBICIDE">Herbicidas</option>
            <option value="FERTILIZER">Fertilizantes</option>
            <option value="BIOSTIMULANT">Bioestimulantes</option>
            <option value="OTHER">Otros</option>
          </select>

          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setFilterActive('ALL')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                filterActive === 'ALL' ? 'bg-emerald-500 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Todos ({agrochemicals.length})
            </button>
            <button
              onClick={() => setFilterActive('ACTIVE')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                filterActive === 'ACTIVE' ? 'bg-emerald-500 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Activos
            </button>
            <button
              onClick={() => setFilterActive('INACTIVE')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                filterActive === 'INACTIVE' ? 'bg-emerald-500 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Inactivos
            </button>
          </div>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-900/50 text-rose-300 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
          {error}
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-52 rounded-2xl bg-slate-900/60 animate-pulse border border-slate-800" />
          ))}
        </div>
      ) : filteredAgrochemicals.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center text-slate-400 space-y-3">
          <FlaskConical className="w-12 h-12 mx-auto text-slate-600" />
          <p className="text-base font-medium">No se encontraron agroquímicos</p>
          <p className="text-xs text-slate-500">Intenta ajustar los filtros de búsqueda o agrega un agroquímico.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAgrochemicals.map((item, index) => (
            <AgrochemicalCard
              key={item.id || `agrochemical-${index}`}
              item={item}
              onEdit={handleOpenEditModal}
              onDelete={removeAgrochemical}
              onRestore={restoreAgrochemical}
            />
          ))}
        </div>
      )}

      {/* Form Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? 'Editar Agroquímico' : 'Nuevo Agroquímico'}
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {formError && (
            <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-900/50 text-rose-300">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 mb-1">Nombre Comercial *</label>
              <input
                type="text"
                required
                value={formData.commercialName}
                onChange={(e) => setFormData({ ...formData, commercialName: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Ingrediente Activo *</label>
              <input
                type="text"
                required
                value={formData.activeIngredient}
                onChange={(e) => setFormData({ ...formData, activeIngredient: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 mb-1">Categoría</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="INSECTICIDE">Insecticida</option>
                <option value="FUNGICIDE">Fungicida</option>
                <option value="HERBICIDE">Hervicida</option>
                <option value="FERTILIZER">Fertilizante</option>
                <option value="BIOSTIMULANT">Bioestimulante</option>
                <option value="OTHER">Otro</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Registro SENASA</label>
              <input
                type="text"
                placeholder="P.Ej. PEMP-1234"
                value={formData.senasaRegistrationNumber}
                onChange={(e) => setFormData({ ...formData, senasaRegistrationNumber: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-slate-400 mb-1">Fecha Vencimiento Reg.</label>
              <input
                type="date"
                value={formData.registrationExpiry}
                onChange={(e) => setFormData({ ...formData, registrationExpiry: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Dosis Máx. (L/ha)</label>
              <input
                type="number"
                step="0.1"
                value={formData.maxDose}
                onChange={(e) => setFormData({ ...formData, maxDose: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Días de Carencia</label>
              <input
                type="number"
                value={formData.waitingPeriodDays}
                onChange={(e) => setFormData({ ...formData, waitingPeriodDays: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-400 mb-1">Fabricante / Laboratorio</label>
            <input
              type="text"
              value={formData.manufacturer}
              onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
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
              {editingItem ? 'Guardar Cambios' : 'Registrar Agroquímico'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AgrochemicalPage;

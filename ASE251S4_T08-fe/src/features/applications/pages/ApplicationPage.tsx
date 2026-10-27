import { useEffect, useState, type FormEvent } from 'react';
import applicationApi from '../api/applicationApi';
import agrochemicalApi from '../../agrochemicals/api/agrochemicalApi';
import Modal from '../../../shared/components/Modal';
import { ClipboardList, Plus, RefreshCw, Calendar, MapPin, FlaskConical, AlertCircle } from 'lucide-react';
import { formatDate } from '../../../shared/utils/formatDate';
import { validateApplication } from '../../../shared/utils/validators';
import { getApiErrorMessage } from '../../../shared/api/getApiErrorMessage';
import type { Agrochemical } from '../../agrochemicals/types';
import type { Application, ApplicationFormData, ApplicationPayload } from '../types';

export const ApplicationPage = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [agrochemicals, setAgrochemicals] = useState<Agrochemical[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Application | null>(null);
  const [formData, setFormData] = useState<ApplicationFormData>({
    applicationDate: new Date().toISOString().split('T')[0],
    fieldSector: '',
    cropType: '',
    appliedAreaHectares: '',
    applicatorName: '',
    agrochemicalId: '',
    dosePerHectare: '',
    notes: ''
  });
  const [formError, setFormError] = useState<string | null>('');

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [appsRes, agroRes] = await Promise.allSettled([
        applicationApi.getAll(),
        agrochemicalApi.getAll()
      ]);

      if (appsRes.status === 'fulfilled') setApplications(appsRes.value || []);
      if (agroRes.status === 'fulfilled') setAgrochemicals(agroRes.value || []);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Error al cargar datos de aplicaciones'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
  }, []);

  const handleOpenCreateModal = () => {
    setEditingItem(null);
    setFormData({
      applicationDate: new Date().toISOString().split('T')[0],
      fieldSector: '',
      cropType: '',
      appliedAreaHectares: '',
      applicatorName: '',
      agrochemicalId: agrochemicals[0]?.id || '',
      dosePerHectare: '',
      notes: ''
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError('');

    const validationError = validateApplication(formData);
    if (validationError) {
      setFormError(validationError);
      return;
    }

    const payload: ApplicationPayload = {
      ...formData,
      appliedAreaHectares: Number.parseFloat(formData.appliedAreaHectares || '0'),
      dosePerHectare: Number.parseFloat(formData.dosePerHectare || '0'),
    };

    try {
      if (editingItem?.id) {
        await applicationApi.update(editingItem.id, payload);
      } else {
        await applicationApi.create(payload);
      }
      setIsModalOpen(false);
      void fetchData();
    } catch (err) {
      setFormError(getApiErrorMessage(err, 'Error al guardar la aplicación'));
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-emerald-400" />
            Aplicaciones de Campo
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Registro y seguimiento fitosanitario en parcelas y sectores de cultivo.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchData}
            className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-medium text-sm hover:from-emerald-500 hover:to-teal-500 shadow-lg shadow-emerald-950 transition-all"
          >
            <Plus className="w-4 h-4" />
            Nueva Aplicación
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-900/50 text-rose-300 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
          {error}
        </div>
      )}

      {/* Grid of Applications */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map((n) => (
            <div key={n} className="h-44 rounded-2xl bg-slate-900/60 animate-pulse border border-slate-800" />
          ))}
        </div>
      ) : applications.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center text-slate-400 space-y-3">
          <ClipboardList className="w-12 h-12 mx-auto text-slate-600" />
          <p className="text-base font-medium">No hay registro de aplicaciones</p>
          <p className="text-xs text-slate-500">Registra una nueva aplicación para dar seguimiento al campo.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {applications.map((app, index) => (
            <div
              key={app.id || `application-${index}`}
              className="glass-card rounded-2xl p-5 border border-slate-800 hover:border-emerald-500/40 hover:shadow-xl transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-emerald-400 border border-slate-700">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white text-base">{app.fieldSector || 'Sector N/A'}</h4>
                    <span className="text-xs text-slate-400">{app.cropType || 'Cultivo N/A'}</span>
                  </div>
                </div>

                <span className="px-2.5 py-1 rounded-md text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {app.appliedAreaHectares ? `${app.appliedAreaHectares} Ha` : 'N/A'}
                </span>
              </div>

              <div className="space-y-2 my-4 text-xs text-slate-300 bg-slate-950/40 p-3 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" /> Fecha:
                  </span>
                  <span className="font-medium text-white">{formatDate(app.applicationDate)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1">
                    <FlaskConical className="w-3.5 h-3.5" /> Dosis:
                  </span>
                  <span className="font-medium text-white">{app.dosePerHectare ? `${app.dosePerHectare} L/Ha` : 'N/A'}</span>
                </div>
                {app.applicatorName && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Aplicador:</span>
                    <span className="font-medium text-white">{app.applicatorName}</span>
                  </div>
                )}
              </div>

              {app.notes && (
                <p className="text-xs text-slate-400 italic bg-slate-900/50 p-2.5 rounded-lg border border-slate-800/80">
                  "{app.notes}"
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Form Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? 'Editar Aplicación' : 'Registrar Aplicación'}
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {formError && (
            <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-900/50 text-rose-300">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 mb-1">Fecha de Aplicación *</label>
              <input
                type="date"
                required
                value={formData.applicationDate}
                onChange={(e) => setFormData({ ...formData, applicationDate: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Sector / Parcela *</label>
              <input
                type="text"
                required
                placeholder="P.Ej. Sector A - Lote 4"
                value={formData.fieldSector}
                onChange={(e) => setFormData({ ...formData, fieldSector: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 mb-1">Tipo de Cultivo *</label>
              <input
                type="text"
                required
                placeholder="P.Ej. Uva de mesa, Palto, Espárrago"
                value={formData.cropType}
                onChange={(e) => setFormData({ ...formData, cropType: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Área Aplicada (Hectáreas)</label>
              <input
                type="number"
                step="0.1"
                placeholder="P.Ej. 5.5"
                value={formData.appliedAreaHectares}
                onChange={(e) => setFormData({ ...formData, appliedAreaHectares: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 mb-1">Agroquímico Seleccionado</label>
              <select
                value={formData.agrochemicalId}
                onChange={(e) => setFormData({ ...formData, agrochemicalId: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="">Seleccionar Agroquímico...</option>
                {agrochemicals.map((agro) => (
                  <option key={agro.id} value={agro.id}>
                    {agro.commercialName} ({agro.activeIngredient})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Dosis por Hectárea (L/Ha)</label>
              <input
                type="number"
                step="0.1"
                value={formData.dosePerHectare}
                onChange={(e) => setFormData({ ...formData, dosePerHectare: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-400 mb-1">Nombre del Aplicador</label>
            <input
              type="text"
              placeholder="Nombre del técnico responsable"
              value={formData.applicatorName}
              onChange={(e) => setFormData({ ...formData, applicatorName: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1">Observaciones / Notas de Campo</label>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
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
              {editingItem ? 'Guardar Cambios' : 'Registrar Aplicación'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ApplicationPage;

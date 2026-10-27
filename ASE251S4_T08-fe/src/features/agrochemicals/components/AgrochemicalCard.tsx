import { FlaskConical, Calendar, AlertCircle, Edit, Trash2, RotateCcw } from 'lucide-react';
import { formatDate } from '../../../shared/utils/formatDate';
import type { Agrochemical } from '../types';

interface AgrochemicalCardProps {
  item: Agrochemical;
  onEdit: (item: Agrochemical) => void;
  onDelete: (id: string) => void | Promise<unknown>;
  onRestore: (id: string) => void | Promise<unknown>;
}

export const AgrochemicalCard = ({ item, onEdit, onDelete, onRestore }: AgrochemicalCardProps) => {
  const {
    id,
    commercialName,
    activeIngredient,
    category,
    senasaRegistrationNumber,
    registrationExpiry,
    maxDose,
    waitingPeriodDays,
    manufacturer,
    active = true
  } = item;

  const getCategoryColor = (cat?: string) => {
    switch (cat) {
      case 'INSECTICIDE': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'FUNGICIDE': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'HERBICIDE': return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case 'FERTILIZER': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      default: return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    }
  };

  return (
    <div className={`glass-card rounded-2xl p-5 border transition-all duration-200 hover:border-emerald-500/40 hover:shadow-xl hover:shadow-emerald-950/20 ${
      !active ? 'opacity-60 border-rose-900/30 bg-slate-900/40' : 'border-slate-800'
    }`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-emerald-400 border border-slate-700/50">
            <FlaskConical className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-semibold text-white text-base leading-snug">{commercialName}</h4>
            <span className="text-xs text-emerald-400 font-medium">{activeIngredient}</span>
          </div>
        </div>

        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider border ${getCategoryColor(category)}`}>
          {category || 'OTROS'}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 my-4 text-xs text-slate-300 bg-slate-950/40 p-3 rounded-xl border border-slate-800/60">
        <div>
          <span className="block text-[10px] text-slate-500 uppercase">Reg. SENASA</span>
          <span className="font-mono text-slate-200">{senasaRegistrationNumber || 'N/A'}</span>
        </div>
        <div>
          <span className="block text-[10px] text-slate-500 uppercase">Dosis Máx.</span>
          <span className="text-slate-200">{maxDose ? `${maxDose} L/ha` : 'N/A'}</span>
        </div>
        <div>
          <span className="block text-[10px] text-slate-500 uppercase">Venc. Registro</span>
          <span className="flex items-center gap-1 text-slate-200">
            <Calendar className="w-3 h-3 text-slate-400" />
            {formatDate(registrationExpiry)}
          </span>
        </div>
        <div>
          <span className="block text-[10px] text-slate-500 uppercase">Carencia (Días)</span>
          <span className="flex items-center gap-1 text-slate-200">
            <AlertCircle className="w-3 h-3 text-amber-400" />
            {waitingPeriodDays || 0} días
          </span>
        </div>
      </div>

      {manufacturer && (
        <p className="text-xs text-slate-400 mb-3">Fabricante: <span className="text-slate-300">{manufacturer}</span></p>
      )}

      <div className="flex items-center justify-between pt-3 border-t border-slate-800/80">
        <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${active ? 'text-emerald-400 bg-emerald-950/50' : 'text-rose-400 bg-rose-950/50'}`}>
          {active ? 'Habilitado' : 'Desactivado'}
        </span>

        <div className="flex items-center gap-1">
          {active ? (
            <>
              <button
                onClick={() => onEdit(item)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition-colors"
                title="Editar agroquímico"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  if (id) void onDelete(id);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                title="Desactivar"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          ) : (
            <button
              onClick={() => {
                if (id) void onRestore(id);
              }}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-amber-400 hover:bg-amber-950/30 border border-amber-800/40 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Restaurar
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AgrochemicalCard;

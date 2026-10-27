import { User, Phone, Mail, MapPin, Edit, Trash2, RotateCcw } from 'lucide-react';
import type { Client } from '../types';

interface ClientCardProps {
  client: Client;
  onEdit: (client: Client) => void;
  onDelete: (id: string) => void | Promise<unknown>;
  onRestore: (id: string) => void | Promise<unknown>;
}

export const ClientCard = ({ client, onEdit, onDelete, onRestore }: ClientCardProps) => {
  const {
    id,
    firstName,
    lastName,
    fullName,
    businessName,
    email,
    phone,
    address,
    documentNumber,
    ruc,
    primaryContact,
    state,
    active
  } = client;

  // El backend ASE251S4_T08-be usa 'businessName' para el nombre del cliente/empresa
  const displayName = businessName || fullName || `${firstName || ''} ${lastName || ''}`.trim() || 'Cliente';
  const docNum = documentNumber || ruc || '';
  const isActive = active !== undefined ? active : (state === 'A' || state === 'ACTIVE');

  return (
    <div className={`glass-card rounded-2xl p-5 border transition-all duration-200 hover:border-emerald-500/40 hover:shadow-xl hover:shadow-emerald-950/20 ${
      !isActive ? 'opacity-60 border-rose-900/30 bg-slate-900/40' : 'border-slate-800'
    }`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-emerald-400 border border-slate-700/50">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-semibold text-white text-base leading-snug">{displayName}</h4>
            {docNum && (
              <span className="text-xs text-slate-400 font-mono">DNI/RUC: {docNum}</span>
            )}
          </div>
        </div>

        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide ${
          isActive 
            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
        }`}>
          {isActive ? 'Activo' : 'Inactivo'}
        </span>
      </div>

      <div className="space-y-2 my-4 text-xs text-slate-300">
        {primaryContact && (
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-medium">Contacto:</span>
            <span className="truncate text-slate-200">{primaryContact}</span>
          </div>
        )}
        {email && (
          <div className="flex items-center gap-2">
            <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{email}</span>
          </div>
        )}
        {phone && (
          <div className="flex items-center gap-2">
            <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>{phone}</span>
          </div>
        )}
        {address && (
          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{address}</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800/80">
        {isActive ? (
          <>
            <button
              onClick={() => onEdit(client)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition-colors"
              title="Editar cliente"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                if (id) void onDelete(id);
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
              title="Desactivar cliente"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </>
        ) : (
          <button
            onClick={() => {
              if (id) void onRestore(id);
            }}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium text-amber-400 hover:bg-amber-950/30 border border-amber-800/40 transition-colors"
            title="Restaurar cliente"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Restaurar
          </button>
        )}
      </div>
    </div>
  );
};

export default ClientCard;

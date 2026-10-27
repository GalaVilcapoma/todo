import { Link } from 'react-router-dom';
import {
  FlaskConical,
  ClipboardList,
  Package,
  Users,
  Activity,
  ArrowRight,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../../../app/providers/AuthProvider';

export const HomePage = () => {
  const { user } = useAuth();

  const modules = [
    {
      title: 'Catálogo de Agroquímicos',
      description: 'Gestión y control de agroquímicos con validación SENASA y días de carencia.',
      icon: FlaskConical,
      path: '/agrochemicals',
      color: 'from-emerald-500 to-teal-600',
      badge: 'WebFlux API'
    },
    {
      title: 'Aplicaciones de Campo',
      description: 'Registro detallado de aplicaciones agrícolas, parcelas y dosis.',
      icon: ClipboardList,
      path: '/applications',
      color: 'from-blue-500 to-indigo-600',
      badge: 'R2DBC DB'
    },
    {
      title: 'Productos Agrícolas',
      description: 'Gestión reactiva del inventario de productos en MongoDB.',
      icon: Package,
      path: '/productos',
      color: 'from-purple-500 to-pink-600',
      badge: 'Mongo DB'
    },
    {
      title: 'Directorio de Clientes',
      description: 'Administración de productores, fundos y clientes registrados.',
      icon: Users,
      path: '/clients',
      color: 'from-amber-500 to-orange-600',
      badge: 'CRUD Activos'
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Banner de Bienvenida */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 p-8 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-semibold text-emerald-400">
            <Sparkles className="w-3.5 h-3.5" />
            Sistema Conectado al Backend Principal: ASE251S4_T08-be
          </div>
          
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
            Bienvenido, <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">{user?.name || 'Operador'}</span>
          </h1>
          
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Plataforma centralizada para el control fitosanitario, gestión de agroquímicos, aplicaciones de campo e inventario integrado con Spring WebFlux.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Link
              to="/agrochemicals"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-medium text-sm hover:from-emerald-500 hover:to-teal-500 shadow-lg shadow-emerald-950 transition-all duration-200"
            >
              Ver Agroquímicos
              <ArrowRight className="w-4 h-4" />
            </Link>
            
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800/60 border border-slate-700 text-xs text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              API conectada
            </div>
          </div>
        </div>
      </div>

      {/* Grid de Módulos */}
      <div>
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-emerald-400" />
          Módulos Principales del Sistema
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {modules.map((mod) => {
            const Icon = mod.icon;
            return (
              <Link
                key={mod.path}
                to={mod.path}
                className="group glass-card rounded-2xl p-6 border border-slate-800 hover:border-emerald-500/40 hover:shadow-xl hover:shadow-emerald-950/20 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${mod.color} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-200`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="px-2.5 py-1 rounded-md text-[11px] font-mono font-medium bg-slate-800 text-slate-300 border border-slate-700/60">
                      {mod.badge}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors mb-2">
                    {mod.title}
                  </h3>

                  <p className="text-xs text-slate-400 leading-relaxed mb-4">
                    {mod.description}
                  </p>
                </div>

                <div className="flex items-center text-xs font-semibold text-emerald-400 group-hover:translate-x-1 transition-transform duration-200">
                  Ingresar al módulo <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default HomePage;

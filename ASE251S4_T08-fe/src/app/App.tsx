import { Route, Routes } from 'react-router-dom';
import Navbar from '../shared/components/Navbar';
import HomePage from '../features/home/pages/HomePage';
import ClientPage from '../features/clients/pages/ClientPage';
import AgrochemicalPage from '../features/agrochemicals/pages/AgrochemicalPage';
import ApplicationPage from '../features/applications/pages/ApplicationPage';
import ProductoPage from '../features/products/pages/ProductoPage';
import { AuthProvider } from './providers/AuthProvider';

export function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
        <Navbar />

        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/clients" element={<ClientPage />} />
            <Route path="/agrochemicals" element={<AgrochemicalPage />} />
            <Route path="/applications" element={<ApplicationPage />} />
            <Route path="/productos" element={<ProductoPage />} />
            <Route path="*" element={<HomePage />} />
          </Routes>
        </main>

        <footer className="border-t border-slate-800/80 bg-slate-950/80 py-6 text-center text-xs text-slate-500">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>© 2026 AVSA Agroquímicos. Sistema Fitosanitario Reactivo.</span>
            <span className="font-mono text-slate-600">API configurada por entorno</span>
          </div>
        </footer>
      </div>
    </AuthProvider>
  );
}

export default App;

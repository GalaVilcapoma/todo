import { useEffect, useState, type FormEvent } from 'react';
import productoApi from '../api/productoApi';
import Modal from '../../../shared/components/Modal';
import { Package, Plus, Search, RefreshCw, Edit, Trash2, RotateCcw, AlertCircle } from 'lucide-react';
import { formatCurrency } from '../../../shared/utils/formatDate';
import { validateProducto } from '../../../shared/utils/validators';
import { getApiErrorMessage } from '../../../shared/api/getApiErrorMessage';
import type { Producto, ProductoFormData, ProductoPayload } from '../types';

export const ProductoPage = () => {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterState, setFilterState] = useState('ALL');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Producto | null>(null);
  const [formData, setFormData] = useState<ProductoFormData>({
    code: '',
    name: '',
    description: '',
    category: '',
    unitPrice: '',
    currentStock: '',
    minimumStock: '0',
    unitMeasure: 'KG',
    origin: 'Nacional',
  });
  const [formError, setFormError] = useState<string | null>('');

  const fetchProductos = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await productoApi.getAll();
      setProductos(data || []);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Error al obtener productos'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductos();
  }, []);

  const handleOpenCreateModal = () => {
    setEditingItem(null);
    setFormData({
      code: '',
      name: '',
      description: '',
      category: '',
      unitPrice: '',
      currentStock: '',
      minimumStock: '0',
      unitMeasure: 'KG',
      origin: 'Nacional',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: Producto) => {
    setEditingItem(item);
    setFormData({
      code: item.code || '',
      name: item.name || item.nombre || '',
      description: item.description || item.descripcion || '',
      category: item.category || item.categoria || '',
      unitPrice:
        item.unitPrice !== undefined
          ? String(item.unitPrice)
          : String(item.price ?? item.precio ?? ''),
      currentStock:
        item.currentStock !== undefined ? String(item.currentStock) : String(item.stock ?? 0),
      minimumStock: String(item.minimumStock ?? 0),
      unitMeasure: item.unitMeasure || item.unit || item.unidad || 'KG',
      origin: item.origin || 'Nacional',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError('');

    const validationError = validateProducto(formData);
    if (validationError) {
      setFormError(validationError);
      return;
    }

    const finalCode = formData.code?.trim() || `PROD-${Math.floor(100 + Math.random() * 900)}`;

    const payload: ProductoPayload = {
      ...formData,
      code: finalCode,
      origin: formData.origin?.trim() || 'Nacional',
      unitPrice: Number.parseFloat(formData.unitPrice || '0'),
      currentStock: Number.parseInt(formData.currentStock || '0', 10),
      minimumStock: Number.parseInt(formData.minimumStock || '0', 10),
      active: true,
    };

    try {
      if (editingItem?.id) {
        await productoApi.update(editingItem.id, payload);
      } else {
        await productoApi.create(payload);
      }
      setIsModalOpen(false);
      void fetchProductos();
    } catch (err) {
      setFormError(getApiErrorMessage(err, 'Error al guardar el producto'));
    }
  };

  const handleRemove = async (id: string) => {
    try {
      await productoApi.remove(id);
      void fetchProductos();
    } catch {
      alert('Error al desactivar producto');
    }
  };

  const handleRestore = async (id: string) => {
    try {
      await productoApi.restore(id);
      void fetchProductos();
    } catch {
      alert('Error al restaurar producto');
    }
  };

  const filteredProductos = productos.filter((prod) => {
    const name = prod.name || prod.nombre || '';
    const category = prod.category || prod.categoria || '';
    const matchesSearch =
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      category.toLowerCase().includes(searchTerm.toLowerCase());

    const active = prod.active !== false && prod.estado !== false;
    if (filterState === 'ACTIVE') return matchesSearch && active;
    if (filterState === 'INACTIVE') return matchesSearch && !active;
    return matchesSearch;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Package className="w-6 h-6 text-emerald-400" />
            Gestión de Productos
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Inventario reactivo de productos almacenados en MongoDB.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchProductos}
            className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-medium text-sm hover:from-emerald-500 hover:to-teal-500 shadow-lg shadow-emerald-950 transition-all"
          >
            <Plus className="w-4 h-4" />
            Nuevo Producto
          </button>
        </div>
      </div>

      {/* Control Bar */}
      <div className="glass-card rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por producto o categoría..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setFilterState('ALL')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              filterState === 'ALL' ? 'bg-emerald-500 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Todos ({productos.length})
          </button>
          <button
            onClick={() => setFilterState('ACTIVE')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              filterState === 'ACTIVE' ? 'bg-emerald-500 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Activos
          </button>
          <button
            onClick={() => setFilterState('INACTIVE')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              filterState === 'INACTIVE' ? 'bg-emerald-500 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Inactivos
          </button>
        </div>
      </div>

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
            <div key={n} className="h-44 rounded-2xl bg-slate-900/60 animate-pulse border border-slate-800" />
          ))}
        </div>
      ) : filteredProductos.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center text-slate-400 space-y-3">
          <Package className="w-12 h-12 mx-auto text-slate-600" />
          <p className="text-base font-medium">No hay productos disponibles</p>
          <p className="text-xs text-slate-500">Agrega un nuevo producto para poblar el inventario.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProductos.map((prod, index) => {
            const isActive = prod.active !== false && prod.estado !== false;
            const name = prod.name || prod.nombre || 'Producto sin nombre';
            const price = prod.unitPrice !== undefined ? prod.unitPrice : (prod.price || prod.precio || 0);
            const stock = prod.currentStock !== undefined ? prod.currentStock : (prod.stock !== undefined ? prod.stock : 0);
            const unit = prod.unitMeasure || prod.unit || prod.unidad || 'UNIDADES';

            return (
              <div
                key={prod.id || `product-${index}`}
                className={`glass-card rounded-2xl p-5 border transition-all hover:border-emerald-500/40 ${
                  !isActive ? 'opacity-60 border-rose-900/30' : 'border-slate-800'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-emerald-400 border border-slate-700">
                      <Package className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-white text-base">{name}</h4>
                      <span className="text-xs text-slate-400">{prod.category || prod.categoria || 'Sin Categoría'}</span>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${isActive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400'}`}>
                    {isActive ? 'Activo' : 'Inactivo'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 my-4 text-xs bg-slate-950/40 p-3 rounded-xl border border-slate-800">
                  <div>
                    <span className="block text-[10px] text-slate-500 uppercase">Precio Unitario</span>
                    <span className="font-semibold text-emerald-400">{formatCurrency(price)}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-500 uppercase">Stock Actual</span>
                    <span className="font-semibold text-slate-200">{stock} {unit}</span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                  {isActive ? (
                    <>
                      <button
                        onClick={() => handleOpenEditModal(prod)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (prod.id) void handleRemove(prod.id);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => {
                        if (prod.id) void handleRestore(prod.id);
                      }}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-amber-400 hover:bg-amber-950/30 border border-amber-800/40 transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Restaurar
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Form */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? 'Editar Producto' : 'Nuevo Producto'}
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {formError && (
            <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-900/50 text-rose-300">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-slate-400 mb-1">Código (opcional)</label>
              <input
                type="text"
                placeholder="Ej. PROD-088"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-slate-400 mb-1">Nombre del Producto *</label>
              <input
                type="text"
                required
                placeholder="Nombre del producto"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 mb-1">Categoría *</label>
              <input
                type="text"
                required
                placeholder="P.Ej. Fertilizantes, Herramientas"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Origen *</label>
              <select
                value={formData.origin}
                onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="Nacional">Nacional</option>
                <option value="Importado">Importado</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-slate-400 mb-1">Precio (S/) *</label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.unitPrice}
                onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Stock Actual</label>
              <input
                type="number"
                value={formData.currentStock}
                onChange={(e) => setFormData({ ...formData, currentStock: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Stock Mínimo</label>
              <input
                type="number"
                value={formData.minimumStock}
                onChange={(e) => setFormData({ ...formData, minimumStock: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Unidad Medida</label>
              <select
                value={formData.unitMeasure}
                onChange={(e) => setFormData({ ...formData, unitMeasure: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="KG">Kilogramos (KG)</option>
                <option value="LITRO">Litros</option>
                <option value="UNIDAD">Unidades</option>
                <option value="SACO">Sacos</option>
                <option value="Caja">Caja</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-400 mb-1">Descripción</label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
              {editingItem ? 'Guardar Cambios' : 'Crear Producto'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ProductoPage;

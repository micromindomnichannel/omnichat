import React, { useState } from 'react';
import { useStore } from '../state/store';
import { useVertical } from '../state/verticalContext';
import { ProductTable } from '../components/commerce/ProductTable';
import { StatusBadge } from '../components/shared/StatusBadge';
import { Modal } from '../components/shared/Modal';
import { Search, Plus, LayoutGrid, List, Check, X } from 'lucide-react';

export function Products() {
  const { state, dispatch, showToast } = useStore();
  const { accentColor } = useVertical();
  const [view, setView] = useState<'grid' | 'table'>('grid');
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [newProduct, setNewProduct] = useState({ name: '', sku: '', price: '', stock: '', category: '' });

  const filtered = state.products.filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase()));

  const handleAddProduct = () => {
    const product = { id: `p${Date.now()}`, name: newProduct.name, sku: newProduct.sku, price: Number(newProduct.price), stock: Number(newProduct.stock), category: newProduct.category, image: 'https://images.unsplash.com/photo-1560343090-f0409e92791a?w=400&h=400&fit=crop', variants: [{ name: 'Default', available: true }] };
    dispatch({ type: 'ADD_PRODUCT', product });
    setShowAddModal(false);
    setNewProduct({ name: '', sku: '', price: '', stock: '', category: '' });
    showToast('Product added', 'success');
  };

  const toggleVariant = (product: any, variantName: string) => {
    const updated = { ...product, variants: product.variants.map((v: any) => v.name === variantName ? { ...v, available: !v.available } : v) };
    dispatch({ type: 'UPDATE_PRODUCT', product: updated });
    showToast('Stock updated', 'success');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-400)' }} />
            <input type="text" placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)}
              style={{ width: 280, height: 36, padding: '0 10px 0 30px', borderRadius: 6, border: '1px solid var(--border)', fontSize: 13, background: 'var(--surface-1)', outline: 'none' }} />
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            <button onClick={() => setView('grid')} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid var(--border)', background: view === 'grid' ? accentColor : 'transparent', color: view === 'grid' ? 'white' : 'var(--ink-600)', cursor: 'pointer' }}><LayoutGrid size={16} /></button>
            <button onClick={() => setView('table')} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid var(--border)', background: view === 'table' ? accentColor : 'transparent', color: view === 'table' ? 'white' : 'var(--ink-600)', cursor: 'pointer' }}><List size={16} /></button>
          </div>
        </div>
        <button onClick={() => setShowAddModal(true)} className="btn btn-primary" style={{ background: accentColor }}><Plus size={16} /> Add Product</button>
      </div>
      {view === 'grid' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
          {filtered.map(product => (
            <div key={product.id} className="card" style={{ padding: 16, cursor: 'pointer' }} onClick={() => setSelectedProduct(selectedProduct?.id === product.id ? null : product)}>
              <img src={product.image} alt={product.name} style={{ width: '100%', height: 160, objectFit: 'cover', borderRadius: 8, marginBottom: 12 }} />
              <h4 style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink-900)', marginBottom: 4 }}>{product.name}</h4>
              <p style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--ink-400)', marginBottom: 8 }}>{product.sku}</p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{product.price.toLocaleString()} EGP</span>
                <StatusBadge status={product.stock === 0 ? 'Out of Stock' : product.stock < 5 ? 'Low Stock' : 'In Stock'} size="sm" />
              </div>
              {selectedProduct?.id === product.id && (
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                  <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-400)', marginBottom: 8, textTransform: 'uppercase' }}>Variants</p>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {product.variants.map((v: any) => (
                      <button key={v.name} onClick={(e) => { e.stopPropagation(); toggleVariant(product, v.name); }}
                        style={{ padding: '4px 10px', borderRadius: 4, border: '1px solid var(--border)', fontSize: 11, fontWeight: 600, cursor: 'pointer', background: v.available ? accentColor + '14' : 'var(--surface-0)', color: v.available ? accentColor : 'var(--ink-400)', textDecoration: v.available ? 'none' : 'line-through' }}>
                        {v.available ? <Check size={10} style={{ display: 'inline', marginRight: 4 }} /> : <X size={10} style={{ display: 'inline', marginRight: 4 }} />}{v.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="card"><ProductTable onProductClick={setSelectedProduct} /></div>
      )}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add Product" size="sm">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <input className="input" placeholder="Product name" value={newProduct.name} onChange={e => setNewProduct({ ...newProduct, name: e.target.value })} />
          <input className="input" placeholder="SKU" value={newProduct.sku} onChange={e => setNewProduct({ ...newProduct, sku: e.target.value })} />
          <input className="input" placeholder="Price (EGP)" type="number" value={newProduct.price} onChange={e => setNewProduct({ ...newProduct, price: e.target.value })} />
          <input className="input" placeholder="Stock quantity" type="number" value={newProduct.stock} onChange={e => setNewProduct({ ...newProduct, stock: e.target.value })} />
          <input className="input" placeholder="Category" value={newProduct.category} onChange={e => setNewProduct({ ...newProduct, category: e.target.value })} />
          <button onClick={handleAddProduct} className="btn btn-primary" style={{ width: '100%', background: accentColor }}>Add Product</button>
        </div>
      </Modal>
    </div>
  );
}

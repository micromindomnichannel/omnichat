import React, { useState } from 'react';
import { useStore } from '../state/store';
import { useVertical } from '../state/verticalContext';
import { StatCard } from '../components/shared/StatCard';
import { Modal } from '../components/shared/Modal';
import { Product } from '../state/mockData';
import {
  Package, Plus, Search, Edit2, Trash2, AlertTriangle, CheckCircle, RefreshCw, Layers
} from 'lucide-react';

export function Products() {
  const { state, dispatch, showToast } = useStore();
  const { accentColor } = useVertical();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);

  // Form State
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [category, setCategory] = useState('Bags');
  const [sku, setSku] = useState('');

  const products = state.products;

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase());
    const matchesCat = selectedCategory === 'all' || p.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const totalProducts = products.length;
  const outOfStockCount = products.filter(p => p.stock <= 0).length;
  const lowStockCount = products.filter(p => p.stock > 0 && p.stock <= 5).length;
  const totalValue = products.reduce((sum, p) => sum + (p.price * p.stock), 0);

  const categories = Array.from(new Set(products.map(p => p.category)));

  const handleOpenAdd = () => {
    setName('');
    setPrice('');
    setStock('10');
    setCategory('Bags');
    setSku(`SKU-${Math.floor(1000 + Math.random() * 9000)}`);
    setEditingProduct(null);
    setShowAddModal(true);
  };

  const handleOpenEdit = (product: Product) => {
    setEditingProduct(product);
    setName(product.name);
    setPrice(product.price.toString());
    setStock(product.stock.toString());
    setCategory(product.category);
    setSku(product.sku);
    setShowAddModal(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price) return;

    const prodData: Product = {
      id: editingProduct ? editingProduct.id : `p${Date.now()}`,
      name,
      price: parseFloat(price) || 0,
      stock: parseInt(stock) || 0,
      category,
      sku,
      image: editingProduct?.image || 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=500&auto=format&fit=crop',
      variants: editingProduct?.variants || [{ name: 'Standard', available: parseInt(stock) > 0 }]
    };

    if (editingProduct) {
      dispatch({ type: 'UPDATE_PRODUCT', product: prodData });
      showToast(`Product "${name}" updated`, 'success');
    } else {
      dispatch({ type: 'ADD_PRODUCT', product: prodData });
      showToast(`New product "${name}" added to inventory!`, 'success');
    }

    setShowAddModal(false);
  };

  const handleDeleteProduct = (id: string, prodName: string) => {
    if (confirm(`Are you sure you want to mark "${prodName}" as deleted?`)) {
      const prod = products.find(p => p.id === id);
      if (prod) {
        dispatch({ type: 'UPDATE_PRODUCT', product: { ...prod, stock: 0 } });
        showToast(`Product "${prodName}" set to Out of Stock`, 'warning');
      }
    }
  };

  const handleAdjustStock = (product: Product, delta: number) => {
    const updated: Product = {
      ...product,
      stock: Math.max(0, product.stock + delta)
    };
    dispatch({ type: 'UPDATE_PRODUCT', product: updated });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header Row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div className="orbit-badge" style={{ marginBottom: 6 }}>
            <Package size={13} color="var(--signal-orange)" />
            <span>Store Inventory Engine</span>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--midnight-ink)' }}>
            Products & Store Inventory
          </h1>
          <p style={{ fontSize: 13, color: 'var(--stone-gray)', marginTop: 2 }}>
            Manage inventory stock levels, prices, and SKUs. Checked automatically during AI customer checkouts.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="btn btn-primary"
          style={{ background: 'var(--signal-orange)', height: 42, padding: '0 20px' }}
        >
          <Plus size={18} /> Add New Product
        </button>
      </div>

      {/* Stats Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
        <StatCard label="Total Items in Catalog" value={totalProducts} />
        <StatCard label="Total Inventory Value" value={`${totalValue.toLocaleString()} EGP`} />
        <StatCard label="Low Stock Warning (≤5)" value={lowStockCount} trend={lowStockCount > 0 ? -1 : 0} />
        <StatCard label="Out of Stock Items" value={outOfStockCount} trend={outOfStockCount > 0 ? -10 : 0} />
      </div>

      {/* Controls Bar */}
      <div className="card" style={{ padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', width: 320 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--stone-gray)' }} />
          <input
            className="input"
            placeholder="Search products or SKU..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: 36 }}
          />
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => setSelectedCategory('all')}
            className={'btn btn-sm ' + (selectedCategory === 'all' ? 'btn-primary' : 'btn-outline')}
            style={{ background: selectedCategory === 'all' ? 'var(--signal-orange)' : 'white' }}
          >
            All Categories
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={'btn btn-sm ' + (selectedCategory === cat ? 'btn-primary' : 'btn-outline')}
              style={{ background: selectedCategory === cat ? 'var(--signal-orange)' : 'white' }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Products Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'var(--surface-0)', borderBottom: '1px solid var(--border)' }}>
              <th style={{ padding: '14px 18px', fontSize: 11, fontWeight: 700, color: 'var(--stone-gray)', textTransform: 'uppercase' }}>Product</th>
              <th style={{ padding: '14px 18px', fontSize: 11, fontWeight: 700, color: 'var(--stone-gray)', textTransform: 'uppercase' }}>SKU</th>
              <th style={{ padding: '14px 18px', fontSize: 11, fontWeight: 700, color: 'var(--stone-gray)', textTransform: 'uppercase' }}>Price (EGP)</th>
              <th style={{ padding: '14px 18px', fontSize: 11, fontWeight: 700, color: 'var(--stone-gray)', textTransform: 'uppercase' }}>Stock Quantity</th>
              <th style={{ padding: '14px 18px', fontSize: 11, fontWeight: 700, color: 'var(--stone-gray)', textTransform: 'uppercase' }}>Status</th>
              <th style={{ padding: '14px 18px', fontSize: 11, fontWeight: 700, color: 'var(--stone-gray)', textTransform: 'uppercase', textAlign: 'right' }}>Admin Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map(p => (
              <tr key={p.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.15s ease' }}>
                <td style={{ padding: '14px 18px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <img src={p.image} alt={p.name} style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover', border: '1px solid var(--border)' }} />
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--midnight-ink)' }}>{p.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--stone-gray)' }}>{p.category}</div>
                    </div>
                  </div>
                </td>

                <td style={{ padding: '14px 18px', fontSize: 12.5, fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--ink-600)' }}>
                  {p.sku}
                </td>

                <td style={{ padding: '14px 18px', fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--midnight-ink)' }}>
                  {p.price.toLocaleString()} EGP
                </td>

                <td style={{ padding: '14px 18px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button onClick={() => handleAdjustStock(p, -1)} className="btn btn-outline btn-sm" style={{ width: 26, padding: 0 }}>-</button>
                    <span style={{ fontSize: 14, fontWeight: 800, minWidth: 24, textAlign: 'center' }}>{p.stock}</span>
                    <button onClick={() => handleAdjustStock(p, 1)} className="btn btn-outline btn-sm" style={{ width: 26, padding: 0 }}>+</button>
                  </div>
                </td>

                <td style={{ padding: '14px 18px' }}>
                  {p.stock <= 0 ? (
                    <span className="orbit-badge" style={{ background: 'var(--danger-bg)', color: 'var(--burnt-coral)', borderColor: 'rgba(217,76,50,0.3)' }}>
                      Out of Stock
                    </span>
                  ) : p.stock <= 5 ? (
                    <span className="orbit-badge" style={{ background: 'rgba(255, 90, 54, 0.1)', color: 'var(--signal-orange)', borderColor: 'rgba(255, 90, 54, 0.3)' }}>
                      Low Stock ({p.stock})
                    </span>
                  ) : (
                    <span className="orbit-badge-mint">In Stock</span>
                  )}
                </td>

                <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
                    <button onClick={() => handleOpenEdit(p)} className="btn btn-outline btn-sm">
                      <Edit2 size={14} /> Edit
                    </button>
                    <button onClick={() => handleDeleteProduct(p.id, p.name)} className="btn btn-ghost btn-sm" style={{ color: 'var(--burnt-coral)' }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Product Add/Edit Modal */}
      {showAddModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
        }}>
          <div className="card animate-slide-up" style={{ width: '100%', maxWidth: 480, padding: 28, borderRadius: 16, background: 'white' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--midnight-ink)' }}>
                {editingProduct ? 'Edit Inventory Item' : 'Add New Inventory Product'}
              </h2>
              <button onClick={() => setShowAddModal(false)} className="btn btn-ghost btn-sm">✕</button>
            </div>

            <form onSubmit={handleSaveProduct} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--midnight-ink)', marginBottom: 6, display: 'block' }}>Product Name</label>
                <input className="input" value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. Black Leather Bag" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--midnight-ink)', marginBottom: 6, display: 'block' }}>Price (EGP)</label>
                  <input className="input" type="number" value={price} onChange={e => setPrice(e.target.value)} required placeholder="850" />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--midnight-ink)', marginBottom: 6, display: 'block' }}>Stock Quantity</label>
                  <input className="input" type="number" value={stock} onChange={e => setStock(e.target.value)} required placeholder="10" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--midnight-ink)', marginBottom: 6, display: 'block' }}>Category</label>
                  <select className="input" value={category} onChange={e => setCategory(e.target.value)}>
                    <option>Bags</option>
                    <option>Apparel</option>
                    <option>Footwear</option>
                    <option>Accessories</option>
                    <option>Electronics</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--midnight-ink)', marginBottom: 6, display: 'block' }}>SKU Code</label>
                  <input className="input" value={sku} onChange={e => setSku(e.target.value)} required />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                <button type="button" onClick={() => setShowAddModal(false)} className="btn btn-outline" style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, background: 'var(--signal-orange)' }}>
                  {editingProduct ? 'Save Inventory Changes' : 'Add to Store Inventory'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

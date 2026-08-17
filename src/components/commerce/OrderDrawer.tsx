import React, { useState } from 'react';
import { useStore } from '../../state/store';
import { useVertical } from '../../state/verticalContext';
import { EGYPTIAN_GOVERNORATES } from '../../state/mockData';
import { Check } from 'lucide-react';

interface Props {
  customerId: string;
  onClose: () => void;
}

export function OrderDrawer({ customerId, onClose }: Props) {
  const { state, dispatch, showToast } = useStore();
  const { accentColor } = useVertical();
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [productId, setProductId] = useState('');
  const [variant, setVariant] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [governorate, setGovernorate] = useState('');
  const [address, setAddress] = useState('');

  const customer = state.customers.find(c => c.id === customerId);
  const product = state.products.find(p => p.id === productId);
  const deliveryFee = 50;
  const total = ((product?.price || 0) * quantity) + deliveryFee;
  const canSubmit = productId && name && phone && governorate && address;

  const handleSubmit = () => {
    const newOrder = { id: `${1050 + state.orders.length}`, customerId: customerId || 'c1', productId, productName: product?.name || '', variant, quantity, total, status: 'Confirmed' as const, date: new Date().toISOString().split('T')[0], paymentMethod: 'COD' as const, governorate, address };
    dispatch({ type: 'ADD_ORDER', order: newOrder });
    setStep('success');
  };

  const handleSendToLogistics = () => {
    const lastOrder = state.orders[state.orders.length - 1];
    if (lastOrder) {
      dispatch({ type: 'UPDATE_ORDER', order: { ...lastOrder, status: 'Processing' } });
      showToast('Sent to logistics — simulated', 'success');
    }
    onClose();
  };

  if (step === 'success') {
    const lastOrder = state.orders[state.orders.length - 1];
    return (
      <div style={{ textAlign: 'center', padding: '40px 20px' }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--success-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <Check size={32} color="var(--success)" />
        </div>
        <h3 style={{ fontSize: 18, fontWeight: 650, color: 'var(--ink-900)', marginBottom: 8 }}>Order #{lastOrder?.id} created successfully</h3>
        <div style={{ marginBottom: 24 }}>
          <span style={{ padding: '4px 12px', borderRadius: 4, background: 'var(--success-bg)', color: 'var(--success)', fontSize: 12, fontWeight: 600 }}>Confirmed</span>
        </div>
        <button onClick={handleSendToLogistics} className="btn btn-primary" style={{ width: '100%', background: accentColor }}>Send to Logistics</button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-600)', marginBottom: 6, display: 'block' }}>Customer</label>
        <div style={{ padding: 12, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-0)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <img src={customer?.avatar || state.customers[0]?.avatar} alt="" style={{ width: 32, height: 32, borderRadius: '50%' }} />
          <span style={{ fontSize: 14, fontWeight: 600 }}>{customer?.name || 'Select customer'}</span>
        </div>
      </div>
      <div>
        <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-600)', marginBottom: 6, display: 'block' }}>Product *</label>
        <select className="input" value={productId} onChange={e => { setProductId(e.target.value); setVariant(''); }}>
          <option value="">Select product</option>
          {state.products.map(p => <option key={p.id} value={p.id}>{p.name} — {p.price.toLocaleString()} EGP</option>)}
        </select>
      </div>
      {product && (
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-600)', marginBottom: 6, display: 'block' }}>Variant</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {product.variants.map((v: any) => (
              <button key={v.name} onClick={() => setVariant(v.name)}
                style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid var(--border)', fontSize: 12, fontWeight: 600, cursor: 'pointer', background: variant === v.name ? accentColor : 'var(--surface-0)', color: variant === v.name ? 'white' : 'var(--ink-600)', opacity: v.available ? 1 : 0.5, textDecoration: v.available ? 'none' : 'line-through' }}
                disabled={!v.available}>{v.name}</button>
            ))}
          </div>
        </div>
      )}
      <div>
        <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-600)', marginBottom: 6, display: 'block' }}>Quantity</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={() => setQuantity(Math.max(1, quantity - 1))} style={{ width: 32, height: 32, borderRadius: 6, border: '1px solid var(--border)', cursor: 'pointer' }}>-</button>
          <span style={{ fontSize: 14, fontWeight: 600, minWidth: 24, textAlign: 'center' }}>{quantity}</span>
          <button onClick={() => setQuantity(quantity + 1)} style={{ width: 32, height: 32, borderRadius: 6, border: '1px solid var(--border)', cursor: 'pointer' }}>+</button>
        </div>
      </div>
      <div style={{ padding: 16, borderRadius: 8, background: 'var(--surface-0)', border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 13, color: 'var(--ink-600)' }}>Unit price</span>
          <span style={{ fontSize: 13, fontFamily: 'var(--font-mono)' }}>{(product?.price || 0).toLocaleString()} EGP</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 13, color: 'var(--ink-600)' }}>Delivery fee</span>
          <span style={{ fontSize: 13, fontFamily: 'var(--font-mono)' }}>{deliveryFee} EGP</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8, borderTop: '1px solid var(--border)' }}>
          <span style={{ fontSize: 14, fontWeight: 650 }}>Total</span>
          <span style={{ fontSize: 18, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{total.toLocaleString()} EGP</span>
        </div>
      </div>
      <div>
        <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-600)', marginBottom: 6, display: 'block' }}>Payment Method</label>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ flex: 1, padding: 12, borderRadius: 8, border: '2px solid ' + accentColor, background: accentColor + '08', textAlign: 'center', fontSize: 13, fontWeight: 600 }}>Cash on Delivery</div>
          <div style={{ flex: 1, padding: 12, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-0)', textAlign: 'center', fontSize: 13, color: 'var(--ink-400)', opacity: 0.6 }}>Card (Coming soon)</div>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input className="input" placeholder="Full name *" value={name} onChange={e => setName(e.target.value)} />
        <input className="input" placeholder="Phone number *" value={phone} onChange={e => setPhone(e.target.value)} />
        <select className="input" value={governorate} onChange={e => setGovernorate(e.target.value)}>
          <option value="">Select governorate *</option>
          {EGYPTIAN_GOVERNORATES.map(g => <option key={g} value={g}>{g}</option>)}
        </select>
        <textarea className="input" placeholder="Address *" rows={2} value={address} onChange={e => setAddress(e.target.value)} />
      </div>
      <button onClick={handleSubmit} disabled={!canSubmit} className="btn btn-primary" style={{ width: '100%', marginTop: 'auto', background: accentColor }}>Confirm Order</button>
    </div>
  );
}

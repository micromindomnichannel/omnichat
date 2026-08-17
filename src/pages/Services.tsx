import React, { useState } from 'react';
import { useStore } from '../state/store';
import { useVertical } from '../state/verticalContext';
import { ServiceTable } from '../components/appointments/ServiceTable';
import { Modal } from '../components/shared/Modal';
import { Search, Plus, LayoutGrid, List, Clock } from 'lucide-react';

export function Services() {
  const { state, dispatch, showToast } = useStore();
  const { accentColor } = useVertical();
  const [view, setView] = useState<'grid' | 'table'>('grid');
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newService, setNewService] = useState({ name: '', price: '', duration: '', category: '', description: '' });

  const filtered = state.services.filter(s => !search || s.name.toLowerCase().includes(search.toLowerCase()));

  const handleAdd = () => {
    const service = { id: `s${Date.now()}`, name: newService.name, price: Number(newService.price), duration: Number(newService.duration), category: newService.category, description: newService.description, availability: [{ day: 'Saturday', start: '09:00', end: '17:00', available: true }, { day: 'Sunday', start: '09:00', end: '17:00', available: true }, { day: 'Monday', start: '09:00', end: '17:00', available: true }, { day: 'Tuesday', start: '09:00', end: '17:00', available: true }, { day: 'Wednesday', start: '09:00', end: '17:00', available: true }, { day: 'Thursday', start: '09:00', end: '17:00', available: true }, { day: 'Friday', start: '09:00', end: '14:00', available: false }] };
    dispatch({ type: 'ADD_SERVICE', service });
    setShowAddModal(false);
    setNewService({ name: '', price: '', duration: '', category: '', description: '' });
    showToast('Service added', 'success');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-400)' }} />
            <input type="text" placeholder="Search services..." value={search} onChange={e => setSearch(e.target.value)}
              style={{ width: 280, height: 36, padding: '0 10px 0 30px', borderRadius: 6, border: '1px solid var(--border)', fontSize: 13, background: 'var(--surface-1)', outline: 'none' }} />
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            <button onClick={() => setView('grid')} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid var(--border)', background: view === 'grid' ? accentColor : 'transparent', color: view === 'grid' ? 'white' : 'var(--ink-600)', cursor: 'pointer' }}><LayoutGrid size={16} /></button>
            <button onClick={() => setView('table')} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid var(--border)', background: view === 'table' ? accentColor : 'transparent', color: view === 'table' ? 'white' : 'var(--ink-600)', cursor: 'pointer' }}><List size={16} /></button>
          </div>
        </div>
        <button onClick={() => setShowAddModal(true)} className="btn btn-primary" style={{ background: accentColor }}><Plus size={16} /> Add Service</button>
      </div>
      {view === 'grid' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
          {filtered.map(service => (
            <div key={service.id} className="card" style={{ padding: 20 }}>
              <h4 style={{ fontSize: 15, fontWeight: 650, color: 'var(--ink-900)', marginBottom: 8 }}>{service.name}</h4>
              <p style={{ fontSize: 13, color: 'var(--ink-600)', marginBottom: 12, lineHeight: 1.5 }}>{service.description}</p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>From {service.price.toLocaleString()} EGP</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 8px', borderRadius: 4, background: 'var(--surface-0)', fontSize: 12, fontWeight: 600, color: 'var(--ink-600)' }}><Clock size={12} /> {service.duration} min</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card"><ServiceTable onServiceClick={() => {}} /></div>
      )}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add Service" size="sm">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <input className="input" placeholder="Service name" value={newService.name} onChange={e => setNewService({ ...newService, name: e.target.value })} />
          <input className="input" placeholder="Price (EGP)" type="number" value={newService.price} onChange={e => setNewService({ ...newService, price: e.target.value })} />
          <input className="input" placeholder="Duration (minutes)" type="number" value={newService.duration} onChange={e => setNewService({ ...newService, duration: e.target.value })} />
          <input className="input" placeholder="Category" value={newService.category} onChange={e => setNewService({ ...newService, category: e.target.value })} />
          <textarea className="input" placeholder="Description" rows={2} value={newService.description} onChange={e => setNewService({ ...newService, description: e.target.value })} />
          <button onClick={handleAdd} className="btn btn-primary" style={{ width: '100%', background: accentColor }}>Add Service</button>
        </div>
      </Modal>
    </div>
  );
}

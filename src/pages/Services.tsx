import React, { useState } from 'react';
import { useStore } from '../state/store';
import { useVertical } from '../state/verticalContext';
import { ServiceTable } from '../components/appointments/ServiceTable';
import { Modal } from '../components/shared/Modal';
import { ImageUploader } from '../components/shared/ImageUploader';
import { PageHeader, Card, EmptyState } from '../components/dash/kit';
import { Search, Plus, LayoutGrid, List, Clock, Image as ImageIcon, Briefcase } from 'lucide-react';

export function Services() {
  const { state, dispatch, showToast } = useStore();
  const { accentColor } = useVertical();
  const [view, setView] = useState<'grid' | 'table'>('grid');
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingService, setEditingService] = useState<any>(null);
  const [newService, setNewService] = useState({
    name: '',
    price: '',
    duration: '',
    category: 'Dental / Clinic',
    description: '',
    image: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=500&auto=format&fit=crop'
  });

  const filtered = state.services.filter(s => !search || s.name.toLowerCase().includes(search.toLowerCase()));

  const handleOpenAdd = () => {
    setEditingService(null);
    setNewService({
      name: '',
      price: '',
      duration: '30',
      category: 'Dental / Clinic',
      description: '',
      image: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=500&auto=format&fit=crop'
    });
    setShowAddModal(true);
  };

  const handleOpenEdit = (service: any) => {
    setEditingService(service);
    setNewService({
      name: service.name,
      price: String(service.price),
      duration: String(service.duration),
      category: service.category || 'Dental / Clinic',
      description: service.description || '',
      image: service.image || ''
    });
    setShowAddModal(true);
  };

  const handleSave = () => {
    if (!newService.name || !newService.price) return;
    const service = {
      id: editingService ? editingService.id : `s${Date.now()}`,
      name: newService.name,
      price: Number(newService.price),
      duration: Number(newService.duration) || 30,
      category: newService.category,
      description: newService.description,
      image: newService.image || 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=500&auto=format&fit=crop',
      availability: editingService?.availability || [
        { day: 'Saturday', start: '09:00', end: '17:00', available: true },
        { day: 'Sunday', start: '09:00', end: '17:00', available: true },
        { day: 'Monday', start: '09:00', end: '17:00', available: true },
        { day: 'Tuesday', start: '09:00', end: '17:00', available: true },
        { day: 'Wednesday', start: '09:00', end: '17:00', available: true },
        { day: 'Thursday', start: '09:00', end: '17:00', available: true },
        { day: 'Friday', start: '09:00', end: '14:00', available: false }
      ]
    };

    if (editingService) {
      dispatch({ type: 'UPDATE_SERVICE', service });
      showToast(`Service "${service.name}" updated`, 'success');
    } else {
      dispatch({ type: 'ADD_SERVICE', service });
      showToast('Service added with pre-loaded AI photo!', 'success');
    }
    setShowAddModal(false);
    setEditingService(null);
  };

  const handleDelete = (id: string, sName: string) => {
    if (confirm(`Are you sure you want to delete "${sName}" from services?`)) {
      dispatch({ type: 'DELETE_SERVICE', id });
      setShowAddModal(false);
      setEditingService(null);
      showToast(`Service "${sName}" deleted`, 'warning');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <PageHeader
        eyebrow="Catalog"
        title="Services"
        sub="Services, durations, and pricing the AI books for you."
        actions={
          <button onClick={handleOpenAdd} className="btn btn-primary" style={{ background: 'var(--signal-orange)', border: 'none', color: '#fff', height: 40, padding: '0 18px', borderRadius: 10, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <Plus size={16} /> Add New Service
          </button>
        }
      />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-400)' }} />
            <input
              type="text"
              placeholder="Search services..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: 280, height: 36, padding: '0 10px 0 30px', borderRadius: 6, border: '1px solid var(--border)', fontSize: 13, background: 'var(--surface-1)', outline: 'none' }}
            />
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            <button onClick={() => setView('grid')} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid var(--border)', background: view === 'grid' ? 'var(--signal-orange)' : 'transparent', color: view === 'grid' ? 'white' : 'var(--ink-600)', cursor: 'pointer' }}><LayoutGrid size={16} /></button>
            <button onClick={() => setView('table')} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid var(--border)', background: view === 'table' ? 'var(--signal-orange)' : 'transparent', color: view === 'table' ? 'white' : 'var(--ink-600)', cursor: 'pointer' }}><List size={16} /></button>
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Briefcase size={24} color="var(--signal-orange)" />}
            title="No services found"
            copy="Add a service so customers can book it through chat."
            action={<button onClick={handleOpenAdd} style={{ background: 'var(--signal-orange)', border: 'none', color: '#fff', height: 40, padding: '0 18px', borderRadius: 10, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}><Plus size={16} /> Add New Service</button>}
          />
        </Card>
      ) : view === 'grid' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
          {filtered.map(service => (
            <Card key={service.id} onClick={() => handleOpenEdit(service)} style={{ padding: 0, overflow: 'hidden', borderRadius: 12, cursor: 'pointer', transition: 'box-shadow 0.2s' }}>
              <div style={{ height: 140, overflow: 'hidden', position: 'relative', background: 'var(--surface-0)' }}>
                <img
                  src={service.image || 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=500&auto=format&fit=crop'}
                  alt={service.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <span className="orbit-badge" style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none' }}>
                  {service.category}
                </span>
              </div>
              <div style={{ padding: 16 }}>
                <h4 style={{ fontSize: 15, fontWeight: 700, color: 'var(--midnight-ink)', marginBottom: 6 }}>{service.name}</h4>
                <p style={{ fontSize: 12.5, color: 'var(--ink-600)', marginBottom: 12, lineHeight: 1.5 }}>{service.description}</p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: 10 }}>
                  <span style={{ fontSize: 14, fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--midnight-ink)' }}>{service.price.toLocaleString()} EGP</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 8px', borderRadius: 4, background: 'var(--surface-0)', fontSize: 12, fontWeight: 600, color: 'var(--ink-600)' }}>
                    <Clock size={12} /> {service.duration} min
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card style={{ padding: 0, overflow: 'hidden' }}><ServiceTable services={filtered} onServiceClick={handleOpenEdit} /></Card>
      )}

      <Modal isOpen={showAddModal} onClose={() => { setShowAddModal(false); setEditingService(null); }} title={editingService ? 'Edit Service' : 'Add Service & Pre-loaded Photo'} size="sm">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--midnight-ink)', marginBottom: 4, display: 'block' }}>Service Name</label>
            <input className="input" placeholder="e.g. Dental Cleaning & Teeth Whitening" value={newService.name} onChange={e => setNewService({ ...newService, name: e.target.value })} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--midnight-ink)', marginBottom: 4, display: 'block' }}>Price (EGP)</label>
              <input className="input" placeholder="600" type="number" value={newService.price} onChange={e => setNewService({ ...newService, price: e.target.value })} />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--midnight-ink)', marginBottom: 4, display: 'block' }}>Duration (minutes)</label>
              <input className="input" placeholder="30" type="number" value={newService.duration} onChange={e => setNewService({ ...newService, duration: e.target.value })} />
            </div>
          </div>

          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--midnight-ink)', marginBottom: 4, display: 'block' }}>Category</label>
            <input className="input" placeholder="Dental / Clinic" value={newService.category} onChange={e => setNewService({ ...newService, category: e.target.value })} />
          </div>

          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--midnight-ink)', marginBottom: 4, display: 'block' }}>Description</label>
            <textarea className="input" placeholder="Service description..." rows={2} value={newService.description} onChange={e => setNewService({ ...newService, description: e.target.value })} />
          </div>

          <ImageUploader
            value={newService.image}
            onChange={url => setNewService({ ...newService, image: url })}
            label="Service Photo (Upload File or Select)"
          />

          <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
            {editingService && (
              <button
                type="button"
                onClick={() => handleDelete(editingService.id, editingService.name)}
                className="btn btn-outline"
                style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}
              >
                Delete
              </button>
            )}
            <button onClick={handleSave} className="btn btn-primary" style={{ flex: 1, background: 'var(--signal-orange)' }}>
              {editingService ? 'Save Changes' : 'Add Service & Photo'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

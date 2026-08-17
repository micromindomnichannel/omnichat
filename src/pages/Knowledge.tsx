import React, { useState } from 'react';
import { useStore } from '../state/store';
import { useVertical } from '../state/verticalContext';
import { Tabs } from '../components/shared/Tabs';
import { Modal } from '../components/shared/Modal';
import { Search, Plus, Trash2, FileText, Image, Link, Check } from 'lucide-react';

export function Knowledge() {
  const { state, dispatch, showToast } = useStore();
  const { vertical, accentColor } = useVertical();
  const [activeTab, setActiveTab] = useState('FAQs');
  const [search, setSearch] = useState('');
  const [showAddFAQ, setShowAddFAQ] = useState(false);
  const [showAddSource, setShowAddSource] = useState(false);
  const [newFAQ, setNewFAQ] = useState({ question: '', answer: '', category: '' });
  const [newSource, setNewSource] = useState({ name: '', type: 'PDF' as const });

  const tabs = vertical === 'commerce'
    ? ['FAQs', 'Products', 'Policies']
    : ['FAQs', 'Services', 'Policies'];

  const filteredFAQs = state.faqs.filter(f =>
    f.vertical === vertical && (!search || f.question.toLowerCase().includes(search.toLowerCase()))
  );

  const handleAddFAQ = () => {
    dispatch({
      type: 'ADD_FAQ',
      faq: { id: `faq${Date.now()}`, ...newFAQ, vertical }
    });
    setShowAddFAQ(false);
    setNewFAQ({ question: '', answer: '', category: '' });
    showToast('FAQ added', 'success');
  };

  const handleAddSource = () => {
    dispatch({
      type: 'ADD_SOURCE',
      source: { id: `src${Date.now()}`, ...newSource, inUse: false }
    });
    setShowAddSource(false);
    setNewSource({ name: '', type: 'PDF' });
    showToast('Source uploaded', 'success');
  };

  const sourceIcons: Record<string, React.ElementType> = { PDF: FileText, DOCX: FileText, Image, Text: FileText, URL: Link };

  return (
    <div style={{ display: 'flex', gap: 24, height: 'calc(100vh - 140px)' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} />
          <button onClick={() => setShowAddFAQ(true)} className="btn btn-primary" style={{ background: accentColor }}>
            <Plus size={16} /> Add {activeTab === 'FAQs' ? 'FAQ' : activeTab === 'Policies' ? 'Policy' : 'Item'}
          </button>
        </div>

        <div style={{ position: 'relative', marginBottom: 8 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-400)' }} />
          <input
            type="text"
            placeholder="Search knowledge base..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: 280, height: 36, padding: '0 10px 0 30px', borderRadius: 6, border: '1px solid var(--border)', fontSize: 13, background: 'var(--surface-1)', outline: 'none' }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, overflow: 'auto' }}>
          {filteredFAQs.map(faq => (
            <div key={faq.id} className="card" style={{ padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div>
                  <h4 style={{ fontSize: 14, fontWeight: 650, color: 'var(--ink-900)', marginBottom: 4 }}>{faq.question}</h4>
                  <p style={{ fontSize: 13, color: 'var(--ink-600)', lineHeight: 1.5 }}>{faq.answer}</p>
                  <span style={{
                    display: 'inline-block', marginTop: 8, padding: '2px 8px', borderRadius: 4,
                    background: 'var(--surface-0)', fontSize: 11, fontWeight: 600, color: 'var(--ink-400)'
                  }}>
                    {faq.category}
                  </span>
                </div>
                <button
                  onClick={() => { dispatch({ type: 'DELETE_FAQ', id: faq.id }); showToast('FAQ deleted', 'warning'); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
                >
                  <Trash2 size={14} color="var(--ink-400)" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sources Rail */}
      <div style={{ width: 280, minWidth: 280 }} className="hide-below-900">
        <div className="card" style={{ padding: 20, height: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 650, color: 'var(--ink-900)' }}>Sources</h3>
            <button onClick={() => setShowAddSource(true)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
              <Plus size={16} color={accentColor} />
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {state.sources.map(source => {
              const Icon = sourceIcons[source.type] || FileText;
              return (
                <div key={source.id} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                  borderRadius: 6, background: 'var(--surface-0)', border: '1px solid var(--border)'
                }}>
                  <Icon size={16} color="var(--ink-400)" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-900)' }} className="truncate">{source.name}</p>
                    <p style={{ fontSize: 11, color: 'var(--ink-400)' }}>{source.type}</p>
                  </div>
                  {source.inUse && (
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: accentColor }} />
                  )}
                  <button
                    onClick={() => { dispatch({ type: 'DELETE_SOURCE', id: source.id }); showToast('Source deleted', 'warning'); }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
                  >
                    <Trash2 size={12} color="var(--ink-400)" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <Modal isOpen={showAddFAQ} onClose={() => setShowAddFAQ(false)} title="Add FAQ" size="sm">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <input className="input" placeholder="Question" value={newFAQ.question} onChange={e => setNewFAQ({ ...newFAQ, question: e.target.value })} />
          <textarea className="input" placeholder="Answer" rows={3} value={newFAQ.answer} onChange={e => setNewFAQ({ ...newFAQ, answer: e.target.value })} />
          <input className="input" placeholder="Category" value={newFAQ.category} onChange={e => setNewFAQ({ ...newFAQ, category: e.target.value })} />
          <button onClick={handleAddFAQ} className="btn btn-primary" style={{ width: '100%', background: accentColor }}>Add FAQ</button>
        </div>
      </Modal>

      <Modal isOpen={showAddSource} onClose={() => setShowAddSource(false)} title="Add Source" size="sm">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <input className="input" placeholder="Source name" value={newSource.name} onChange={e => setNewSource({ ...newSource, name: e.target.value })} />
          <select className="input" value={newSource.type} onChange={e => setNewSource({ ...newSource, type: e.target.value as any })}>
            <option value="PDF">PDF</option>
            <option value="DOCX">DOCX</option>
            <option value="Image">Image</option>
            <option value="Text">Text</option>
            <option value="URL">URL</option>
          </select>
          <button onClick={handleAddSource} className="btn btn-primary" style={{ width: '100%', background: accentColor }}>Add Source</button>
        </div>
      </Modal>
    </div>
  );
}

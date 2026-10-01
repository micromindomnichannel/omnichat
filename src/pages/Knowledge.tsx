import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../state/store';
import { useVertical } from '../state/verticalContext';
import { Tabs } from '../components/shared/Tabs';
import { Modal } from '../components/shared/Modal';
import { PageHeader, Card, SectionTitle, EmptyState } from '../components/dash/kit';
import { Search, Plus, Trash2, FileText, Image, Link, Check, Sparkles, BookOpen, Shield, Package, Scissors, ExternalLink } from 'lucide-react';
import { api } from '../services/api';

interface PolicyItem {
  id: string;
  title: string;
  content: string;
  category?: string;
}

const defaultPolicies: PolicyItem[] = [
  {
    id: 'pol-1',
    title: 'Return & Exchange Policy',
    content: 'Customers can return or exchange eligible items within 14 days of delivery. Products must be in original condition with intact tags and packaging.',
    category: 'Orders & Fulfillment'
  },
  {
    id: 'pol-2',
    title: 'Shipping & Cash on Delivery (COD)',
    content: 'Standard delivery takes 1-3 business days across Cairo and Giza (50 EGP), and 2-4 days for other governorates (70 EGP). Cash on delivery is supported for all orders.',
    category: 'Shipping'
  },
  {
    id: 'pol-3',
    title: 'Appointment Booking & Cancellation',
    content: 'Appointments may be rescheduled or cancelled free of charge up to 2 hours before the scheduled time slot. Reminders are sent automatically via WhatsApp.',
    category: 'Scheduling'
  }
];

export function Knowledge() {
  const { state, dispatch, showToast } = useStore();
  const { vertical, accentColor } = useVertical();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('FAQs');
  const [search, setSearch] = useState('');
  const [showAddFAQ, setShowAddFAQ] = useState(false);
  const [showAddPolicy, setShowAddPolicy] = useState(false);
  const [showAddSource, setShowAddSource] = useState(false);
  const [newFAQ, setNewFAQ] = useState({ question: '', answer: '', category: '' });
  const [newPolicy, setNewPolicy] = useState({ title: '', content: '', category: 'General' });
  const [newSource, setNewSource] = useState({ name: '', type: 'PDF' as const });
  const [policies, setPolicies] = useState<PolicyItem[]>(defaultPolicies);
  const [askQ, setAskQ] = useState('');
  const [askA, setAskA] = useState<{ answer: string; source: string } | null>(null);
  const [asking, setAsking] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api.getKnowledge('default', 'policy').then((rows: any) => {
      if (cancelled) return;
      if (Array.isArray(rows) && rows.length > 0) {
        const mapped = rows.map((r: any) => ({
          id: String(r.id),
          title: r.title || 'Untitled Policy',
          content: r.content || '',
          category: r.metadata?.category || 'General'
        }));
        setPolicies(mapped);
      }
    });
    return () => { cancelled = true; };
  }, []);

  const handleFile = async (file: File | undefined, kind: string) => {
    if (!file || uploading) return;
    if (file.size > 8 * 1024 * 1024) {
      showToast('File over 8MB — split it first', 'danger');
      return;
    }
    setUploading(true);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result).split(',').pop() || '');
        r.onerror = reject;
        r.readAsDataURL(file);
      });
      const res = await api.uploadKnowledge('default', { filename: file.name, mime: file.type, base64, kind });
      if (res?.success) {
        showToast(`Added ${res.items} knowledge ${res.items === 1 ? 'item' : 'items'} from ${file.name}`, 'success');
        dispatch({
          type: 'ADD_SOURCE',
          source: { id: `src${Date.now()}`, name: file.name, type: (file.name.split('.').pop()?.toUpperCase() as any) || 'PDF', inUse: true }
        });
      } else {
        showToast(res?.error || 'Upload saved locally', 'warning');
      }
    } catch {
      showToast('Could not read file', 'danger');
    }
    setUploading(false);
  };

  const handleAsk = async () => {
    if (!askQ.trim() || asking) return;
    setAsking(true);
    const res = await api.askKnowledge('default', askQ.trim());
    setAsking(false);
    if (res) {
      setAskA({ answer: res.answer, source: res.source });
    } else {
      showToast('Knowledge service unreachable — using local response', 'warning');
      setAskA({
        answer: 'Based on your store knowledge: Orders are shipped via courier across Egypt (1-3 days). Customers can cancel up to 2 hours before dispatch.',
        source: 'local-match'
      });
    }
  };

  const tabs = vertical === 'commerce'
    ? ['FAQs', 'Products', 'Policies']
    : ['FAQs', 'Services', 'Policies'];

  const filteredFAQs = state.faqs.filter(f =>
    f.vertical === vertical && (!search || f.question.toLowerCase().includes(search.toLowerCase()) || f.answer.toLowerCase().includes(search.toLowerCase()))
  );

  const filteredPolicies = policies.filter(p =>
    !search || p.title.toLowerCase().includes(search.toLowerCase()) || p.content.toLowerCase().includes(search.toLowerCase())
  );

  const filteredProducts = state.products.filter(p =>
    !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase())
  );

  const filteredServices = state.services.filter(s =>
    !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.description.toLowerCase().includes(search.toLowerCase())
  );

  const handleAddFAQ = () => {
    if (!newFAQ.question || !newFAQ.answer) return;
    dispatch({
      type: 'ADD_FAQ',
      faq: { id: `faq${Date.now()}`, ...newFAQ, category: newFAQ.category || 'General', vertical }
    });
    setShowAddFAQ(false);
    setNewFAQ({ question: '', answer: '', category: '' });
    showToast('FAQ added to knowledge base', 'success');
  };

  const handleAddPolicy = async () => {
    if (!newPolicy.title || !newPolicy.content) return;
    const item: PolicyItem = {
      id: `pol-${Date.now()}`,
      title: newPolicy.title,
      content: newPolicy.content,
      category: newPolicy.category || 'General'
    };
    setPolicies([item, ...policies]);
    await api.addKnowledge('default', {
      kind: 'policy',
      title: item.title,
      content: item.content,
      metadata: { category: item.category }
    });
    setShowAddPolicy(false);
    setNewPolicy({ title: '', content: '', category: 'General' });
    showToast('Policy added to knowledge base', 'success');
  };

  const handleDeletePolicy = async (id: string) => {
    setPolicies(policies.filter(p => p.id !== id));
    await api.deleteKnowledge(id);
    showToast('Policy deleted', 'warning');
  };

  const handleAddSource = () => {
    if (!newSource.name) return;
    dispatch({
      type: 'ADD_SOURCE',
      source: { id: `src${Date.now()}`, ...newSource, inUse: false }
    });
    setShowAddSource(false);
    setNewSource({ name: '', type: 'PDF' });
    showToast('Source added', 'success');
  };

  const sourceIcons: Record<string, React.ElementType> = { PDF: FileText, DOCX: FileText, Image, Text: FileText, URL: Link };

  const handleHeaderAction = () => {
    if (activeTab === 'FAQs') setShowAddFAQ(true);
    else if (activeTab === 'Policies') setShowAddPolicy(true);
    else if (activeTab === 'Products') navigate('/products');
    else if (activeTab === 'Services') navigate('/services');
  };

  const headerActionLabel = activeTab === 'FAQs'
    ? 'Add FAQ'
    : activeTab === 'Policies'
      ? 'Add Policy'
      : activeTab === 'Products'
        ? 'Manage Products'
        : 'Manage Services';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <PageHeader
        eyebrow="AI Knowledge"
        title="Knowledge Base"
        sub="FAQs, policies, and catalog sources your AI answers from."
        actions={
          <button
            onClick={handleHeaderAction}
            className="btn btn-primary"
            style={{ background: 'var(--signal-orange)', border: 'none', color: '#fff', height: 40, padding: '0 18px', borderRadius: 10, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
          >
            <Plus size={16} /> {headerActionLabel}
          </button>
        }
      />
      <div style={{ display: 'flex', gap: 24, minHeight: 'calc(100vh - 280px)' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} />
            <div style={{ display: 'flex', gap: 8 }}>
              <label className="btn btn-outline" style={{ cursor: uploading ? 'wait' : 'pointer', opacity: uploading ? 0.6 : 1 }}>
                {uploading ? 'Uploading…' : 'Upload file to AI'}
                <input
                  type="file" hidden accept=".txt,.md,.csv,.json,.pdf,.docx"
                  onChange={(e) => { handleFile(e.target.files?.[0], activeTab === 'FAQs' ? 'faq' : activeTab === 'Policies' ? 'policy' : 'note'); e.target.value = ''; }}
                />
              </label>
            </div>
          </div>

          <div style={{ position: 'relative', marginBottom: 8 }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-400)' }} />
            <input
              type="text"
              placeholder={`Search ${activeTab.toLowerCase()}...`}
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: 280, height: 36, padding: '0 10px 0 30px', borderRadius: 6, border: '1px solid var(--border)', fontSize: 13, background: 'var(--surface-1)', outline: 'none' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, overflow: 'auto' }}>
            {/* Ask the knowledge base (MicroMind analyst, local-match fallback) */}
            <Card style={{ padding: 16, borderColor: 'var(--signal-orange)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <Sparkles size={14} color="var(--signal-orange)" />
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--midnight-ink)' }}>Preview AI answer</span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  className="input" value={askQ} onChange={(e) => setAskQ(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
                  placeholder="Ask what a customer would ask (e.g. Do you ship to Alexandria?)..." style={{ flex: 1 }}
                />
                <button onClick={handleAsk} disabled={asking || !askQ.trim()} className="btn btn-primary" style={{ background: accentColor }}>
                  {asking ? 'Asking…' : 'Ask'}
                </button>
              </div>
              {askA && (
                <div style={{ marginTop: 10, fontSize: 13, color: 'var(--ink-600)', lineHeight: 1.5 }}>
                  {askA.answer}
                  <span style={{ display: 'inline-block', marginLeft: 8, padding: '2px 8px', borderRadius: 4, background: 'var(--surface-0)', fontSize: 11, fontWeight: 600, color: 'var(--ink-400)' }}>
                    via {askA.source === 'micromind' ? 'MicroMind AI' : askA.source === 'local-match' ? 'local match' : 'no answer'}
                  </span>
                </div>
              )}
            </Card>

            {/* TAB 1: FAQs */}
            {activeTab === 'FAQs' && (
              filteredFAQs.length === 0 ? (
                <Card>
                  <EmptyState
                    icon={<BookOpen size={24} color="var(--signal-orange)" />}
                    title="No FAQs found"
                    copy="Add FAQs so your AI can answer customers instantly, even while you sleep."
                    action={<button onClick={() => setShowAddFAQ(true)} style={{ background: 'var(--signal-orange)', border: 'none', color: '#fff', height: 40, padding: '0 18px', borderRadius: 10, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}><Plus size={16} /> Add FAQ</button>}
                  />
                </Card>
              ) : (
                filteredFAQs.map(faq => (
                  <Card key={faq.id} style={{ padding: 16 }}>
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
                        title="Delete FAQ"
                      >
                        <Trash2 size={14} color="var(--ink-400)" />
                      </button>
                    </div>
                  </Card>
                ))
              )
            )}

            {/* TAB 2: Policies */}
            {activeTab === 'Policies' && (
              filteredPolicies.length === 0 ? (
                <Card>
                  <EmptyState
                    icon={<Shield size={24} color="var(--signal-orange)" />}
                    title="No business policies found"
                    copy="Add return, cancellation, or warranty policies to train your AI assistant on store rules."
                    action={<button onClick={() => setShowAddPolicy(true)} style={{ background: 'var(--signal-orange)', border: 'none', color: '#fff', height: 40, padding: '0 18px', borderRadius: 10, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}><Plus size={16} /> Add Policy</button>}
                  />
                </Card>
              ) : (
                filteredPolicies.map(pol => (
                  <Card key={pol.id} style={{ padding: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <Shield size={16} color="var(--signal-orange)" />
                          <h4 style={{ fontSize: 14, fontWeight: 650, color: 'var(--ink-900)' }}>{pol.title}</h4>
                        </div>
                        <p style={{ fontSize: 13, color: 'var(--ink-600)', lineHeight: 1.5 }}>{pol.content}</p>
                        {pol.category && (
                          <span style={{
                            display: 'inline-block', marginTop: 8, padding: '2px 8px', borderRadius: 4,
                            background: 'var(--surface-0)', fontSize: 11, fontWeight: 600, color: 'var(--ink-400)'
                          }}>
                            {pol.category}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => handleDeletePolicy(pol.id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
                        title="Delete Policy"
                      >
                        <Trash2 size={14} color="var(--ink-400)" />
                      </button>
                    </div>
                  </Card>
                ))
              )
            )}

            {/* TAB 3: Products (in Commerce vertical) */}
            {activeTab === 'Products' && (
              filteredProducts.length === 0 ? (
                <Card>
                  <EmptyState
                    icon={<Package size={24} color="var(--signal-orange)" />}
                    title="No products indexed"
                    copy="Products created in the inventory are automatically available for AI answers."
                    action={<button onClick={() => navigate('/products')} style={{ background: 'var(--signal-orange)', border: 'none', color: '#fff', height: 40, padding: '0 18px', borderRadius: 10, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}><Plus size={16} /> Add Product</button>}
                  />
                </Card>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ padding: '8px 12px', background: 'var(--surface-0)', borderRadius: 6, fontSize: 12, color: 'var(--stone-gray)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Catalog items indexed into AI memory ({filteredProducts.length} items)</span>
                    <button onClick={() => navigate('/products')} className="btn btn-ghost btn-sm" style={{ gap: 4, fontSize: 11 }}>
                      Manage Inventory <ExternalLink size={12} />
                    </button>
                  </div>
                  {filteredProducts.map(prod => (
                    <Card key={prod.id} style={{ padding: 14 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <img src={prod.image} alt={prod.name} style={{ width: 36, height: 36, borderRadius: 6, objectFit: 'cover' }} />
                          <div>
                            <span style={{ fontSize: 13.5, fontWeight: 650, color: 'var(--midnight-ink)' }}>{prod.name}</span>
                            <span style={{ fontSize: 11, color: 'var(--stone-gray)', display: 'block' }}>SKU: {prod.sku} · {prod.category}</span>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{prod.price.toLocaleString()} EGP</span>
                          <span style={{ fontSize: 11, color: prod.stock > 0 ? '#0F8357' : 'var(--danger)', display: 'block' }}>{prod.stock > 0 ? `${prod.stock} in stock` : 'Out of stock'}</span>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )
            )}

            {/* TAB 3: Services (in Appointments vertical) */}
            {activeTab === 'Services' && (
              filteredServices.length === 0 ? (
                <Card>
                  <EmptyState
                    icon={<Scissors size={24} color="var(--signal-orange)" />}
                    title="No services indexed"
                    copy="Services created in the catalog are automatically available for AI bookings."
                    action={<button onClick={() => navigate('/services')} style={{ background: 'var(--signal-orange)', border: 'none', color: '#fff', height: 40, padding: '0 18px', borderRadius: 10, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}><Plus size={16} /> Add Service</button>}
                  />
                </Card>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ padding: '8px 12px', background: 'var(--surface-0)', borderRadius: 6, fontSize: 12, color: 'var(--stone-gray)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Service items indexed into AI memory ({filteredServices.length} services)</span>
                    <button onClick={() => navigate('/services')} className="btn btn-ghost btn-sm" style={{ gap: 4, fontSize: 11 }}>
                      Manage Services <ExternalLink size={12} />
                    </button>
                  </div>
                  {filteredServices.map(srv => (
                    <Card key={srv.id} style={{ padding: 14 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <span style={{ fontSize: 13.5, fontWeight: 650, color: 'var(--midnight-ink)' }}>{srv.name}</span>
                          <span style={{ fontSize: 11, color: 'var(--stone-gray)', display: 'block' }}>{srv.category} · {srv.duration} mins</span>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>From {srv.price.toLocaleString()} EGP</span>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )
            )}
          </div>
        </div>

        {/* Sources Rail */}
        <div style={{ width: 280, minWidth: 280 }} className="hide-below-900">
          <Card style={{ padding: 20, height: '100%' }}>
            <SectionTitle
              action={
                <button onClick={() => setShowAddSource(true)} style={{ background: 'none', border: 'none', cursor: 'pointer' }} title="Add Source">
                  <Plus size={16} color={accentColor} />
                </button>
              }
            >
              Knowledge Sources
            </SectionTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {state.sources.length === 0 ? (
                <div style={{ padding: '24px 12px', textAlign: 'center', color: 'var(--stone-gray)', fontSize: 12 }}>
                  <FileText size={24} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
                  <p style={{ fontWeight: 600, marginBottom: 4 }}>No sources linked yet</p>
                  <p style={{ fontSize: 11 }}>Upload PDFs, catalogs, or policy docs above to train the AI engine.</p>
                </div>
              ) : (
                state.sources.map(source => {
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
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: accentColor }} title="In use by AI" />
                      )}
                      <button
                        onClick={() => { dispatch({ type: 'DELETE_SOURCE', id: source.id }); showToast('Source deleted', 'warning'); }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
                        title="Delete source"
                      >
                        <Trash2 size={12} color="var(--ink-400)" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </Card>
        </div>

        {/* Modal: Add FAQ */}
        <Modal isOpen={showAddFAQ} onClose={() => setShowAddFAQ(false)} title="Add FAQ" size="sm">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <input className="input" placeholder="Question (e.g. What are delivery hours?)" value={newFAQ.question} onChange={e => setNewFAQ({ ...newFAQ, question: e.target.value })} />
            <textarea className="input" placeholder="Answer..." rows={3} value={newFAQ.answer} onChange={e => setNewFAQ({ ...newFAQ, answer: e.target.value })} />
            <input className="input" placeholder="Category (e.g. Shipping, Pricing, Returns)" value={newFAQ.category} onChange={e => setNewFAQ({ ...newFAQ, category: e.target.value })} />
            <button onClick={handleAddFAQ} className="btn btn-primary" style={{ width: '100%', background: accentColor }}>Add FAQ</button>
          </div>
        </Modal>

        {/* Modal: Add Policy */}
        <Modal isOpen={showAddPolicy} onClose={() => setShowAddPolicy(false)} title="Add Business Policy" size="sm">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <input className="input" placeholder="Policy Title (e.g. 14-Day Warranty & Return)" value={newPolicy.title} onChange={e => setNewPolicy({ ...newPolicy, title: e.target.value })} />
            <textarea className="input" placeholder="Policy details that AI must adhere to..." rows={4} value={newPolicy.content} onChange={e => setNewPolicy({ ...newPolicy, content: e.target.value })} />
            <input className="input" placeholder="Category (e.g. Return, Warranty, Cancellation)" value={newPolicy.category} onChange={e => setNewPolicy({ ...newPolicy, category: e.target.value })} />
            <button onClick={handleAddPolicy} className="btn btn-primary" style={{ width: '100%', background: accentColor }}>Add Policy</button>
          </div>
        </Modal>

        {/* Modal: Add Source */}
        <Modal isOpen={showAddSource} onClose={() => setShowAddSource(false)} title="Add Knowledge Source" size="sm">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <input className="input" placeholder="Source name (e.g. 2026 Price List PDF)" value={newSource.name} onChange={e => setNewSource({ ...newSource, name: e.target.value })} />
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
    </div>
  );
}

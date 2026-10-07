import React, { useState, useEffect } from 'react';
import {
  Calendar, Clock, Plus, Trash2, CheckCircle2, Instagram, Facebook, MessageCircle, Send, Image, Sparkles
} from 'lucide-react';
import { PageHeader, Card, EmptyState } from '../components/dash/kit';
import { api } from '../services/api';

interface ScheduledPost {
  id: string;
  title: string;
  contentText: string;
  mediaUrl?: string;
  platforms: string[];
  scheduledTime: string;
  status: 'scheduled' | 'published' | 'failed';
  resultMsg?: string;
}

// Live-data mapping: backend rows are snake_case; missing backend (offline)
// yields the empty state, never mock rows.
function mapRow(r: any): ScheduledPost {
  return {
    id: String(r.id),
    title: r.title || 'Untitled',
    contentText: r.content_text || '',
    mediaUrl: r.media_url || undefined,
    platforms: Array.isArray(r.platforms) ? r.platforms : [],
    scheduledTime: typeof r.scheduled_time === 'string' ? r.scheduled_time.slice(0, 16) : String(r.scheduled_time || ''),
    status: r.status === 'published' ? 'published' : r.status === 'failed' ? 'failed' : 'scheduled',
  };
}

// Month-grid calendar over REAL scheduled posts (backend rows only).
// Days without posts render empty — never invented entries.
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function dayKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function MonthGrid({ posts, cursor, onPrev, onNext, onToday }: {
  posts: ScheduledPost[];
  cursor: { year: number; month: number };
  onPrev: () => void; onNext: () => void; onToday: () => void;
}) {
  const first = new Date(cursor.year, cursor.month, 1);
  const cells: Date[] = [];
  for (let i = 0; i < 42; i++) cells.push(new Date(cursor.year, cursor.month, 1 - first.getDay() + i));
  const byDay = new Map<string, ScheduledPost[]>();
  for (const p of posts) {
    const key = String(p.scheduledTime || '').slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) continue;
    if (!byDay.has(key)) byDay.set(key, []);
    byDay.get(key)!.push(p);
  }
  const today = dayKey(new Date());
  const dot = (s: string) => s === 'published' ? '#0F8357' : s === 'failed' ? 'var(--danger)' : 'var(--signal-orange)';
  return (
    <Card style={{ padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <button className="btn btn-outline btn-sm" onClick={onPrev} aria-label="Previous month">‹</button>
        <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--midnight-ink)', minWidth: 140, textAlign: 'center' }}>
          {first.toLocaleDateString([], { month: 'long', year: 'numeric' })}
        </span>
        <button className="btn btn-outline btn-sm" onClick={onNext} aria-label="Next month">›</button>
        <button className="btn btn-ghost btn-sm" onClick={onToday} style={{ marginLeft: 'auto', color: 'var(--signal-orange)' }}>Today</button>
      </div>
      <div style={{ overflowX: 'auto' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(72px, 1fr))', gap: 6, minWidth: 560 }}>
        {WEEKDAYS.map((d) => (
          <div key={d} style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-400)', textAlign: 'center', padding: '4px 0' }}>{d}</div>
        ))}
        {cells.map((d, i) => {
          const key = dayKey(d);
          const inMonth = d.getMonth() === cursor.month;
          const dayPosts = byDay.get(key) || [];
          return (
            <div
              key={i}
              style={{
                minHeight: 84, borderRadius: 8, padding: 6,
                background: key === today ? 'var(--signal-orange-subtle)' : 'var(--surface-0)',
                border: key === today ? '1px solid var(--signal-orange)' : '1px solid var(--border)',
                opacity: inMonth ? 1 : 0.45, overflow: 'hidden',
              }}
            >
              <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--ink-600)', marginBottom: 4 }}>{d.getDate()}</div>
              {dayPosts.slice(0, 3).map((p) => (
                <div
                  key={p.id} title={`${p.title} — ${p.status}`}
                  style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10.5, fontWeight: 600, color: 'var(--midnight-ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: 2 }}
                >
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: dot(p.status), flexShrink: 0 }} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.title}</span>
                </div>
              ))}
              {dayPosts.length > 3 && (
                <div style={{ fontSize: 10.5, color: 'var(--ink-400)' }}>+{dayPosts.length - 3} more</div>
              )}
            </div>
          );
        })}
      </div>
      </div>
    </Card>
  );
}

export function Scheduler() {
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [publishBusy, setPublishBusy] = useState<string | null>(null);
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  useEffect(() => {
    let cancelled = false;
    api.getSchedules().then((rows: any) => {
      if (cancelled) return;
      setPosts(Array.isArray(rows) ? rows.map(mapRow) : []);
    });
    return () => { cancelled = true; };
  }, []);

  const handlePublish = async (id: string) => {
    setPublishBusy(id);
    const res = await api.publishSchedule('default', id);
    setPublishBusy(null);
    if (res && (res.status === 'published' || res.status === 'failed')) {
      setPosts((ps) => ps.map((p) => {
        if (p.id !== id) return p;
        const fails = Object.entries(res.results || {})
          .filter(([, v]: any) => !v?.ok)
          .map(([k, v]: any) => `${k}: ${v?.error || 'failed'}`);
        return {
          ...p,
          status: res.status,
          resultMsg: res.status === 'published'
            ? (fails.length ? `Live with warnings — ${fails.join('; ')}` : 'Live on all target platforms.')
            : `Failed — ${fails.join('; ') || 'see backend logs'}`,
        };
      }));
    }
  };

  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [contentText, setContentText] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['instagram', 'facebook']);

  const togglePlatform = (p: string) => {
    if (selectedPlatforms.includes(p)) {
      if (selectedPlatforms.length > 1) {
        setSelectedPlatforms(selectedPlatforms.filter(item => item !== p));
      }
    } else {
      setSelectedPlatforms([...selectedPlatforms, p]);
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !contentText || !scheduledTime) return;

    const saved = await api.addSchedule({
      title, content_text: contentText,
      media_url: mediaUrl || null, platforms: selectedPlatforms,
      scheduled_time: scheduledTime,
    });
    if (saved?.id) {
      setPosts([mapRow(saved), ...posts]);
    }
    setShowModal(false);
    setTitle('');
    setContentText('');
    setMediaUrl('');
    setScheduledTime('');
  };

  const handleDeletePost = async (id: string) => {
    setPosts(posts.filter(p => p.id !== id));
    await api.deleteSchedule(id);
  };

  const platformIcons: Record<string, { icon: React.ElementType; color: string; name: string }> = {
    instagram: { icon: Instagram, color: '#E4405F', name: 'Instagram' },
    facebook: { icon: Facebook, color: '#1877F2', name: 'Facebook' },
    whatsapp: { icon: MessageCircle, color: '#25D366', name: 'WhatsApp' }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <PageHeader
        eyebrow="Schedule"
        title="Scheduled Content & Social Broadcasts"
        sub="Plan, schedule, and auto-broadcast marketing updates simultaneously across Instagram, WhatsApp, and Facebook."
        actions={
          <button
            onClick={() => setShowModal(true)}
            className="btn btn-primary"
            style={{ background: 'var(--signal-orange)', border: 'none', color: '#fff', height: 42, padding: '0 20px', borderRadius: 10, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
          >
            <Plus size={18} /> Schedule New Content
          </button>
        }
      />

      {/* Post Grid */}
      {/* Honest roadmap strip: drafts, approval queue, and campaign grouping
          have no backend model yet — shown as unavailable, never faked. */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', background: 'var(--surface-1)', borderRadius: 8, padding: 3, border: '1px solid var(--border)' }}>
          {(['list', 'calendar'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              style={{
                padding: '4px 12px', borderRadius: 6, border: 'none',
                background: view === v ? 'var(--signal-orange)' : 'transparent',
                color: view === v ? 'white' : 'var(--ink-600)',
                fontSize: 12, fontWeight: 650, cursor: 'pointer', textTransform: 'capitalize',
              }}
            >
              {v}
            </button>
          ))}
        </div>
        {['Drafts', 'Approval queue', 'Campaigns'].map((label) => (
          <span
            key={label}
            title="Not available yet — no backend support"
            style={{
              fontSize: 11.5, fontWeight: 700, color: 'var(--ink-400)',
              background: 'var(--surface-1)', border: '1px dashed var(--border)',
              borderRadius: 20, padding: '5px 12px', cursor: 'not-allowed',
            }}
          >
            {label} · coming soon
          </span>
        ))}
      </div>
      {view === 'calendar' ? (
        <MonthGrid
          posts={posts}
          cursor={cursor}
          onPrev={() => setCursor((c) => (c.month === 0 ? { year: c.year - 1, month: 11 } : { year: c.year, month: c.month - 1 }))}
          onNext={() => setCursor((c) => (c.month === 11 ? { year: c.year + 1, month: 0 } : { year: c.year, month: c.month + 1 }))}
          onToday={() => { const d = new Date(); setCursor({ year: d.getFullYear(), month: d.getMonth() }); }}
        />
      ) : (
      posts.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Calendar size={24} color="var(--signal-orange)" />}
            title="Nothing scheduled"
            copy="Plan your next broadcast and it will appear here across every channel."
            action={<button onClick={() => setShowModal(true)} style={{ background: 'var(--signal-orange)', border: 'none', color: '#fff', height: 40, padding: '0 18px', borderRadius: 10, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}><Plus size={16} /> Schedule New Content</button>}
          />
        </Card>
      ) : (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
        {posts.map(post => (
          <Card key={post.id} style={{ padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderRadius: 14 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <span className="orbit-badge" style={{
                  fontSize: 11,
                  background: post.status === 'published' ? 'rgba(82, 216, 164, 0.15)' : post.status === 'failed' ? 'var(--danger-bg)' : 'var(--signal-orange-subtle)',
                  color: post.status === 'published' ? '#0F8357' : post.status === 'failed' ? 'var(--danger)' : 'var(--signal-orange)',
                  borderColor: post.status === 'published' ? 'rgba(82, 216, 164, 0.3)' : post.status === 'failed' ? 'var(--danger)' : 'rgba(255, 90, 54, 0.2)'
                }}>
                  {post.status === 'published' ? '● Published' : post.status === 'failed' ? '● Failed' : '⏱️ Scheduled'}
                </span>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {post.platforms.map(p => {
                    const info = platformIcons[p];
                    if (!info) return null;
                    const Icon = info.icon;
                    return (
                      <div key={p} style={{ width: 26, height: 26, borderRadius: 6, background: 'var(--surface-0)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Icon size={14} color={info.color} />
                      </div>
                    );
                  })}
                </div>
              </div>

              <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--midnight-ink)', marginBottom: 8 }}>
                {post.title}
              </h3>

              <p style={{ fontSize: 13, color: 'var(--ink-600)', lineHeight: 1.5, background: 'var(--surface-0)', padding: 12, borderRadius: 8, border: '1px solid var(--border)', marginBottom: 12 }}>
                {post.contentText}
              </p>

              {post.mediaUrl && (
                <div style={{ marginBottom: 12, borderRadius: 8, overflow: 'hidden', height: 140, border: '1px solid var(--border)' }}>
                  <img src={post.mediaUrl} alt={post.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: 12, marginTop: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--stone-gray)', fontWeight: 600 }}>
                <Clock size={14} color="var(--signal-orange)" />
                <span>{post.scheduledTime}</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {post.status !== 'published' && (
                  <button
                    onClick={() => handlePublish(post.id)}
                    disabled={publishBusy === post.id}
                    className="btn btn-primary btn-sm"
                    style={{ height: 30, padding: '0 14px', fontSize: 12, background: 'var(--signal-orange)', opacity: publishBusy === post.id ? 0.7 : 1 }}
                  >
                    <Send size={13} /> {publishBusy === post.id ? 'Publishing…' : 'Publish now'}
                  </button>
                )}
                <button
                  onClick={() => handleDeletePost(post.id)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
                >
                  <Trash2 size={16} color="var(--burnt-coral)" />
                </button>
              </div>
            </div>
            {post.resultMsg && (
              <p style={{ fontSize: 12, color: post.status === 'published' ? '#0F8357' : 'var(--danger)', marginTop: 8, marginBottom: 0 }}>
                {post.resultMsg}
              </p>
            )}
          </Card>
        ))}
      </div>
      ))}

      {/* Schedule Modal */}
      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
        }}>
          <div className="card animate-slide-up" style={{ width: '100%', maxWidth: 520, padding: 28, borderRadius: 16, background: 'white' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: 8, background: 'var(--signal-orange)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                  <Calendar size={18} />
                </div>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--midnight-ink)' }}>Schedule Cross-Platform Post</h2>
              </div>
              <button onClick={() => setShowModal(false)} className="btn btn-ghost btn-sm">✕</button>
            </div>

            <form onSubmit={handleCreatePost} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--midnight-ink)', marginBottom: 6, display: 'block' }}>Campaign / Title</label>
                <input className="input" placeholder="e.g. Weekend Special Offer" value={title} onChange={e => setTitle(e.target.value)} required />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--midnight-ink)', marginBottom: 6, display: 'block' }}>Target Channels</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {Object.entries(platformIcons).map(([key, info]) => {
                    const active = selectedPlatforms.includes(key);
                    const Icon = info.icon;
                    return (
                      <button
                        type="button"
                        key={key}
                        onClick={() => togglePlatform(key)}
                        className="btn"
                        style={{
                          height: 36, padding: '0 14px', borderRadius: 20,
                          background: active ? 'var(--signal-orange-subtle)' : 'var(--surface-0)',
                          borderColor: active ? 'var(--signal-orange)' : 'var(--border)',
                          color: active ? 'var(--signal-orange)' : 'var(--ink-600)',
                          fontWeight: 700
                        }}
                      >
                        <Icon size={16} color={info.color} /> {info.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--midnight-ink)', marginBottom: 6, display: 'block' }}>Message / Post Caption</label>
                <textarea className="input" rows={4} placeholder="Write your broadcast post message here..." value={contentText} onChange={e => setContentText(e.target.value)} required />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--midnight-ink)', marginBottom: 6, display: 'block' }}>Media Image URL (Optional)</label>
                <input className="input" placeholder="https://images.unsplash.com/..." value={mediaUrl} onChange={e => setMediaUrl(e.target.value)} />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--midnight-ink)', marginBottom: 6, display: 'block' }}>Schedule Date & Time</label>
                <input className="input" type="datetime-local" value={scheduledTime} onChange={e => setScheduledTime(e.target.value)} required />
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-outline" style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, background: 'var(--signal-orange)' }}>Schedule Broadcast</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

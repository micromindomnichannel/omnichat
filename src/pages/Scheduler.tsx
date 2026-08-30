import React, { useState } from 'react';
import {
  Calendar, Clock, Plus, Trash2, CheckCircle2, Instagram, Facebook, MessageCircle, Music, Send, Image, Sparkles
} from 'lucide-react';
import { OrbitLogo } from '../components/shared/OrbitLogo';

interface ScheduledPost {
  id: string;
  title: string;
  contentText: string;
  mediaUrl?: string;
  platforms: string[];
  scheduledTime: string;
  status: 'scheduled' | 'published' | 'failed';
}

export function Scheduler() {
  const [posts, setPosts] = useState<ScheduledPost[]>([
    {
      id: 'sch_1',
      title: 'Summer Collection Launch Promo',
      contentText: '✨ Summer vibes are here! Explore our new Black Leather Bag & Summer Silk Dress collection with 15% OFF for 48 hours only! Link in bio to order on WhatsApp. 🛍️',
      mediaUrl: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=500&auto=format&fit=crop',
      platforms: ['instagram', 'facebook', 'whatsapp'],
      scheduledTime: '2026-08-31 14:00',
      status: 'scheduled'
    },
    {
      id: 'sch_2',
      title: 'Clinic Free Dental Consultation Announcement',
      contentText: '🦷 Book your Dental Cleaning session this Thursday and get a FREE checkup consultation! Slots are limited. Reply to this message to reserve your slot now.',
      platforms: ['whatsapp', 'facebook'],
      scheduledTime: '2026-09-01 10:30',
      status: 'scheduled'
    },
    {
      id: 'sch_3',
      title: 'TikTok Flash Deal Video Teaser',
      contentText: '🔥 FLASH SALE: 20% OFF on all Leather Handbags! Watch how we style them. Order directly via TikTok DM.',
      platforms: ['tiktok', 'instagram'],
      scheduledTime: '2026-08-29 18:00',
      status: 'published'
    }
  ]);

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

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !contentText || !scheduledTime) return;

    const newPost: ScheduledPost = {
      id: `sch_${Date.now()}`,
      title,
      contentText,
      mediaUrl: mediaUrl || undefined,
      platforms: selectedPlatforms,
      scheduledTime,
      status: 'scheduled'
    };

    setPosts([newPost, ...posts]);
    setShowModal(false);
    setTitle('');
    setContentText('');
    setMediaUrl('');
    setScheduledTime('');
  };

  const handleDeletePost = (id: string) => {
    setPosts(posts.filter(p => p.id !== id));
  };

  const platformIcons: Record<string, { icon: React.ElementType; color: string; name: string }> = {
    instagram: { icon: Instagram, color: '#E4405F', name: 'Instagram' },
    facebook: { icon: Facebook, color: '#1877F2', name: 'Facebook' },
    whatsapp: { icon: MessageCircle, color: '#25D366', name: 'WhatsApp' },
    tiktok: { icon: Music, color: '#171717', name: 'TikTok' }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header Row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div className="orbit-badge" style={{ marginBottom: 6 }}>
            <Calendar size={13} color="var(--signal-orange)" />
            <span>Cross-Platform Content Scheduler</span>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--midnight-ink)' }}>
            Scheduled Content & Social Broadcasts
          </h1>
          <p style={{ fontSize: 13, color: 'var(--stone-gray)', marginTop: 2 }}>
            Plan, schedule, and auto-broadcast marketing updates simultaneously across Instagram, WhatsApp, Facebook & TikTok.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="btn btn-primary"
          style={{ background: 'var(--signal-orange)', height: 42, padding: '0 20px' }}
        >
          <Plus size={18} /> Schedule New Content
        </button>
      </div>

      {/* Post Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
        {posts.map(post => (
          <div key={post.id} className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderRadius: 14 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <span className="orbit-badge" style={{
                  fontSize: 11,
                  background: post.status === 'published' ? 'rgba(82, 216, 164, 0.15)' : 'var(--signal-orange-subtle)',
                  color: post.status === 'published' ? '#0F8357' : 'var(--signal-orange)',
                  borderColor: post.status === 'published' ? 'rgba(82, 216, 164, 0.3)' : 'rgba(255, 90, 54, 0.2)'
                }}>
                  {post.status === 'published' ? '● Published' : '⏱️ Scheduled'}
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

              <button
                onClick={() => handleDeletePost(post.id)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
              >
                <Trash2 size={16} color="var(--burnt-coral)" />
              </button>
            </div>
          </div>
        ))}
      </div>

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

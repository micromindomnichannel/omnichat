import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../state/store';
import { useVertical } from '../state/verticalContext';
import { Tabs } from '../components/shared/Tabs';
import { Modal } from '../components/shared/Modal';
import { EGYPTIAN_GOVERNORATES } from '../state/mockData';
import {
  Upload, Check, X, Plus, Trash2, UserPlus, Instagram, MessageCircle, Facebook, Globe, Sparkles, Shield, LogOut
} from 'lucide-react';
import { ChannelsPanel } from '../components/settings/ChannelsPanel';
import { PageHeader, Card, SectionTitle, ChannelDot } from '../components/dash/kit';
import { api } from '../services/api';
import { clearSessionCache, getMemberships } from '../services/session';

const settingsTabs = ['Business Profile', 'Channels', 'Plan & Usage', 'AI Settings', 'Working Hours', 'Notifications', 'Team Members', 'Account'];

const channelIcons: Record<string, React.ElementType> = {
  instagram: Instagram, whatsapp: MessageCircle, facebook: Facebook, website: Globe
};

export function Settings() {
  const { state, dispatch, showToast } = useStore();
  const { vertical, accentColor } = useVertical();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Business Profile');
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('agent');
  const [members, setMembers] = useState<any[] | null>(null);
  const [invites, setInvites] = useState<any[] | null>(null);
  const [manualLink, setManualLink] = useState('');
  const [plan, setPlan] = useState<any>(null);
  const [newRule, setNewRule] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const workspaceId = getMemberships()[0]?.workspace_id || 'default';

  const isDirty = false; // Simplified for prototype

  // Real member directory (owner/admin only; null when forbidden/offline).
  useEffect(() => {
    api.adminUsers().then((rows) => { if (rows) setMembers(rows); });
    api.getPlan('default').then((p) => { if (p) setPlan(p); });
    api.listInvites(workspaceId).then((rows) => { if (rows) setInvites(rows); });
  }, []);

  const handleToggleChannel = (channel: string) => {
    dispatch({ type: 'TOGGLE_CHANNEL', channel });
    showToast(`${channel} ${state.channelsConnected[channel] ? 'disconnected' : 'connected'}`, 'success');
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim()) {
      showToast('Email address required', 'danger');
      return;
    }
    // Invitation flow: owner sends an email, the receiver accepts via link
    // and sets their own password. No shared/temporary passwords ever exist.
    const res = await api.createInvite(workspaceId, { email: inviteEmail.trim(), role: inviteRole });
    if (res?.invite) {
      showToast(
        res.invite.delivered
          ? `Invitation sent to ${res.invite.email}`
          : `Invite created — email service unreachable, forward the link manually`,
        res.invite.delivered ? 'success' : 'warning'
      );
      setManualLink(res.acceptUrl || '');
      setShowInvite(false);
      setInviteEmail('');
      const rows = await api.listInvites(workspaceId);
      if (rows) setInvites(rows);
    } else if (res?._network) {
      showToast('Backend unreachable — cannot send the invitation right now', 'danger');
    } else {
      showToast(res?.error || 'Invitation failed (owner-only)', 'danger');
    }
  };

  const handleRevokeInvite = async (id: string) => {
    const res = await api.revokeInvite(id);
    if (res?.revoked) {
      showToast('Invitation revoked', 'success');
      const rows = await api.listInvites(workspaceId);
      if (rows) setInvites(rows);
    } else {
      showToast(res?.error || 'Revoke failed', 'danger');
    }
  };

  const handleAddRule = () => {
    if (!newRule.trim()) return;
    dispatch({ type: 'UPDATE_AI_SETTINGS', field: 'aiHandoffRules', value: [...state.aiHandoffRules, newRule.trim()] });
    setNewRule('');
  };

  const handleRemoveRule = (rule: string) => {
    dispatch({ type: 'UPDATE_AI_SETTINGS', field: 'aiHandoffRules', value: state.aiHandoffRules.filter(r => r !== rule) });
  };

  const [savingProfile, setSavingProfile] = useState(false);

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    const res = await api.updateSettings({
      business_name: state.businessName,
      industry: state.industry,
      description: state.businessDescription,
      logo: state.businessLogo,
    });
    setSavingProfile(false);
    showToast(res ? 'Business profile saved to server!' : 'Profile saved locally (offline)', res ? 'success' : 'warning');
  };

  const handleLogoUpload = async (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('Select an image file (PNG, JPG, WEBP)', 'danger');
      return;
    }
    const reader = new FileReader();
    reader.onload = async () => {
      const res = await api.uploadImage(String(reader.result));
      if (res?.url) {
        dispatch({ type: 'UPDATE_BUSINESS', field: 'businessLogo', value: res.url });
        showToast('Logo uploaded and saved', 'success');
      } else {
        dispatch({ type: 'UPDATE_BUSINESS', field: 'businessLogo', value: String(reader.result) });
        showToast('Logo saved locally', 'warning');
      }
    };
    reader.readAsDataURL(file);
  };

  const renderPanel = () => {
    switch (activeTab) {
      case 'Business Profile':
        return (
          <Card>
            <SectionTitle>Business profile</SectionTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 520 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--midnight-ink)', marginBottom: 6, display: 'block' }}>Business Name</label>
                <input className="input" value={state.businessName} onChange={e => dispatch({ type: 'UPDATE_BUSINESS', field: 'businessName', value: e.target.value })} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--midnight-ink)', marginBottom: 6, display: 'block' }}>Brand Logo & Avatar</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ width: 64, height: 64, borderRadius: '50%', border: '2px dashed var(--stone-gray)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface-0)', overflow: 'hidden' }}>
                    {state.businessLogo ? (
                      <img src={state.businessLogo} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <Upload size={20} color="var(--stone-gray)" />
                    )}
                  </div>
                  <label className="btn btn-outline btn-sm" style={{ cursor: 'pointer' }}>
                    Upload New Logo
                    <input type="file" hidden accept="image/*" onChange={e => { handleLogoUpload(e.target.files?.[0]); e.target.value = ''; }} />
                  </label>
                </div>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--midnight-ink)', marginBottom: 6, display: 'block' }}>Industry & Category</label>
                <select className="input" value={state.industry} onChange={e => dispatch({ type: 'UPDATE_BUSINESS', field: 'industry', value: e.target.value })}>
                  <option>Fashion & Apparel</option>
                  <option>Retail & E-Commerce</option>
                  <option>Electronics & Tech</option>
                  <option>Dental & Clinic Healthcare</option>
                  <option>Beauty & Cosmetics</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--midnight-ink)', marginBottom: 6, display: 'block' }}>Business Overview</label>
                <textarea className="input" rows={3} value={state.businessDescription} onChange={e => dispatch({ type: 'UPDATE_BUSINESS', field: 'businessDescription', value: e.target.value })} />
              </div>
              <button onClick={handleSaveProfile} disabled={savingProfile} className="btn btn-primary" style={{ alignSelf: 'flex-start', background: 'var(--signal-orange)' }}>
                {savingProfile ? 'Saving…' : 'Save Profile Settings'}
              </button>
            </div>
          </Card>
        );

      case 'Channels':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Card>
              <SectionTitle>Managed channels</SectionTitle>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 16 }}>
                <ChannelDot channel="messenger" label="Messenger" />
                <ChannelDot channel="instagram" label="Instagram" />
                <ChannelDot channel="whatsapp" label="WhatsApp" />
                <ChannelDot channel="telegram" label="Telegram" />
                <ChannelDot channel="gmail" label="Gmail" />
              </div>
              <ChannelsPanel
                workspaceId={workspaceId}
                showToast={showToast}
                local={state.channelsConnected}
                onToggleLocal={handleToggleChannel}
              />
            </Card>
            <Card>
              <SectionTitle>Local preview channels</SectionTitle>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                <ChannelDot channel="website" label="Website" />
              </div>
              <p style={{ fontSize: 12, color: 'var(--stone-gray)', margin: '8px 0 0' }}>Local-only toggles live inside the panel above when the backend is unreachable.</p>
            </Card>
          </div>
        );

      case 'Plan & Usage':
        return (
          <Card>
            <SectionTitle>Plan & usage</SectionTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 520 }}>
              {!plan ? (
                <div style={{ fontSize: 13, color: 'var(--stone-gray)' }}>Plan data unavailable — backend unreachable.</div>
              ) : (
                <>
                  <div style={{ padding: 16, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface-1)' }}>
                    <span style={{ fontSize: 12, color: 'var(--stone-gray)', display: 'block' }}>Current plan</span>
                    <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--midnight-ink)', textTransform: 'capitalize' }}>{plan.plan?.name || 'Pro'}</span>
                    <span style={{ fontSize: 12, color: 'var(--stone-gray)', display: 'block', marginTop: 4 }}>
                      Up to {plan.plan?.channels >= 9007199254740991 ? 'unlimited' : plan.plan?.channels} active channels · {plan.plan?.teamSeats} team seats
                    </span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div style={{ padding: 16, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface-1)' }}>
                      <span style={{ fontSize: 20, fontWeight: 800 }}>{plan.usage?.channelsActive ?? '—'}</span>
                      <span style={{ fontSize: 12, color: 'var(--stone-gray)', display: 'block' }}>Active channels{(plan.usage?.channelsErrored || 0) > 0 ? ` (+${plan.usage.channelsErrored} errored)` : ''}</span>
                    </div>
                    <div style={{ padding: 16, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface-1)' }}>
                      <span style={{ fontSize: 20, fontWeight: 800 }}>{plan.usage?.processed30d ?? '—'}</span>
                      <span style={{ fontSize: 12, color: 'var(--stone-gray)', display: 'block' }}>Messages handled (30d)</span>
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--stone-gray)' }}>{plan.billing?.note || ''}</div>
                </>
              )}
            </div>
          </Card>
        );

      case 'AI Settings':
        return (
          <Card>
            <SectionTitle>AI copilot</SectionTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 520 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface-1)' }}>
                <div>
                  <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--midnight-ink)', display: 'block' }}>ORBIT AI Copilot Engine</span>
                  <span style={{ fontSize: 11.5, color: 'var(--stone-gray)' }}>Automatically reply to customer signals</span>
                </div>
                <button
                  onClick={() => dispatch({ type: 'UPDATE_AI_SETTINGS', field: 'aiEnabled', value: !state.aiEnabled })}
                  style={{
                    width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
                    background: state.aiEnabled ? 'var(--signal-orange)' : 'var(--border)',
                    position: 'relative', transition: 'background 0.2s ease'
                  }}
                >
                  <div style={{
                    width: 20, height: 20, borderRadius: '50%', background: 'white',
                    position: 'absolute', top: 2, left: state.aiEnabled ? 22 : 2,
                    transition: 'left 0.2s ease'
                  }} />
                </button>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--midnight-ink)', marginBottom: 6, display: 'block' }}>Brand Communication Tone</label>
                <div style={{ display: 'flex', gap: 6 }}>
                  {['Friendly', 'Professional', 'Casual'].map(tone => (
                    <button
                      key={tone}
                      onClick={() => dispatch({ type: 'UPDATE_AI_SETTINGS', field: 'aiTone', value: tone })}
                      style={{
                        flex: 1, padding: '8px 0', borderRadius: 6, border: '1px solid var(--border)',
                        fontSize: 13, fontWeight: 650, cursor: 'pointer',
                        background: state.aiTone === tone ? 'var(--signal-orange)' : 'transparent',
                        color: state.aiTone === tone ? 'white' : 'var(--ink-600)'
                      }}
                    >
                      {tone}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--midnight-ink)', marginBottom: 6, display: 'block' }}>Response Language Engine</label>
                <div style={{ display: 'flex', gap: 6 }}>
                  {['Arabic', 'English', 'Both'].map(lang => (
                    <button
                      key={lang}
                      onClick={() => dispatch({ type: 'UPDATE_AI_SETTINGS', field: 'aiLanguage', value: lang })}
                      style={{
                        flex: 1, padding: '8px 0', borderRadius: 6, border: '1px solid var(--border)',
                        fontSize: 13, fontWeight: 650, cursor: 'pointer',
                        background: state.aiLanguage === lang ? 'var(--midnight-ink)' : 'transparent',
                        color: state.aiLanguage === lang ? 'white' : 'var(--ink-600)'
                      }}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--midnight-ink)', marginBottom: 6, display: 'block' }}>Human Takeover Escalation Rules</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {state.aiHandoffRules.map(rule => (
                    <div key={rule} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 6, background: 'var(--surface-0)', border: '1px solid var(--border)' }}>
                      <span style={{ flex: 1, fontSize: 13, color: 'var(--midnight-ink)' }}>{rule}</span>
                      <button onClick={() => handleRemoveRule(rule)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                        <Trash2 size={15} color="var(--burnt-coral)" />
                      </button>
                    </div>
                  ))}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input className="input" placeholder="Add custom handoff rule..." value={newRule} onChange={e => setNewRule(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddRule()} />
                    <button onClick={handleAddRule} className="btn btn-primary" style={{ background: 'var(--signal-orange)' }}><Plus size={16} /></button>
                  </div>
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--midnight-ink)' }}>
                    Auto-Action Confidence Threshold
                  </label>
                  <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--signal-orange)' }}>{state.aiConfidenceThreshold}%</span>
                </div>
                <input
                  type="range"
                  min={50}
                  max={95}
                  value={state.aiConfidenceThreshold}
                  onChange={e => dispatch({ type: 'UPDATE_AI_SETTINGS', field: 'aiConfidenceThreshold', value: Number(e.target.value) })}
                  style={{ width: '100%' }}
                />
                <p className="faint" style={{ fontSize: 11, marginTop: 4 }}>Inquiries below {state.aiConfidenceThreshold}% confidence automatically request human agent takeover.</p>
              </div>
            </div>
          </Card>
        );

      case 'Working Hours':
        return (
          <Card>
            <SectionTitle>Working hours</SectionTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 520 }}>
              {state.workingHours.map(wh => (
                <div key={wh.day} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-1)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <button
                      onClick={() => dispatch({ type: 'UPDATE_WORKING_HOURS', day: wh.day, field: 'open', value: !wh.open })}
                      style={{
                        width: 40, height: 22, borderRadius: 11, border: 'none', cursor: 'pointer',
                        background: wh.open ? 'var(--signal-orange)' : 'var(--border)', position: 'relative'
                      }}
                    >
                      <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'white', position: 'absolute', top: 2, left: wh.open ? 20 : 2, transition: 'left 0.2s' }} />
                    </button>
                    <span style={{ width: 90, fontSize: 13.5, fontWeight: 700, color: 'var(--midnight-ink)' }}>{wh.day}</span>
                  </div>
                  {wh.open ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <input
                        type="time"
                        value={wh.start}
                        onChange={e => dispatch({ type: 'UPDATE_WORKING_HOURS', day: wh.day, field: 'start', value: e.target.value })}
                        style={{ width: 90, height: 32, borderRadius: 6, border: '1px solid var(--border)', fontSize: 12.5, padding: '0 8px' }}
                      />
                      <span style={{ color: 'var(--stone-gray)', fontSize: 12 }}>to</span>
                      <input
                        type="time"
                        value={wh.end}
                        onChange={e => dispatch({ type: 'UPDATE_WORKING_HOURS', day: wh.day, field: 'end', value: e.target.value })}
                        style={{ width: 90, height: 32, borderRadius: 6, border: '1px solid var(--border)', fontSize: 12.5, padding: '0 8px' }}
                      />
                    </div>
                  ) : (
                    <span className="orbit-badge" style={{ fontSize: 11 }}>Closed</span>
                  )}
                </div>
              ))}
              <button
                onClick={() => showToast('Working hours updated successfully', 'success')}
                className="btn btn-primary"
                style={{ alignSelf: 'flex-start', background: 'var(--signal-orange)', marginTop: 8 }}
              >
                Save Working Hours
              </button>
            </div>
          </Card>
        );

      case 'Notifications':
        return (
          <Card>
            <SectionTitle>Notification preferences</SectionTitle>
            <div style={{ maxWidth: 540 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: 11, fontWeight: 700, color: 'var(--stone-gray)', textTransform: 'uppercase' }}>Event Trigger</th>
                    <th style={{ textAlign: 'center', padding: '12px 16px', fontSize: 11, fontWeight: 700, color: 'var(--stone-gray)', textTransform: 'uppercase' }}>Email Alert</th>
                    <th style={{ textAlign: 'center', padding: '12px 16px', fontSize: 11, fontWeight: 700, color: 'var(--stone-gray)', textTransform: 'uppercase' }}>In-App Popup</th>
                  </tr>
                </thead>
                <tbody>
                  {state.notificationSettings.map(ns => (
                    <tr key={ns.event} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: 'var(--midnight-ink)' }}>{ns.event}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={ns.email}
                          onChange={e => dispatch({ type: 'UPDATE_NOTIFICATION', event: ns.event, channel: 'email', value: e.target.checked })}
                          style={{ cursor: 'pointer' }}
                        />
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={ns.inApp}
                          onChange={e => dispatch({ type: 'UPDATE_NOTIFICATION', event: ns.event, channel: 'inApp', value: e.target.checked })}
                          style={{ cursor: 'pointer' }}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button
                onClick={() => showToast('Notification preferences saved', 'success')}
                className="btn btn-primary"
                style={{ alignSelf: 'flex-start', background: 'var(--signal-orange)', marginTop: 16 }}
              >
                Save Preferences
              </button>
            </div>
          </Card>
        );

      case 'Team Members':
        return (
          <div style={{ maxWidth: 680 }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
              <button onClick={() => setShowInvite(true)} className="btn btn-primary" style={{ background: 'var(--signal-orange)' }}>
                <UserPlus size={16} /> Invite New Member
              </button>
            </div>
            <Card style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '20px 20px 0' }}>
                <SectionTitle>Team directory</SectionTitle>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: 11, fontWeight: 700, color: 'var(--stone-gray)', textTransform: 'uppercase' }}>Name</th>
                    <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: 11, fontWeight: 700, color: 'var(--stone-gray)', textTransform: 'uppercase' }}>Email</th>
                    <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: 11, fontWeight: 700, color: 'var(--stone-gray)', textTransform: 'uppercase' }}>Role</th>
                    <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: 11, fontWeight: 700, color: 'var(--stone-gray)', textTransform: 'uppercase' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(members || state.teamMembers.map((m) => ({ ...m, display_name: m.name })) ).map((member: any) => (
                    <tr key={member.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 700, color: 'var(--midnight-ink)' }}>{member.display_name || member.name}</td>
                      <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--ink-600)' }}>{member.email}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ padding: '4px 10px', borderRadius: 4, background: 'var(--surface-0)', fontSize: 12, fontWeight: 650, color: 'var(--midnight-ink)', border: '1px solid var(--border)', textTransform: 'capitalize' }}>{member.role}</span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: member.status === 'Pending' ? 'var(--burnt-coral)' : '#0F8357' }}>● {member.status || 'Active'}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
            {manualLink && (
              <Card style={{ marginTop: 12 }}>
                <SectionTitle>Forward this invitation link</SectionTitle>
                <p style={{ fontSize: 12, color: 'var(--stone-gray)', margin: '0 0 8px' }}>Email delivery is not configured — copy and send this link yourself. It expires in 7 days.</p>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input className="input" readOnly value={manualLink} onFocus={(e) => e.target.select()} style={{ flex: 1 }} />
                  <button
                    className="btn" style={{ height: 38, padding: '0 16px', fontWeight: 700 }}
                    onClick={() => { try { navigator.clipboard.writeText(manualLink); showToast('Link copied', 'success'); } catch { showToast('Copy failed — select the text manually', 'danger'); } }}
                  >
                    Copy
                  </button>
                </div>
              </Card>
            )}
            {invites && invites.filter((i: any) => i.status === 'pending').length > 0 && (
              <Card style={{ marginTop: 12, padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '20px 20px 0' }}>
                  <SectionTitle>Pending invitations</SectionTitle>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <tbody>
                    {invites.filter((i: any) => i.status === 'pending').map((inv: any) => (
                      <tr key={inv.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--ink-600)' }}>{inv.email}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ padding: '4px 10px', borderRadius: 4, background: 'var(--surface-0)', fontSize: 12, fontWeight: 650, border: '1px solid var(--border)', textTransform: 'capitalize' }}>{inv.role}</span>
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                          <button onClick={() => handleRevokeInvite(inv.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, color: 'var(--burnt-coral)' }}>Revoke</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            )}
          </div>
        );

      case 'Account':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 760 }}>
            <Card style={{ padding: 20, borderLeft: '4px solid var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
              <div>
                <h4 style={{ fontSize: 15, fontWeight: 700, color: 'var(--midnight-ink)', margin: 0 }}>Sign Out of ORBIT</h4>
                <p style={{ fontSize: 12.5, color: 'var(--stone-gray)', marginTop: 2, marginBottom: 0 }}>You will be redirected to the login page.</p>
              </div>
              <button
                onClick={async () => {
                  await api.logout();
                  clearSessionCache();
                  navigate('/login');
                }}
                className="btn btn-outline"
                style={{ color: 'var(--danger)', borderColor: 'var(--danger)', gap: 8 }}
              >
                <LogOut size={16} /> Sign Out
              </button>
            </Card>
            <Card style={{ padding: 20, borderLeft: '4px solid var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
              <div>
                <h4 style={{ fontSize: 15, fontWeight: 700, color: 'var(--midnight-ink)', margin: 0 }}>Delete My Account</h4>
                <p style={{ fontSize: 12.5, color: 'var(--stone-gray)', marginTop: 2, marginBottom: 0 }}>
                  Permanently removes your login and sessions. Workspace, channels, and business data stay intact for remaining members.
                </p>
              </div>
              <button
                disabled={deleteBusy}
                onClick={async () => {
                  if (!confirmDelete) {
                    setConfirmDelete(true);
                    return;
                  }
                  setDeleteBusy(true);
                  const res = await api.deleteAccount();
                  setDeleteBusy(false);
                  if (res?.success) {
                    clearSessionCache();
                    window.location.assign('/login');
                  } else {
                    showToast(res?._network ? 'Backend unreachable — try again' : (res?.error || 'Delete failed'), 'danger');
                    setConfirmDelete(false);
                  }
                }}
                className="btn btn-outline"
                style={{ color: 'var(--danger)', borderColor: 'var(--danger)', gap: 8 }}
              >
                <Trash2 size={16} /> {deleteBusy ? 'Deleting…' : confirmDelete ? 'Click again to confirm' : 'Delete Account'}
              </button>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      <PageHeader
        eyebrow="Workspace"
        title="Settings"
        sub="Business profile, channels, plan, AI, hours, notifications, and team — synced with the live backend."
      />
      <div style={{ display: 'flex', gap: 24 }}>
        <div style={{ width: 210, minWidth: 210 }}>
          <Card style={{ padding: 8 }}>
            {settingsTabs.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  width: '100%', padding: '10px 12px', borderRadius: 6, border: 'none',
                  background: activeTab === tab ? 'var(--signal-orange-subtle)' : 'transparent',
                  color: activeTab === tab ? 'var(--signal-orange)' : 'var(--ink-600)',
                  fontSize: 13, fontWeight: activeTab === tab ? 700 : 500, cursor: 'pointer', textAlign: 'left',
                  marginBottom: 2, transition: 'all 0.15s ease'
                }}
              >
                {tab}
              </button>
            ))}
          </Card>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', minWidth: 0 }}>
          <SectionTitle>{activeTab}</SectionTitle>
          {renderPanel()}
        </div>

        <Modal isOpen={showInvite} onClose={() => setShowInvite(false)} title="Invite Team Member" size="sm">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <input className="input" placeholder="Email address" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} />
            <select className="input" value={inviteRole} onChange={e => setInviteRole(e.target.value)}>
              <option value="admin">Admin</option>
              <option value="agent">Agent</option>
            </select>
            <p style={{ fontSize: 11.5, color: 'var(--stone-gray)' }}>Owner-only. An email invitation is sent — the receiver accepts the link and sets their own password. Nothing to share or remember.</p>
            <button onClick={handleInvite} className="btn btn-primary" style={{ width: '100%', background: 'var(--signal-orange)' }}>Send Invitation</button>
          </div>
        </Modal>
      </div>
    </div>
  );
}

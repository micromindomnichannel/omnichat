import React, { useState } from 'react';
import { useStore } from '../state/store';
import { useVertical } from '../state/verticalContext';
import { Tabs } from '../components/shared/Tabs';
import { Modal } from '../components/shared/Modal';
import { EGYPTIAN_GOVERNORATES } from '../state/mockData';
import {
  Upload, Check, X, Plus, Trash2, UserPlus, Instagram, MessageCircle, Facebook, Music, Globe, Sparkles, Shield
} from 'lucide-react';
import { OrbitLogo } from '../components/shared/OrbitLogo';

const settingsTabs = ['Business Profile', 'Channels', 'AI Settings', 'Working Hours', 'Notifications', 'Team Members'];

const channelIcons: Record<string, React.ElementType> = {
  instagram: Instagram, whatsapp: MessageCircle, facebook: Facebook, tiktok: Music, website: Globe
};

export function Settings() {
  const { state, dispatch, showToast } = useStore();
  const { vertical, accentColor } = useVertical();
  const [activeTab, setActiveTab] = useState('Business Profile');
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('Agent');
  const [newRule, setNewRule] = useState('');

  const isDirty = false; // Simplified for prototype

  const handleToggleChannel = (channel: string) => {
    dispatch({ type: 'TOGGLE_CHANNEL', channel });
    showToast(`${channel} ${state.channelsConnected[channel] ? 'disconnected' : 'connected'}`, 'success');
  };

  const handleInvite = () => {
    dispatch({
      type: 'ADD_TEAM_MEMBER',
      member: { id: `t${Date.now()}`, name: inviteEmail.split('@')[0], email: inviteEmail, role: inviteRole as any, status: 'Pending' }
    });
    setShowInvite(false);
    setInviteEmail('');
    showToast('Invitation sent successfully', 'success');
  };

  const handleAddRule = () => {
    if (!newRule.trim()) return;
    dispatch({ type: 'UPDATE_AI_SETTINGS', field: 'aiHandoffRules', value: [...state.aiHandoffRules, newRule.trim()] });
    setNewRule('');
  };

  const handleRemoveRule = (rule: string) => {
    dispatch({ type: 'UPDATE_AI_SETTINGS', field: 'aiHandoffRules', value: state.aiHandoffRules.filter(r => r !== rule) });
  };

  const renderPanel = () => {
    switch (activeTab) {
      case 'Business Profile':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 520 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--midnight-ink)', marginBottom: 6, display: 'block' }}>Business Name</label>
              <input className="input" value={state.businessName} onChange={e => dispatch({ type: 'UPDATE_BUSINESS', field: 'businessName', value: e.target.value })} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--midnight-ink)', marginBottom: 6, display: 'block' }}>Brand Logo & Avatar</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', border: '2px dashed var(--stone-gray)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface-0)' }}>
                  <Upload size={20} color="var(--stone-gray)" />
                </div>
                <button className="btn btn-outline btn-sm">Upload New Logo</button>
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
            <button className="btn btn-primary" style={{ alignSelf: 'flex-start', background: 'var(--signal-orange)' }}>Save Profile Settings</button>
          </div>
        );

      case 'Channels':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 520 }}>
            {Object.entries(state.channelsConnected).map(([channel, connected]) => {
              const Icon = channelIcons[channel] || Globe;
              const colors: Record<string, string> = { instagram: '#E4405F', whatsapp: '#25D366', facebook: '#1877F2', tiktok: '#171717', website: '#343434' };
              return (
                <div key={channel} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface-1)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--surface-0)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon size={20} color={colors[channel]} />
                    </div>
                    <div>
                      <span style={{ fontSize: 14, fontWeight: 700, textTransform: 'capitalize', color: 'var(--midnight-ink)', display: 'block' }}>{channel}</span>
                      <span style={{ fontSize: 11, color: connected ? '#0F8357' : 'var(--stone-gray)' }}>
                        {connected ? '🟢 Syncing inquiries & webhooks' : '⚪ Disconnected'}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleToggleChannel(channel)}
                    className="btn"
                    style={{ height: 32, padding: '0 16px', fontSize: 12.5, fontWeight: 700, background: connected ? 'var(--danger-bg)' : 'var(--signal-orange)', color: connected ? 'var(--burnt-coral)' : 'white' }}
                  >
                    {connected ? 'Disconnect' : 'Connect'}
                  </button>
                </div>
              );
            })}
          </div>
        );

      case 'AI Settings':
        return (
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
        );

      case 'Working Hours':
        return (
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
          </div>
        );

      case 'Notifications':
        return (
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
          </div>
        );

      case 'Team Members':
        return (
          <div style={{ maxWidth: 680 }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
              <button onClick={() => setShowInvite(true)} className="btn btn-primary" style={{ background: 'var(--signal-orange)' }}>
                <UserPlus size={16} /> Invite New Member
              </button>
            </div>
            <div className="card">
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
                  {state.teamMembers.map(member => (
                    <tr key={member.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 700, color: 'var(--midnight-ink)' }}>{member.name}</td>
                      <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--ink-600)' }}>{member.email}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ padding: '4px 10px', borderRadius: 4, background: 'var(--surface-0)', fontSize: 12, fontWeight: 650, color: 'var(--midnight-ink)', border: '1px solid var(--border)' }}>{member.role}</span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: member.status === 'Active' ? '#0F8357' : 'var(--burnt-coral)' }}>● {member.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div style={{ display: 'flex', gap: 24, height: 'calc(100vh - 140px)' }}>
      <div style={{ width: 210, minWidth: 210 }}>
        <div className="card" style={{ padding: 8 }}>
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
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--midnight-ink)', marginBottom: 20 }}>{activeTab}</h2>
        {renderPanel()}
      </div>

      <Modal isOpen={showInvite} onClose={() => setShowInvite(false)} title="Invite Team Member" size="sm">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <input className="input" placeholder="Email address" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} />
          <select className="input" value={inviteRole} onChange={e => setInviteRole(e.target.value)}>
            <option>Owner</option>
            <option>Agent</option>
            <option>Viewer</option>
          </select>
          <button onClick={handleInvite} className="btn btn-primary" style={{ width: '100%', background: 'var(--signal-orange)' }}>Send Invitation</button>
        </div>
      </Modal>
    </div>
  );
}

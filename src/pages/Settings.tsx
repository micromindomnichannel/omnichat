import React, { useState } from 'react';
import { useStore } from '../state/store';
import { useVertical } from '../state/verticalContext';
import { Tabs } from '../components/shared/Tabs';
import { Modal } from '../components/shared/Modal';
import { EGYPTIAN_GOVERNORATES } from '../state/mockData';
import {
  Upload, Check, X, Plus, Trash2, UserPlus, Instagram, MessageCircle, Facebook, Music, Globe
} from 'lucide-react';

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
    showToast('Invitation sent', 'success');
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 480 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-600)', marginBottom: 6, display: 'block' }}>Business Name</label>
              <input className="input" value={state.businessName} onChange={e => dispatch({ type: 'UPDATE_BUSINESS', field: 'businessName', value: e.target.value })} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-600)', marginBottom: 6, display: 'block' }}>Logo</label>
              <div style={{ width: 80, height: 80, borderRadius: '50%', border: '2px dashed var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface-0)' }}>
                <Upload size={20} color="var(--ink-400)" />
              </div>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-600)', marginBottom: 6, display: 'block' }}>Industry</label>
              <select className="input" value={state.industry} onChange={e => dispatch({ type: 'UPDATE_BUSINESS', field: 'industry', value: e.target.value })}>
                <option>Retail</option>
                <option>Fashion</option>
                <option>Electronics</option>
                <option>Healthcare</option>
                <option>Beauty</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-600)', marginBottom: 6, display: 'block' }}>Description</label>
              <textarea className="input" rows={3} value={state.businessDescription} onChange={e => dispatch({ type: 'UPDATE_BUSINESS', field: 'businessDescription', value: e.target.value })} />
            </div>
            {isDirty && (
              <div style={{ position: 'sticky', bottom: 0, padding: 12, background: 'var(--surface-1)', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end' }}>
                <button className="btn btn-primary" style={{ background: accentColor }}>Save changes</button>
              </div>
            )}
          </div>
        );

      case 'Channels':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 480 }}>
            {Object.entries(state.channelsConnected).map(([channel, connected]) => {
              const Icon = channelIcons[channel] || Globe;
              const colors: Record<string, string> = { instagram: '#E4405F', whatsapp: '#25D366', facebook: '#1877F2', tiktok: '#000000', website: '#6B7280' };
              return (
                <div key={channel} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface-1)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Icon size={20} color={colors[channel]} />
                    <span style={{ fontSize: 14, fontWeight: 600, textTransform: 'capitalize' }}>{channel}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: connected ? 'var(--success)' : 'var(--ink-400)' }}>
                      {connected ? 'Connected' : 'Not Connected'}
                    </span>
                    <button
                      onClick={() => handleToggleChannel(channel)}
                      className="btn"
                      style={{ height: 28, padding: '0 14px', fontSize: 12, background: connected ? 'var(--danger-bg)' : accentColor, color: connected ? 'var(--danger)' : 'white' }}
                    >
                      {connected ? 'Disconnect' : 'Connect'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        );

      case 'AI Settings':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 480 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface-1)' }}>
              <span style={{ fontSize: 14, fontWeight: 600 }}>AI Enabled</span>
              <button
                onClick={() => dispatch({ type: 'UPDATE_AI_SETTINGS', field: 'aiEnabled', value: !state.aiEnabled })}
                style={{
                  width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
                  background: state.aiEnabled ? accentColor : 'var(--border)',
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
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-600)', marginBottom: 6, display: 'block' }}>Brand Tone</label>
              <div style={{ display: 'flex', gap: 4 }}>
                {['Friendly', 'Professional', 'Casual'].map(tone => (
                  <button
                    key={tone}
                    onClick={() => dispatch({ type: 'UPDATE_AI_SETTINGS', field: 'aiTone', value: tone })}
                    style={{
                      flex: 1, padding: '8px 0', borderRadius: 6, border: '1px solid var(--border)',
                      fontSize: 13, fontWeight: 600, cursor: 'pointer',
                      background: state.aiTone === tone ? accentColor : 'transparent',
                      color: state.aiTone === tone ? 'white' : 'var(--ink-600)'
                    }}
                  >
                    {tone}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-600)', marginBottom: 6, display: 'block' }}>Response Language</label>
              <div style={{ display: 'flex', gap: 4 }}>
                {['Arabic', 'English', 'Both'].map(lang => (
                  <button
                    key={lang}
                    onClick={() => dispatch({ type: 'UPDATE_AI_SETTINGS', field: 'aiLanguage', value: lang })}
                    style={{
                      flex: 1, padding: '8px 0', borderRadius: 6, border: '1px solid var(--border)',
                      fontSize: 13, fontWeight: 600, cursor: 'pointer',
                      background: state.aiLanguage === lang ? accentColor : 'transparent',
                      color: state.aiLanguage === lang ? 'white' : 'var(--ink-600)'
                    }}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-600)', marginBottom: 6, display: 'block' }}>Handoff Rules</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {state.aiHandoffRules.map(rule => (
                  <div key={rule} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 6, background: 'var(--surface-0)', border: '1px solid var(--border)' }}>
                    <span style={{ flex: 1, fontSize: 13 }}>{rule}</span>
                    <button onClick={() => handleRemoveRule(rule)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                      <Trash2 size={14} color="var(--ink-400)" />
                    </button>
                  </div>
                ))}
                <div style={{ display: 'flex', gap: 8 }}>
                  <input className="input" placeholder="Add rule..." value={newRule} onChange={e => setNewRule(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddRule()} />
                  <button onClick={handleAddRule} className="btn btn-primary" style={{ background: accentColor }}><Plus size={16} /></button>
                </div>
              </div>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-600)', marginBottom: 6, display: 'block' }}>
                Confidence Threshold: {state.aiConfidenceThreshold}%
              </label>
              <input
                type="range"
                min={0}
                max={100}
                value={state.aiConfidenceThreshold}
                onChange={e => dispatch({ type: 'UPDATE_AI_SETTINGS', field: 'aiConfidenceThreshold', value: Number(e.target.value) })}
                style={{ width: '100%' }}
              />
            </div>
          </div>
        );

      case 'Working Hours':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 480 }}>
            {state.workingHours.map(wh => (
              <div key={wh.day} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-1)' }}>
                <button
                  onClick={() => dispatch({ type: 'UPDATE_WORKING_HOURS', day: wh.day, field: 'open', value: !wh.open })}
                  style={{
                    width: 36, height: 20, borderRadius: 10, border: 'none', cursor: 'pointer',
                    background: wh.open ? accentColor : 'var(--border)', position: 'relative'
                  }}
                >
                  <div style={{ width: 16, height: 16, borderRadius: '50%', background: 'white', position: 'absolute', top: 2, left: wh.open ? 18 : 2, transition: 'left 0.2s' }} />
                </button>
                <span style={{ width: 80, fontSize: 13, fontWeight: 600 }}>{wh.day}</span>
                {wh.open && (
                  <>
                    <input
                      type="time"
                      value={wh.start}
                      onChange={e => dispatch({ type: 'UPDATE_WORKING_HOURS', day: wh.day, field: 'start', value: e.target.value })}
                      style={{ width: 80, height: 32, borderRadius: 6, border: '1px solid var(--border)', fontSize: 13, padding: '0 8px' }}
                    />
                    <span style={{ color: 'var(--ink-400)' }}>to</span>
                    <input
                      type="time"
                      value={wh.end}
                      onChange={e => dispatch({ type: 'UPDATE_WORKING_HOURS', day: wh.day, field: 'end', value: e.target.value })}
                      style={{ width: 80, height: 32, borderRadius: 6, border: '1px solid var(--border)', fontSize: 13, padding: '0 8px' }}
                    />
                  </>
                )}
              </div>
            ))}
          </div>
        );

      case 'Notifications':
        return (
          <div style={{ maxWidth: 480 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: 11, fontWeight: 600, color: 'var(--ink-400)', textTransform: 'uppercase' }}>Event</th>
                  <th style={{ textAlign: 'center', padding: '12px 16px', fontSize: 11, fontWeight: 600, color: 'var(--ink-400)', textTransform: 'uppercase' }}>Email</th>
                  <th style={{ textAlign: 'center', padding: '12px 16px', fontSize: 11, fontWeight: 600, color: 'var(--ink-400)', textTransform: 'uppercase' }}>In-App</th>
                </tr>
              </thead>
              <tbody>
                {state.notificationSettings.map(ns => (
                  <tr key={ns.event} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px 16px', fontSize: 13 }}>{ns.event}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={ns.email}
                        onChange={e => dispatch({ type: 'UPDATE_NOTIFICATION', event: ns.event, channel: 'email', value: e.target.checked })}
                      />
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={ns.inApp}
                        onChange={e => dispatch({ type: 'UPDATE_NOTIFICATION', event: ns.event, channel: 'inApp', value: e.target.checked })}
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
          <div style={{ maxWidth: 640 }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
              <button onClick={() => setShowInvite(true)} className="btn btn-primary" style={{ background: accentColor }}>
                <UserPlus size={16} /> Invite member
              </button>
            </div>
            <div className="card">
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: 11, fontWeight: 600, color: 'var(--ink-400)', textTransform: 'uppercase' }}>Name</th>
                    <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: 11, fontWeight: 600, color: 'var(--ink-400)', textTransform: 'uppercase' }}>Email</th>
                    <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: 11, fontWeight: 600, color: 'var(--ink-400)', textTransform: 'uppercase' }}>Role</th>
                    <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: 11, fontWeight: 600, color: 'var(--ink-400)', textTransform: 'uppercase' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {state.teamMembers.map(member => (
                    <tr key={member.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600 }}>{member.name}</td>
                      <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--ink-600)' }}>{member.email}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ padding: '4px 8px', borderRadius: 4, background: 'var(--surface-0)', fontSize: 12, fontWeight: 600 }}>{member.role}</span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: member.status === 'Active' ? 'var(--success)' : 'var(--warning)' }}>{member.status}</span>
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
      <div style={{ width: 200, minWidth: 200 }}>
        <div className="card" style={{ padding: 8 }}>
          {settingsTabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                width: '100%', padding: '10px 12px', borderRadius: 6, border: 'none',
                background: activeTab === tab ? accentColor + '14' : 'transparent',
                color: activeTab === tab ? accentColor : 'var(--ink-600)',
                fontSize: 13, fontWeight: 600, cursor: 'pointer', textAlign: 'left',
                marginBottom: 2
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>
      <div style={{ flex: 1, overflow: 'auto' }}>
        <h2 style={{ fontSize: 20, fontWeight: 650, color: 'var(--ink-900)', marginBottom: 24 }}>{activeTab}</h2>
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
          <button onClick={handleInvite} className="btn btn-primary" style={{ width: '100%', background: accentColor }}>Send Invitation</button>
        </div>
      </Modal>
    </div>
  );
}

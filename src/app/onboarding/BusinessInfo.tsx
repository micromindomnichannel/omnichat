import React, { useEffect, useState } from 'react';
import { useVertical } from '../../state/verticalContext';
import { useStore } from '../../state/store';
import { Upload, ArrowLeft, ArrowRight } from 'lucide-react';
import { api } from '../../services/api';

interface Props {
  data: any;
  onNext: (data: any) => void;
  onBack: () => void;
}

export function BusinessInfo({ data, onNext, onBack }: Props) {
  const { vertical, accentColor } = useVertical();
  const { showToast } = useStore();
  const [businessName, setBusinessName] = useState(data.businessName || '');
  const [industry, setIndustry] = useState(data.industry || '');
  const [description, setDescription] = useState(data.businessDescription || '');
  const [industryOther, setIndustryOther] = useState(data.industryOther || '');
  const [logo, setLogo] = useState(data.businessLogo || '');
  const [saving, setSaving] = useState(false);

  const canContinue = businessName.trim().length > 0 && industry.length > 0 &&
    (industry !== 'other' || industryOther.trim().length > 0);

  useEffect(() => () => {
    if (logo.startsWith('blob:')) URL.revokeObjectURL(logo);
  }, [logo]);

  const handleLogo = async (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('Choose a PNG, JPEG, GIF, or WEBP image', 'danger');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast('Logo must be smaller than 5MB', 'danger');
      return;
    }
    const localPreview = URL.createObjectURL(file);
    setLogo(localPreview);
    const reader = new FileReader();
    reader.onload = async () => {
      const result = await api.uploadImage(String(reader.result));
      if (result?.url) {
        URL.revokeObjectURL(localPreview);
        setLogo(result.url);
        showToast('Logo uploaded', 'success');
      } else {
        showToast('Logo preview saved locally; upload will retry when connected', 'warning');
      }
    };
    reader.onerror = () => showToast('Could not read logo', 'danger');
    reader.readAsDataURL(file);
  };

  // Best-effort save to backend (works offline — onboarding continues regardless).
  const handleContinue = async () => {
    setSaving(true);
    const resolvedIndustry = industry === 'other' ? industryOther.trim() : industry;
    const saved = await api.updateSettings({ business_name: businessName.trim(), industry: resolvedIndustry, description, logo });
    setSaving(false);
    if (!saved) showToast('Backend unreachable — continuing locally', 'warning');
    onNext({ ...data, businessName: businessName.trim(), industry: resolvedIndustry, industryKind: industry, industryOther, businessDescription: description, businessLogo: logo });
  };

  return (
    <div style={{
      maxWidth: 560, margin: '0 auto', padding: '48px 24px'
    }}>
      <div style={{ marginBottom: 32 }}>
        <div style={{
          display: 'flex', gap: 4, marginBottom: 24
        }}>
          {[0, 1, 2, 3, 4, 5].map(i => (
            <div key={i} style={{
              flex: 1, height: 4, borderRadius: 2,
              background: i <= 1 ? accentColor : 'var(--border)'
            }} />
          ))}
        </div>
        <h2 style={{ fontSize: 24, fontWeight: 650, color: 'var(--ink-900)', marginBottom: 8 }}>
          Tell us about your business
        </h2>
        <p style={{ fontSize: 14, color: 'var(--ink-600)' }}>
          This helps us personalize your AI assistant.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-600)', marginBottom: 6, display: 'block' }}>
            Business Name *
          </label>
          <input
            type="text"
            className="input"
            value={businessName}
            onChange={e => setBusinessName(e.target.value)}
            placeholder="e.g., Cairo Fashion Store"
          />
        </div>

        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-600)', marginBottom: 6, display: 'block' }}>
            Logo
          </label>
          <label style={{
            width: 80, height: 80, borderRadius: '50%',
            border: '2px dashed var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', background: 'var(--surface-0)'
          }}>
            {logo ? <img src={logo} alt="Business logo preview" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} /> : <Upload size={20} color="var(--ink-400)" />}
            <input type="file" hidden accept="image/png,image/jpeg,image/gif,image/webp" onChange={e => { handleLogo(e.target.files?.[0]); e.target.value = ''; }} />
          </label>
        </div>

        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-600)', marginBottom: 6, display: 'block' }}>
            Industry *
          </label>
          <select
            className="input"
            value={industry}
            onChange={e => setIndustry(e.target.value)}
          >
            <option value="">Select industry</option>
            <option value="retail">Retail</option>
            <option value="fashion">Fashion</option>
            <option value="electronics">Electronics</option>
            <option value="healthcare">Healthcare</option>
            <option value="beauty">Beauty & Wellness</option>
            <option value="food">Food & Beverage</option>
            <option value="other">Other</option>
          </select>
          {industry === 'other' && (
            <input className="input" style={{ marginTop: 8 }} value={industryOther}
              onChange={e => setIndustryOther(e.target.value)}
              placeholder="Tell us your business type" />
          )}
        </div>

        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-600)', marginBottom: 6, display: 'block' }}>
            Description
          </label>
          <textarea
            className="input"
            placeholder="Briefly describe what you sell or offer..."
            rows={3}
            value={description}
            onChange={e => setDescription(e.target.value)}
          />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginTop: 32, justifyContent: 'flex-end' }}>
        <button onClick={onBack} className="btn btn-outline">
          <ArrowLeft size={16} /> Back
        </button>
        <button
          onClick={handleContinue}
          className="btn btn-primary"
          disabled={!canContinue || saving}
          style={{ background: accentColor }}
        >
          {saving ? 'Saving…' : 'Continue'} <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}

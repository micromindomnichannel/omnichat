import React, { useState, useRef } from 'react';
import { UploadCloud, Image as ImageIcon, Check, X, RefreshCw } from 'lucide-react';
import { api } from '../../services/api';

interface ImageUploaderProps {
  value: string;
  onChange: (urlOrBase64: string) => void;
  label?: string;
}

export function ImageUploader({ value, onChange, label = 'Product Photo' }: ImageUploaderProps) {
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const presets = [
    { name: 'Leather Bag', url: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=500&auto=format&fit=crop' },
    { name: 'Silk Dress', url: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=500&auto=format&fit=crop' },
    { name: 'Sneakers', url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&auto=format&fit=crop' },
    { name: 'Clinic Dental', url: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=500&auto=format&fit=crop' }
  ];

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (PNG, JPG, WEBP).');
      return;
    }

    setLoading(true);
    const reader = new FileReader();

    reader.onload = async (e) => {
      const base64Data = e.target?.result as string;
      if (!base64Data) return;

      try {
        // Send base64 to server upload endpoint
        const res = await fetch('http://localhost:5000/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: base64Data })
        });

        const data = await res.json();
        if (data.url) {
          onChange(data.url);
        } else {
          onChange(base64Data);
        }
      } catch (err) {
        // Fallback to storing raw Base64 data directly in DB
        onChange(base64Data);
      } finally {
        setLoading(false);
      }
    };

    reader.readAsDataURL(file);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--midnight-ink)', display: 'block' }}>
        {label}
      </label>

      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        style={{ display: 'none' }}
        onChange={e => {
          if (e.target.files && e.target.files[0]) {
            handleFileSelect(e.target.files[0]);
          }
        }}
      />

      {/* Drop / Upload Zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => {
          e.preventDefault();
          setDragOver(false);
          if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileSelect(e.dataTransfer.files[0]);
          }
        }}
        onClick={() => fileInputRef.current?.click()}
        style={{
          border: `2px dashed ${dragOver ? 'var(--signal-orange)' : 'var(--border)'}`,
          borderRadius: 12,
          padding: 16,
          background: dragOver ? 'var(--signal-orange-subtle)' : 'var(--surface-0)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          transition: 'all 0.2s ease'
        }}
      >
        {value ? (
          <div style={{ position: 'relative', width: 64, height: 64, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border)' }}>
            <img src={value} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        ) : (
          <div style={{
            width: 50, height: 50, borderRadius: '50%', background: 'var(--signal-orange-subtle)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--signal-orange)'
          }}>
            <UploadCloud size={24} />
          </div>
        )}

        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--midnight-ink)', marginBottom: 2 }}>
            {loading ? 'Uploading & Processing Photo...' : value ? 'Click or drag to replace photo' : 'Upload photo file from your computer'}
          </p>
          <p style={{ fontSize: 11, color: 'var(--stone-gray)' }}>
            PNG, JPG, WEBP formats supported. Image will be saved to database.
          </p>
        </div>

        {value && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onChange(''); }}
            className="btn btn-ghost btn-sm"
            style={{ color: 'var(--stone-gray)' }}
            title="Remove photo"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Preset Quick Selectors */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
        <span style={{ fontSize: 11, color: 'var(--stone-gray)', fontWeight: 600 }}>Quick Presets:</span>
        {presets.map((p, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => onChange(p.url)}
            className="btn btn-outline btn-sm"
            style={{ padding: '2px 8px', fontSize: 10, borderRadius: 12, background: 'white' }}
          >
            {p.name}
          </button>
        ))}
      </div>
    </div>
  );
}

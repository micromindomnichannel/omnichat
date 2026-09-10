// Single source of backend configuration (no imports — cycle-safe).
export const BASE_URL = (process.env.MICROMIND_BASE_URL || 'https://core.aimicromind.com/api/v1').replace(/\/$/, '');
export const PROVISIONER_EMAIL = process.env.MICROMIND_PROVISIONER_EMAIL || '';
export const PROVISIONER_PASSWORD = process.env.MICROMIND_PROVISIONER_PASSWORD || '';
export const STATIC_KEY = process.env.MICROMIND_API_KEY || '';

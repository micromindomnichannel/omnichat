// Tenant folders: POST /api/v1/folders -> 201 + {id} (verified live).
// Folders are ORGANIZATION, not a permission boundary — tenancy stays enforced
// by the caller (ORBIT mapping). This module never claims otherwise.
import { api } from './http.js';

export const FOLDER_COLOR = '#E0AA3E';

export async function createFolder({ name, description = '', resourceType = 'chatflow' }) {
  if (!name) throw new Error('createFolder: name required');
  const created = await api('POST', '/folders', {
    name,
    description,
    resourceType,
    color: FOLDER_COLOR,
    isOrgShared: false,
    sharedUserIds: [],
  });
  if (!created?.id) throw new Error('createFolder: response carried no id');
  return { id: created.id, name: created.name || name };
}

export async function listFolders() {
  const res = await api('GET', '/folders');
  return Array.isArray(res) ? res : res?.data || [];
}

export async function findFolder(id) {
  return (await listFolders()).find((f) => f.id === id) || null;
}

export async function deleteFolder(id) {
  if (!id) throw new Error('deleteFolder: id required');
  return api('DELETE', `/folders/${id}`);
}

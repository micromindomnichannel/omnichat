// Tenant folders on MicroMind: one folder per ORBIT workspace, flows created
// into it via folderId (both verified live as a member JWT).
// The folder is ORGANIZATION, not a permission boundary — tenancy is enforced
// by the ORBIT backend (mapping + vault + membership). Never imply otherwise.
import { createFolder, listFolders, deleteFolder } from './client.js';

const rid = (p) => `${p}_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
export const FOLDER_COLOR = '#E0AA3E';

// Resolve-or-create the tenant folder. Idempotent: stored id wins, verified
// against the live list (recreates if the folder was deleted in MicroMind).
export async function ensureTenantFolder(pool, workspaceId, displayName) {
  const ws = (await pool.query(
    'SELECT micromind_folder_id, micromind_folder_status FROM workspaces WHERE id=$1', [workspaceId])).rows[0];
  if (ws?.micromind_folder_id) {
    try {
      const folders = await listFolders();
      const found = (Array.isArray(folders) ? folders : folders?.data || []).find((f) => f.id === ws.micromind_folder_id);
      if (found) {
        if (ws.micromind_folder_status !== 'ready') {
          await pool.query("UPDATE workspaces SET micromind_folder_status='ready' WHERE id=$1", [workspaceId]);
        }
        return { folderId: found.id, created: false };
      }
    } catch { /* fall through to recreate */ }
  }
  const created = await createFolder({
    name: displayName || `ORBIT - ${workspaceId}`,
    description: `Tenant folder for ORBIT workspace ${workspaceId} (auto-provisioned)`,
    resourceType: 'chatflow',
    color: FOLDER_COLOR,
    isOrgShared: false,
    sharedUserIds: [],
  });
  if (!created?.id) throw new Error('ensureTenantFolder: folder creation returned no id');
  await pool.query("UPDATE workspaces SET micromind_folder_id=$1, micromind_folder_status='ready' WHERE id=$2",
    [created.id, workspaceId]);
  return { folderId: created.id, created: true };
}

export async function folderStatus(pool, workspaceId) {
  const ws = (await pool.query(
    'SELECT micromind_folder_id, micromind_folder_status FROM workspaces WHERE id=$1', [workspaceId])).rows[0];
  return { folderId: ws?.micromind_folder_id || null, status: ws?.micromind_folder_status || 'pending' };
}

export { rid };

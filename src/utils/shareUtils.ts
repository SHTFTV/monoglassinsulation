import LZString from 'lz-string';
import { MultiRoomProject } from '../types';

export interface SharedProjectPayload {
  v: number; // Schema version
  project: MultiRoomProject;
  sharedBy?: string;
  accessMode?: 'collaborative' | 'review' | 'subcontractor';
  timestamp: string;
}

/**
 * Compresses and encodes a full MultiRoomProject object into a URL-safe string
 */
export function encodeProjectToCompressedString(
  project: MultiRoomProject,
  meta: { sharedBy?: string; accessMode?: 'collaborative' | 'review' | 'subcontractor' } = {}
): string {
  const payload: SharedProjectPayload = {
    v: 1,
    project,
    sharedBy: meta.sharedBy || undefined,
    accessMode: meta.accessMode || 'collaborative',
    timestamp: new Date().toISOString(),
  };

  const jsonStr = JSON.stringify(payload);
  return LZString.compressToEncodedURIComponent(jsonStr);
}

/**
 * Decodes a compressed string back into a Project and its sharing metadata
 */
export function decodeProjectFromCompressedString(
  compressedStr: string
): { project: MultiRoomProject; sharedBy?: string; accessMode?: string; timestamp?: string } | null {
  try {
    if (!compressedStr || typeof compressedStr !== 'string') return null;

    let jsonStr = LZString.decompressFromEncodedURIComponent(compressedStr);
    
    // Fallback if not LZString compressed (e.g. raw URI encoded or base64)
    if (!jsonStr) {
      try {
        jsonStr = decodeURIComponent(compressedStr);
      } catch {
        jsonStr = atob(compressedStr);
      }
    }

    if (!jsonStr) return null;

    const parsed = JSON.parse(jsonStr);

    // If schema wrapped
    if (parsed && parsed.project && Array.isArray(parsed.project.rooms)) {
      return {
        project: parsed.project,
        sharedBy: parsed.sharedBy,
        accessMode: parsed.accessMode,
        timestamp: parsed.timestamp,
      };
    }

    // If direct MultiRoomProject
    if (parsed && Array.isArray(parsed.rooms)) {
      return {
        project: parsed as MultiRoomProject,
        sharedBy: undefined,
        accessMode: 'collaborative',
        timestamp: parsed.lastUpdated || new Date().toISOString(),
      };
    }

    return null;
  } catch (err) {
    console.error('Error decoding project payload:', err);
    return null;
  }
}

/**
 * Builds the full browser-accessible URL for a self-contained compressed share link
 */
export function buildCompressedShareUrl(
  project: MultiRoomProject,
  meta: { sharedBy?: string; accessMode?: 'collaborative' | 'review' | 'subcontractor' } = {}
): string {
  const compressed = encodeProjectToCompressedString(project, meta);
  const origin = typeof window !== 'undefined' && window.location.origin
    ? window.location.origin
    : 'https://monoglassinsulation.com';
  const pathname = typeof window !== 'undefined' && window.location.pathname
    ? window.location.pathname
    : '/';

  return `${origin}${pathname}#project=${compressed}`;
}

/**
 * Server API helper: Creates a short remote share link
 */
export async function createServerShareLink(
  project: MultiRoomProject,
  sharedBy?: string,
  accessMode?: string
): Promise<{ shareId: string; fullUrl: string } | null> {
  try {
    const res = await fetch('/api/share-project', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ project, sharedBy, accessMode }),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    if (data.success && data.shareId) {
      const origin = typeof window !== 'undefined' && window.location.origin
        ? window.location.origin
        : 'https://monoglassinsulation.com';
      const pathname = typeof window !== 'undefined' && window.location.pathname
        ? window.location.pathname
        : '/';

      return {
        shareId: data.shareId,
        fullUrl: `${origin}${pathname}?share=${data.shareId}`,
      };
    }
    return null;
  } catch (err) {
    console.warn('Could not create server-side share record, fallback to client-side compressed link:', err);
    return null;
  }
}

/**
 * Server API helper: Fetches a remote shared project by short ID
 */
export async function fetchServerSharedProject(
  shareId: string
): Promise<{ project: MultiRoomProject; sharedBy: string; accessMode: string; createdAt: string } | null> {
  try {
    const res = await fetch(`/api/share-project/${encodeURIComponent(shareId)}`);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.success && data.record) {
      return data.record;
    }
    return null;
  } catch (err) {
    console.error('Failed to fetch server shared project:', err);
    return null;
  }
}

/**
 * Generates ready-to-send team coordination text for email, Slack, or subcontracts
 */
export function generateShareDigest(
  project: MultiRoomProject,
  shareUrl: string,
  sharedBy?: string
): {
  emailSubject: string;
  emailBody: string;
  slackMarkdown: string;
} {
  const activeRooms = project.rooms.filter((r) => r.enabled);
  const totalArea = activeRooms.reduce((sum, r) => sum + (r.planArea || 0), 0);
  const unit = project.unitSystem === 'metric' ? 'm²' : 'sq ft';
  const author = sharedBy?.trim() || 'Monoglass Project Team';

  const emailSubject = `Monoglass Project Estimate Takeoff: ${project.name || 'Project Takeoff'}`;
  
  const emailBody = `Hi Team,

I've shared the active Monoglass Spray-Applied Glass Fiber Insulation estimate for "${project.name || 'Untitled Project'}".

PROJECT SUMMARY:
• Project Name:       ${project.name || 'Untitled Project'}
• Facility Type:      ${project.projectType || 'Commercial'}
• Total Active Zones: ${activeRooms.length} room(s) / area(s)
• Plan Footprint:     ${totalArea.toLocaleString()} ${unit}
• Shared By:          ${author}
• Date Shared:        ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}

ACCESS AND COLLABORATE ON THIS ESTIMATE:
Click the unique link below to open the complete multi-room bill of materials, substrate fluting calculations, and thermal/acoustic specs:
${shareUrl}

All specifications conform to CSI MasterFormat 07 21 29 (Sprayed Insulation) & ASTM E84 / ASTM C423 standards.

Best regards,
${author}`;

  const slackMarkdown = `*Monoglass Project Estimate Shared:* *${project.name || 'Untitled Project'}*
• *Scope:* ${activeRooms.length} zone(s) | ${totalArea.toLocaleString()} ${unit} total area
• *Facility:* ${project.projectType || 'Commercial'}
• *Shared by:* ${author}
👉 *Open & Collaborate:* <${shareUrl}|Click here to view the live takeoff and BOM>`;

  return { emailSubject, emailBody, slackMarkdown };
}

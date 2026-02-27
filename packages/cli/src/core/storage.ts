/**
 * Rei File I/O — Local-Only Storage
 * 
 * Design principle: All data stays on the user's local machine.
 * No server communication. No telemetry. No cloud sync.
 */

import * as fs from 'fs';
import * as path from 'path';
import { ReiStructure } from './types';

const REI_DIR = '.rei';
const REI_EXT = '.rei.json';

/**
 * Get the .rei directory path (project-local or home)
 */
export function getReiDir(basePath?: string): string {
  const base = basePath || process.cwd();
  return path.join(base, REI_DIR);
}

/**
 * Ensure .rei directory exists
 */
export function ensureReiDir(basePath?: string): string {
  const dir = getReiDir(basePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

/**
 * Generate a safe filename from a structure name
 */
export function toFilename(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\w\u3000-\u9fff\uff00-\uffef-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    || 'untitled';
}

/**
 * Save a Rei structure to local JSON file
 */
export function saveStructure(structure: ReiStructure, basePath?: string): string {
  const dir = ensureReiDir(basePath);
  const filename = toFilename(structure.center) + REI_EXT;
  const filePath = path.join(dir, filename);

  const data = JSON.stringify(structure, null, 2);
  fs.writeFileSync(filePath, data, 'utf-8');

  // Update the meta file path
  structure.meta.file_path = filePath;

  return filePath;
}

/**
 * Load a Rei structure from a JSON file
 */
export function loadStructure(filePath: string): ReiStructure {
  if (!fs.existsSync(filePath)) {
    // Try resolving from .rei directory
    const reiPath = path.join(getReiDir(), filePath + REI_EXT);
    if (fs.existsSync(reiPath)) {
      filePath = reiPath;
    } else {
      throw new Error(`File not found: ${filePath}`);
    }
  }

  const data = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(data) as ReiStructure;
}

/**
 * List all Rei structures in the .rei directory
 */
export function listStructures(basePath?: string): { name: string; path: string; structure: ReiStructure }[] {
  const dir = getReiDir(basePath);
  if (!fs.existsSync(dir)) return [];

  return fs.readdirSync(dir)
    .filter((f) => f.endsWith(REI_EXT))
    .map((f) => {
      const fullPath = path.join(dir, f);
      try {
        const structure = JSON.parse(fs.readFileSync(fullPath, 'utf-8')) as ReiStructure;
        return { name: f.replace(REI_EXT, ''), path: fullPath, structure };
      } catch {
        return null;
      }
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);
}

/**
 * Export structure as a file for AI chat attachment
 */
export function exportToFile(
  content: string,
  filename: string,
  format: 'json' | 'md',
  basePath?: string
): string {
  const dir = basePath || process.cwd();
  const ext = format === 'json' ? '.rei-context.json' : '.rei-context.md';
  const filePath = path.join(dir, filename + ext);
  fs.writeFileSync(filePath, content, 'utf-8');
  return filePath;
}

/**
 * Find a structure by partial name match
 */
export function findStructure(query: string, basePath?: string): { name: string; path: string; structure: ReiStructure } | null {
  const all = listStructures(basePath);
  const q = query.toLowerCase();

  // Exact match first
  const exact = all.find((s) => s.name === q);
  if (exact) return exact;

  // Partial match
  const partial = all.find((s) => s.name.includes(q) || s.structure.center.toLowerCase().includes(q));
  return partial || null;
}

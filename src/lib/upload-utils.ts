// src/lib/upload-utils.ts

import { createId } from "@paralleldrive/cuid2";
import sharp from "sharp";
import path from "path";
import fs from "fs/promises";

/**
 * Types de fichiers autorisés
 */
export const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
] as const;

export const ALLOWED_EXTENSIONS = [".pdf", ".jpeg", ".jpg", ".png"] as const;

/**
 * Taille maximale : 10 MB
 */
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * Vérifier si le type MIME est autorisé
 */
export function isAllowedMimeType(mimeType: string): boolean {
  return ALLOWED_MIME_TYPES.includes(mimeType as any);
}

/**
 * Vérifier si l'extension est autorisée
 */
export function isAllowedExtension(filename: string): boolean {
  const ext = path.extname(filename).toLowerCase();
  return ALLOWED_EXTENSIONS.includes(ext as any);
}

/**
 * Sanitize le nom de fichier
 * Supprime caractères spéciaux, espaces, etc.
 */
export function sanitizeFilename(filename: string): string {
  const ext = path.extname(filename);
  const nameWithoutExt = path.basename(filename, ext);

  // Remplacer caractères spéciaux par tirets
  const sanitized = nameWithoutExt
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .substring(0, 50); // Limiter à 50 caractères

  return sanitized + ext.toLowerCase();
}

/**
 * Générer un nom de fichier unique
 */
export function generateUniqueFilename(originalFilename: string): string {
  const sanitized = sanitizeFilename(originalFilename);
  const ext = path.extname(sanitized);
  const nameWithoutExt = path.basename(sanitized, ext);
  const timestamp = Date.now();
  const uniqueId = createId();

  return `${uniqueId}_${timestamp}_${nameWithoutExt}${ext}`;
}

/**
 * Obtenir le chemin de sauvegarde basé sur la date
 */
export function getUploadPath(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");

  return path.join("uploads", "documents", String(year), month);
}

/**
 * Créer les dossiers d'upload si ils n'existent pas
 */
export async function ensureUploadDirectory(uploadPath: string): Promise<void> {
  const fullPath = path.join(process.cwd(), "public", uploadPath);

  try {
    await fs.access(fullPath);
  } catch {
    // Le dossier n'existe pas, on le crée
    await fs.mkdir(fullPath, { recursive: true });
  }
}

/**
 * Compresser une image avec Sharp
 */
export async function compressImage(
  buffer: Buffer,
  mimeType: string
): Promise<Buffer> {
  const isImage = mimeType.startsWith("image/");

  if (!isImage) {
    // Si ce n'est pas une image (PDF), retourner le buffer original
    return buffer;
  }

  try {
    // Redimensionner si nécessaire (max 2000x2000)
    let sharpInstance = sharp(buffer).resize(2000, 2000, {
      fit: "inside",
      withoutEnlargement: true,
    });

    // Compresser selon le type
    if (mimeType === "image/jpeg" || mimeType === "image/jpg") {
      sharpInstance = sharpInstance.jpeg({
        quality: 85,
        progressive: true,
      });
    } else if (mimeType === "image/png") {
      sharpInstance = sharpInstance.png({
        quality: 85,
        compressionLevel: 9,
      });
    }

    return await sharpInstance.toBuffer();
  } catch (error) {
    console.error("Erreur compression image:", error);
    // En cas d'erreur, retourner le buffer original
    return buffer;
  }
}

/**
 * Obtenir les informations sur un fichier uploadé
 */
export interface UploadedFileInfo {
  filename: string;
  originalFilename: string;
  mimeType: string;
  size: number;
  path: string;
  url: string;
}

/**
 * Formater la taille d'un fichier en format lisible
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}
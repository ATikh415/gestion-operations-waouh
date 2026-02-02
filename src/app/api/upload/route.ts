// src/app/api/upload/route.ts

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { Role } from "@prisma/client";
import fs from "fs/promises";
import path from "path";
import {
  isAllowedMimeType,
  isAllowedExtension,
  generateUniqueFilename,
  getUploadPath,
  ensureUploadDirectory,
  compressImage,
  MAX_FILE_SIZE,
  formatFileSize,
} from "@/lib/upload-utils";

/**
 * POST /api/upload - Upload un fichier
 */
export async function POST(req: NextRequest) {
  try {
    // Vérifier l'authentification
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Non authentifié" },
        { status: 401 }
      );
    }

    // Vérifier le rôle (COMPTABLE ou DIRECTEUR)
    if (
      session.user.role !== Role.COMPTABLE &&
      session.user.role !== Role.DIRECTEUR &&
      session.user.role !== Role.ACHAT
    ) {
      return NextResponse.json(
        { success: false, error: "Accès refusé. Réservé aux comptables." },
        { status: 403 }
      );
    }

    // Récupérer le FormData
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "Aucun fichier fourni" },
        { status: 400 }
      );
    }

    // Vérifier le type MIME
    if (!isAllowedMimeType(file.type)) {
      return NextResponse.json(
        {
          success: false,
          error: "Type de fichier non autorisé. Formats acceptés : PDF, JPEG, PNG",
        },
        { status: 400 }
      );
    }

    // Vérifier l'extension
    if (!isAllowedExtension(file.name)) {
      return NextResponse.json(
        {
          success: false,
          error: "Extension de fichier non autorisée",
        },
        { status: 400 }
      );
    }

    // Vérifier la taille
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          error: `Fichier trop volumineux. Taille maximale : ${formatFileSize(
            MAX_FILE_SIZE
          )}`,
        },
        { status: 400 }
      );
    }

    // Convertir le fichier en Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Compresser si c'est une image
    let processedBuffer: any;
    const originalSize = buffer.length;
    
    if (file.type.startsWith("image/")) {
      processedBuffer = await compressImage(buffer, file.type);
      console.log(
        `Image compressée : ${formatFileSize(originalSize)} → ${formatFileSize(
          processedBuffer.length
        )}`
      );
    }

    // Générer le nom de fichier unique
    const uniqueFilename = generateUniqueFilename(file.name);

    // Obtenir le chemin d'upload (YYYY/MM)
    const uploadPath = getUploadPath();

    // Créer les dossiers si nécessaire
    await ensureUploadDirectory(uploadPath);

    // Chemin complet du fichier
    const fullPath = path.join(
      process.cwd(),
      "public",
      uploadPath,
      uniqueFilename
    );

    // Sauvegarder le fichier
    await fs.writeFile(fullPath, processedBuffer);

    // URL relative (sans /public)
    const fileUrl = `/${uploadPath}/${uniqueFilename}`;

    // Retourner les informations du fichier
    return NextResponse.json({
      success: true,
      data: {
        filename: uniqueFilename,
        originalFilename: file.name,
        mimeType: file.type,
        size: processedBuffer.length,
        originalSize: originalSize,
        url: fileUrl,
        compressed: file.type.startsWith("image/"),
      },
    });
  } catch (error) {
    console.error("Erreur upload:", error);
    return NextResponse.json(
      { success: false, error: "Erreur serveur lors de l'upload" },
      { status: 500 }
    );
  }
}
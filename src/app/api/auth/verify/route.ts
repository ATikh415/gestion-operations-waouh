// src/app/api/auth/verify/route.ts

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

/**
 * Route API pour vérifier les credentials
 * Tourne en Node.js Runtime (pas Edge)
 */

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    console.log("🔐 API Vérification utilisateur:", email);

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email et mot de passe requis" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: { department: true },
    });

    console.log("👤 Utilisateur trouvé:", user ? user.email : "Non trouvé");

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 401 }
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        { error: "Compte désactivé" },
        { status: 401 }
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    console.log("🔑 Mot de passe valide:", isPasswordValid);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Mot de passe incorrect" },
        { status: 401 }
      );
    }

    console.log("✅ Authentification réussie pour:", user.email);

    // Retourner uniquement les données nécessaires
    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      departmentId: user.departmentId,
      departmentName: user.department?.name || null,
    });
  } catch (error) {
    console.error("❌ Erreur lors de l'authentification:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

// Forcer l'utilisation de Node.js runtime (pas Edge)
export const runtime = "nodejs";
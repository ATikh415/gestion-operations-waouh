import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Début du seeding...");

  // 1. Création des paramètres de l'entreprise
  const company = await prisma.companySettings.upsert({
    where: { id: "default-company" },
    update: {},
    create: {
      id: "default-company",
      name: "Waouh Agency",
      address: "Dakar, Sénégal",
      phone: "+221 33 123 45 67",
      email: "contact@waouh.sn",
      currency: "XOF",
    },
  });
  console.log("✅ Paramètres entreprise créés:", company.name);

  // 2. Création des départements
  const departments = [
    { name: "Informatique", code: "IT", description: "Département Informatique et Systèmes" },
    { name: "Logistique", code: "LOG", description: "Département Logistique et Transport" },
    { name: "Ressources Humaines", code: "RH", description: "Département des Ressources Humaines" },
    { name: "Finance", code: "FIN", description: "Département Finance et Comptabilité" },
    { name: "Commercial", code: "COM", description: "Département Commercial et Ventes" },
    { name: "Administration", code: "ADM", description: "Département Administration Générale" },
  ];

  for (const dept of departments) {
    await prisma.department.upsert({
      where: { code: dept.code },
      update: {},
      create: dept,
    });
  }
  console.log("✅ Départements créés:", departments.length);

  // 3. Création du compte DIRECTEUR par défaut
  const hashedPassword = await bcrypt.hash("passer123", 12);

  const directeur = await prisma.user.upsert({
    where: { email: "directeur@waouh.sn" },
    update: {},
    create: {
      email: "directeur@waouh.sn",
      name: "Directeur Général",
      password: hashedPassword,
      role: Role.DIRECTEUR,
      isActive: true,
    },
  });
  console.log("✅ Compte DIRECTEUR créé:", directeur.email);

  // 4. Création des comptes de test (optionnel - pour le développement)
  const adminDept = await prisma.department.findUnique({ where: { code: "ADM" } });
  const itDept = await prisma.department.findUnique({ where: { code: "IT" } });
  const finDept = await prisma.department.findUnique({ where: { code: "FIN" } });

  // Compte ACHAT
  await prisma.user.upsert({
    where: { email: "achat@waouh.sn" },
    update: {},
    create: {
      email: "achat@waouh.sn",
      name: "Responsable Achats",
      password: hashedPassword,
      role: Role.ACHAT,
      departmentId: adminDept?.id,
      isActive: true,
    },
  });
  console.log("✅ Compte ACHAT créé: achat@waouh.sn");

  // Compte COMPTABLE
  await prisma.user.upsert({
    where: { email: "comptable@waouh.sn" },
    update: {},
    create: {
      email: "comptable@waouh.sn",
      name: "Comptable Principal",
      password: hashedPassword,
      role: Role.COMPTABLE,
      departmentId: finDept?.id,
      isActive: true,
    },
  });
  console.log("✅ Compte COMPTABLE créé: comptable@waouh.sn");

  // Compte USER (pour les tests)
  await prisma.user.upsert({
    where: { email: "user@waouh.sn" },
    update: {},
    create: {
      email: "user@waouh.sn",
      name: "Utilisateur Test",
      password: hashedPassword,
      role: Role.USER,
      departmentId: itDept?.id,
      isActive: true,
    },
  });
  console.log("✅ Compte USER créé: user@waouh.sn");

  console.log("\n🎉 Seeding terminé avec succès!");
  console.log("\n📋 Comptes de test disponibles:");
  console.log("   Email: directeur@waouh.sn | Mot de passe: passer123 | Rôle: DIRECTEUR");
  console.log("   Email: achat@waouh.sn     | Mot de passe: passer123 | Rôle: ACHAT");
  console.log("   Email: comptable@waouh.sn | Mot de passe: passer123 | Rôle: COMPTABLE");
  console.log("   Email: user@waouh.sn      | Mot de passe: passer123 | Rôle: USER");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ Erreur lors du seeding:", e);
    await prisma.$disconnect();
    process.exit(1);
  });

import { InternalRequest, User } from "@prisma/client";

/**
 * URL de base de l'application
 */
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

/**
 * Template de base HTML pour les emails
 */
function baseEmailTemplate(content: string): string {
  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Notification</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .container {
          background-color: #f9f9f9;
          border-radius: 8px;
          padding: 30px;
          border: 1px solid #e0e0e0;
        }
        .header {
          background-color: #2563eb;
          color: white;
          padding: 20px;
          border-radius: 8px 8px 0 0;
          text-align: center;
          margin: -30px -30px 20px -30px;
        }
        .content {
          background-color: white;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 20px;
        }
        .info-box {
          background-color: #f0f9ff;
          border-left: 4px solid #2563eb;
          padding: 15px;
          margin: 15px 0;
        }
        .info-row {
          margin: 8px 0;
        }
        .label {
          font-weight: bold;
          color: #555;
        }
        .value {
          color: #333;
        }
        .button {
          display: inline-block;
          padding: 12px 30px;
          background-color: #2563eb;
          color: white;
          text-decoration: none;
          border-radius: 6px;
          margin: 20px 0;
          text-align: center;
        }
        .button:hover {
          background-color: #1d4ed8;
        }
        .footer {
          text-align: center;
          color: #666;
          font-size: 12px;
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid #e0e0e0;
        }
        .status-pending {
          color: #f59e0b;
          font-weight: bold;
        }
        .status-approved {
          color: #10b981;
          font-weight: bold;
        }
        .status-rejected {
          color: #ef4444;
          font-weight: bold;
        }
      </style>
    </head>
    <body>
      <div class="container">
        ${content}
        <div class="footer">
          <p>Cet email a été envoyé automatiquement par le système de gestion des achats.</p>
          <p>Merci de ne pas répondre à cet email.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Formater le montant en XOF
 */
function formatAmount(amount: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "XOF",
    minimumFractionDigits: 0,
  }).format(amount);
}

/**
 * Formater la catégorie en français
 */
function formatCategory(category: string): string {
  const categories: Record<string, string> = {
    INTERNET: "Internet",
    ELECTRICITY: "Électricité",
    WATER: "Eau",
    PHONE: "Téléphone",
    COFFEE: "Café / Thé",
    OFFICE_SUPPLIES: "Fournitures bureau",
    MAINTENANCE: "Maintenance",
    CLEANING: "Nettoyage",
    OTHER: "Autre",
  };
  return categories[category] || category;
}

/**
 * Email 1 : Nouvelle demande créée (ACHAT → DIRECTEUR)
 */
export function newInternalRequestEmail(
  request: InternalRequest & { requestedBy: User },
  directorEmail: string
): { to: string; subject: string; html: string } {
  const requestUrl = `${APP_URL}/internal-requests/${request.id}`;

  const content = `
    <div class="header">
      <h2>📋 Nouvelle demande interne</h2>
    </div>
    <div class="content">
      <p>Bonjour,</p>
      <p>Une nouvelle demande interne nécessite votre validation :</p>
      
      <div class="info-box">
        <div class="info-row">
          <span class="label">Référence :</span>
          <span class="value">${request.reference}</span>
        </div>
        <div class="info-row">
          <span class="label">Titre :</span>
          <span class="value">${request.title}</span>
        </div>
        <div class="info-row">
          <span class="label">Catégorie :</span>
          <span class="value">${formatCategory(request.category)}</span>
        </div>
        <div class="info-row">
          <span class="label">Montant :</span>
          <span class="value">${formatAmount(request.amount)}</span>
        </div>
        <div class="info-row">
          <span class="label">Demandeur :</span>
          <span class="value">${request.requestedBy.name}</span>
        </div>
        ${
          request.description
            ? `
        <div class="info-row">
          <span class="label">Description :</span>
          <span class="value">${request.description}</span>
        </div>
        `
            : ""
        }
      </div>

      <p style="text-align: center;">
        <a href="${requestUrl}" class="button">Consulter la demande</a>
      </p>

      <p>Cordialement,<br>Système de gestion des achats</p>
    </div>
  `;

  return {
    to: directorEmail,
    subject: `Nouvelle demande interne #${request.reference}`,
    html: baseEmailTemplate(content),
  };
}

/**
 * Email 2 : Demande approuvée (DIRECTEUR → ACHAT)
 */
export function approvedInternalRequestEmail(
  request: InternalRequest & { requestedBy: User },
  approver: User,
  comment?: string
): { to: string; subject: string; html: string } {
  const requestUrl = `${APP_URL}/internal-requests/${request.id}`;

  const content = `
    <div class="header">
      <h2>✅ Demande interne approuvée</h2>
    </div>
    <div class="content">
      <p>Bonjour ${request.requestedBy.name},</p>
      <p>Votre demande interne a été <span class="status-approved">approuvée</span> :</p>
      
      <div class="info-box">
        <div class="info-row">
          <span class="label">Référence :</span>
          <span class="value">${request.reference}</span>
        </div>
        <div class="info-row">
          <span class="label">Titre :</span>
          <span class="value">${request.title}</span>
        </div>
        <div class="info-row">
          <span class="label">Montant :</span>
          <span class="value">${formatAmount(request.amount)}</span>
        </div>
        <div class="info-row">
          <span class="label">Approuvé par :</span>
          <span class="value">${approver.name}</span>
        </div>
        ${
          comment
            ? `
        <div class="info-row">
          <span class="label">Commentaire :</span>
          <span class="value">${comment}</span>
        </div>
        `
            : ""
        }
      </div>

      <p>Vous pouvez maintenant finaliser cette demande.</p>

      <p style="text-align: center;">
        <a href="${requestUrl}" class="button">Finaliser la demande</a>
      </p>

      <p>Cordialement,<br>Système de gestion des achats</p>
    </div>
  `;

  return {
    to: request.requestedBy.email,
    subject: `Demande interne #${request.reference} approuvée`,
    html: baseEmailTemplate(content),
  };
}

/**
 * Email 3 : Demande rejetée (DIRECTEUR → ACHAT)
 */
export function rejectedInternalRequestEmail(
  request: InternalRequest & { requestedBy: User },
  rejector: User,
  comment: string
): { to: string; subject: string; html: string } {
  const requestUrl = `${APP_URL}/internal-requests/${request.id}`;

  const content = `
    <div class="header">
      <h2>❌ Demande interne rejetée</h2>
    </div>
    <div class="content">
      <p>Bonjour ${request.requestedBy.name},</p>
      <p>Votre demande interne a été <span class="status-rejected">rejetée</span> :</p>
      
      <div class="info-box">
        <div class="info-row">
          <span class="label">Référence :</span>
          <span class="value">${request.reference}</span>
        </div>
        <div class="info-row">
          <span class="label">Titre :</span>
          <span class="value">${request.title}</span>
        </div>
        <div class="info-row">
          <span class="label">Montant :</span>
          <span class="value">${formatAmount(request.amount)}</span>
        </div>
        <div class="info-row">
          <span class="label">Rejeté par :</span>
          <span class="value">${rejector.name}</span>
        </div>
        <div class="info-row">
          <span class="label">Motif :</span>
          <span class="value">${comment}</span>
        </div>
      </div>

      <p style="text-align: center;">
        <a href="${requestUrl}" class="button">Consulter la demande</a>
      </p>

      <p>Cordialement,<br>Système de gestion des achats</p>
    </div>
  `;

  return {
    to: request.requestedBy.email,
    subject: `Demande interne #${request.reference} rejetée`,
    html: baseEmailTemplate(content),
  };
}
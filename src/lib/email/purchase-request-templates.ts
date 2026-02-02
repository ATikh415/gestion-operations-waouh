
import { RequestStatus, Role } from "@prisma/client";

/**
 * Formater le montant en XOF
 */
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "XOF",
    minimumFractionDigits: 0,
  }).format(amount);
}

/**
 * Template de base pour tous les emails
 */
function getBaseTemplate(title: string, content: string, actionButton?: { text: string; url: string }): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
          }
          .container {
            background: white;
            border-radius: 8px;
            padding: 32px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            padding-bottom: 24px;
            border-bottom: 2px solid #e5e7eb;
          }
          .header h1 {
            margin: 0;
            color: #1f2937;
            font-size: 24px;
          }
          .content {
            padding: 24px 0;
          }
          .info-box {
            background: #f9fafb;
            border-left: 4px solid #3b82f6;
            padding: 16px;
            margin: 16px 0;
            border-radius: 4px;
          }
          .info-box p {
            margin: 8px 0;
          }
          .info-box strong {
            color: #1f2937;
          }
          .button {
            display: inline-block;
            background: #3b82f6;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 500;
            margin: 16px 0;
          }
          .button:hover {
            background: #2563eb;
          }
          .footer {
            text-align: center;
            padding-top: 24px;
            border-top: 1px solid #e5e7eb;
            color: #6b7280;
            font-size: 14px;
          }
          .warning {
            background: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 12px;
            margin: 16px 0;
            border-radius: 4px;
            color: #92400e;
          }
          .success {
            background: #d1fae5;
            border-left: 4px solid #10b981;
            padding: 12px;
            margin: 16px 0;
            border-radius: 4px;
            color: #065f46;
          }
          .danger {
            background: #fee2e2;
            border-left: 4px solid #ef4444;
            padding: 12px;
            margin: 16px 0;
            border-radius: 4px;
            color: #991b1b;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${title}</h1>
          </div>
          <div class="content">
            ${content}
          </div>
          ${
            actionButton
              ? `
            <div style="text-align: center;">
              <a href="${actionButton.url}" class="button">${actionButton.text}</a>
            </div>
          `
              : ""
          }
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
 * 1. Email de soumission (USER → ACHAT)
 */
export function getSubmittedRequestEmail(data: {
  reference: string;
  title: string;
  requesterName: string;
  department: string;
  itemsCount: number;
  totalEstimated: number;
  requestUrl: string;
}): { subject: string; html: string } {
  const content = `
    <p>Bonjour,</p>
    <p>Une nouvelle demande d'achat a été soumise et nécessite votre attention.</p>
    
    <div class="info-box">
      <p><strong>📄 Référence :</strong> ${data.reference}</p>
      <p><strong>📝 Titre :</strong> ${data.title}</p>
      <p><strong>👤 Demandeur :</strong> ${data.requesterName}</p>
      <p><strong>🏢 Département :</strong> ${data.department}</p>
      <p><strong>📦 Articles :</strong> ${data.itemsCount}</p>
      <p><strong>💰 Total estimé :</strong> ${formatCurrency(data.totalEstimated)}</p>
    </div>
    
    <div class="warning">
      <strong>⚠️ Action requise :</strong> Veuillez collecter au moins 2 devis et sélectionner le meilleur avant d'approuver.
    </div>
    
    <p>Merci de traiter cette demande dans les meilleurs délais.</p>
  `;

  return {
    subject: `[NOUVELLE DEMANDE] ${data.reference} - ${data.title}`,
    html: getBaseTemplate(
      "Nouvelle demande d'achat",
      content,
      { text: "Voir la demande", url: data.requestUrl }
    ),
  };
}

/**
 * 2. Email d'approbation ACHAT (ACHAT → DIRECTEUR)
 */
export function getApprovedByAchatEmail(data: {
  reference: string;
  title: string;
  requesterName: string;
  department: string;
  selectedSupplier: string;
  selectedAmount: number;
  quotesCount: number;
  approverName: string;
  comment?: string;
  requestUrl: string;
}): { subject: string; html: string } {
  const content = `
    <p>Bonjour,</p>
    <p>Une demande d'achat a été approuvée par le service Achats et attend votre validation finale.</p>
    
    <div class="info-box">
      <p><strong>📄 Référence :</strong> ${data.reference}</p>
      <p><strong>📝 Titre :</strong> ${data.title}</p>
      <p><strong>👤 Demandeur :</strong> ${data.requesterName}</p>
      <p><strong>🏢 Département :</strong> ${data.department}</p>
      <p><strong>✅ Approuvé par :</strong> ${data.approverName} (Service Achats)</p>
    </div>
    
    <div class="success">
      <p><strong>🏆 Devis sélectionné :</strong></p>
      <p><strong>Fournisseur :</strong> ${data.selectedSupplier}</p>
      <p><strong>Montant :</strong> ${formatCurrency(data.selectedAmount)}</p>
      <p><strong>Nombre de devis comparés :</strong> ${data.quotesCount}</p>
    </div>
    
    ${
      data.comment
        ? `
      <div class="info-box">
        <p><strong>💬 Commentaire :</strong></p>
        <p>${data.comment}</p>
      </div>
    `
        : ""
    }
    
    <div class="warning">
      <strong>⚠️ Action requise :</strong> Veuillez valider ou rejeter cette demande.
    </div>
  `;

  return {
    subject: `[APPROBATION ACHATS] ${data.reference} - ${data.title}`,
    html: getBaseTemplate(
      "Demande approuvée par les Achats",
      content,
      { text: "Valider la demande", url: data.requestUrl }
    ),
  };
}

/**
 * 3a. Email de validation DIRECTEUR (DIRECTEUR → COMPTABLE + USER)
 */
export function getValidatedByDirectorEmail(data: {
  reference: string;
  title: string;
  requesterName: string;
  department: string;
  selectedSupplier: string;
  totalFinal: number;
  validatorName: string;
  comment?: string;
  requestUrl: string;
  recipientRole: "COMPTABLE" | "USER";
}): { subject: string; html: string } {
  const content = `
    <p>Bonjour,</p>
    <p>Une demande d'achat a été validée par la Direction.</p>
    
    <div class="info-box">
      <p><strong>📄 Référence :</strong> ${data.reference}</p>
      <p><strong>📝 Titre :</strong> ${data.title}</p>
      <p><strong>👤 Demandeur :</strong> ${data.requesterName}</p>
      <p><strong>🏢 Département :</strong> ${data.department}</p>
      <p><strong>✅ Validé par :</strong> ${data.validatorName} (Direction)</p>
    </div>
    
    <div class="success">
      <p><strong>✅ DEMANDE VALIDÉE</strong></p>
      <p><strong>Fournisseur retenu :</strong> ${data.selectedSupplier}</p>
      <p><strong>Montant final :</strong> ${formatCurrency(data.totalFinal)}</p>
    </div>
    
    ${
      data.comment
        ? `
      <div class="info-box">
        <p><strong>💬 Commentaire :</strong></p>
        <p>${data.comment}</p>
      </div>
    `
        : ""
    }
    
    ${
      data.recipientRole === "COMPTABLE"
        ? `
      <div class="warning">
        <strong>⚠️ Prochaine étape :</strong> Veuillez ajouter les documents comptables (facture, bon de commande) et finaliser la demande.
      </div>
    `
        : `
      <div class="success">
        <strong>✅ Statut :</strong> Votre demande est en cours de finalisation par le service Comptable.
      </div>
    `
    }
  `;

  return {
    subject: `[VALIDÉE] ${data.reference} - ${data.title}`,
    html: getBaseTemplate(
      "Demande validée par la Direction",
      content,
      { text: "Voir la demande", url: data.requestUrl }
    ),
  };
}

/**
 * 3b. Email de rejet DIRECTEUR (DIRECTEUR → USER + ACHAT)
 */
export function getRejectedByDirectorEmail(data: {
  reference: string;
  title: string;
  requesterName: string;
  department: string;
  rejectorName: string;
  comment: string;
  requestUrl: string;
  recipientRole: "USER" | "ACHAT";
}): { subject: string; html: string } {
  const content = `
    <p>Bonjour,</p>
    <p>Une demande d'achat a été rejetée par la Direction.</p>
    
    <div class="info-box">
      <p><strong>📄 Référence :</strong> ${data.reference}</p>
      <p><strong>📝 Titre :</strong> ${data.title}</p>
      <p><strong>👤 Demandeur :</strong> ${data.requesterName}</p>
      <p><strong>🏢 Département :</strong> ${data.department}</p>
      <p><strong>❌ Rejeté par :</strong> ${data.rejectorName} (Direction)</p>
    </div>
    
    <div class="danger">
      <p><strong>❌ DEMANDE REJETÉE</strong></p>
      <p><strong>💬 Motif du rejet :</strong></p>
      <p>${data.comment}</p>
    </div>
    
    ${
      data.recipientRole === "USER"
        ? `
      <p>Vous pouvez créer une nouvelle demande en tenant compte des remarques.</p>
    `
        : `
      <p>Cette demande ne nécessite plus de traitement de votre part.</p>
    `
    }
  `;

  return {
    subject: `[REJETÉE] ${data.reference} - ${data.title}`,
    html: getBaseTemplate(
      "Demande rejetée par la Direction",
      content,
      { text: "Voir la demande", url: data.requestUrl }
    ),
  };
}

/**
 * 4. Email de finalisation COMPTABLE (COMPTABLE → USER + ACHAT + DIRECTEUR)
 */
export function getFinalizedRequestEmail(data: {
  reference: string;
  title: string;
  requesterName: string;
  department: string;
  selectedSupplier: string;
  totalFinal: number;
  documentsCount: number;
  finalizerName: string;
  requestUrl: string;
}): { subject: string; html: string } {
  const content = `
    <p>Bonjour,</p>
    <p>Une demande d'achat a été finalisée par le service Comptable.</p>
    
    <div class="info-box">
      <p><strong>📄 Référence :</strong> ${data.reference}</p>
      <p><strong>📝 Titre :</strong> ${data.title}</p>
      <p><strong>👤 Demandeur :</strong> ${data.requesterName}</p>
      <p><strong>🏢 Département :</strong> ${data.department}</p>
      <p><strong>✅ Finalisé par :</strong> ${data.finalizerName} (Comptabilité)</p>
    </div>
    
    <div class="success">
      <p><strong>✅ ACHAT FINALISÉ</strong></p>
      <p><strong>Fournisseur :</strong> ${data.selectedSupplier}</p>
      <p><strong>Montant final :</strong> ${formatCurrency(data.totalFinal)}</p>
      <p><strong>Documents ajoutés :</strong> ${data.documentsCount}</p>
    </div>
    
    <p>Le processus d'achat est maintenant <strong>terminé</strong>. Tous les documents sont disponibles dans le système.</p>
  `;

  return {
    subject: `[FINALISÉE] ${data.reference} - ${data.title}`,
    html: getBaseTemplate(
      "Achat finalisé",
      content,
      { text: "Voir la demande", url: data.requestUrl }
    ),
  };
}
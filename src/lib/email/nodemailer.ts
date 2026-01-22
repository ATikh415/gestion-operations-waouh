
import nodemailer from "nodemailer";

/**
 * Configuration du transporteur email avec Nodemailer
 */
export const emailTransporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_PORT === "465", // true pour 465, false pour les autres ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Options par défaut pour tous les emails
 */
export const defaultEmailOptions = {
  from: process.env.SMTP_FROM || process.env.SMTP_USER,
};

/**
 * Vérifier la connexion SMTP
 */
export async function verifyEmailConnection(): Promise<boolean> {
  try {
    await emailTransporter.verify();
    console.log("✅ Connexion email OK");
    return true;
  } catch (error) {
    console.error("❌ Erreur connexion email:", error);
    return false;
  }
}

/**
 * Type pour les options d'envoi d'email
 */
export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

/**
 * Envoyer un email
 */
export async function sendEmail(options: SendEmailOptions): Promise<boolean> {
  try {
    const info = await emailTransporter.sendMail({
      ...defaultEmailOptions,
      to: Array.isArray(options.to) ? options.to.join(", ") : options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, ""), // Fallback texte sans HTML
    });

    console.log("✅ Email envoyé:", info.messageId);
    return true;
  } catch (error) {
    console.error("❌ Erreur envoi email:", error);
    return false;
  }
}
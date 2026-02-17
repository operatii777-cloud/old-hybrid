import nodemailer from 'nodemailer';
import { logger } from '../utils/logger.js';

// Email configuration
const emailConfig = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
};

// Create transporter
let transporter = null;

function getTransporter() {
  if (!transporter && emailConfig.auth.user && emailConfig.auth.pass) {
    transporter = nodemailer.createTransporter(emailConfig);
  }
  return transporter;
}

/**
 * Send email notification
 */
export async function sendEmail({ to, subject, text, html }) {
  try {
    const mailer = getTransporter();
    
    if (!mailer) {
      logger.warn('Email not configured, skipping email notification');
      return { success: false, message: 'Email not configured' };
    }
    
    const info = await mailer.sendMail({
      from: process.env.SMTP_FROM || 'Restaurant Hybrid <noreply@restaurant.com>',
      to,
      subject,
      text,
      html
    });
    
    logger.info(`Email sent: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
    
  } catch (error) {
    logger.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send reservation confirmation email
 */
export async function sendReservationConfirmation(reservation) {
  const { client_name, client_email, date, time, num_people, table_name } = reservation;
  
  if (!client_email) {
    return { success: false, message: 'No email address provided' };
  }
  
  const subject = 'Confirmare Rezervare - Restaurant Hybrid';
  const text = `
Bună ziua ${client_name},

Rezervarea dvs. a fost confirmată cu succes!

Detalii rezervare:
- Data: ${date}
- Ora: ${time}
- Număr persoane: ${num_people}
${table_name ? `- Masă: ${table_name}` : ''}

Vă așteptăm cu drag!

Cu respect,
Echipa Restaurant Hybrid
  `;
  
  const html = `
    <h2>Confirmare Rezervare</h2>
    <p>Bună ziua <strong>${client_name}</strong>,</p>
    <p>Rezervarea dvs. a fost confirmată cu succes!</p>
    <h3>Detalii rezervare:</h3>
    <ul>
      <li><strong>Data:</strong> ${date}</li>
      <li><strong>Ora:</strong> ${time}</li>
      <li><strong>Număr persoane:</strong> ${num_people}</li>
      ${table_name ? `<li><strong>Masă:</strong> ${table_name}</li>` : ''}
    </ul>
    <p>Vă așteptăm cu drag!</p>
    <p>Cu respect,<br><strong>Echipa Restaurant Hybrid</strong></p>
  `;
  
  return await sendEmail({ to: client_email, subject, text, html });
}

/**
 * Send order ready notification
 */
export async function sendOrderReadyEmail({ email, orderNumber, tableNumber }) {
  if (!email) {
    return { success: false, message: 'No email address provided' };
  }
  
  const subject = `Comanda #${orderNumber} este gata!`;
  const text = `Comanda dvs. pentru masa ${tableNumber} este gata și vă așteaptă!`;
  const html = `
    <h2>Comanda dvs. este gata!</h2>
    <p>Comanda <strong>#${orderNumber}</strong> pentru masa <strong>${tableNumber}</strong> este gata și vă așteaptă!</p>
    <p>Poftă bună!</p>
  `;
  
  return await sendEmail({ to: email, subject, text, html });
}

/**
 * Send low stock alert
 */
export async function sendLowStockAlert({ email, items }) {
  if (!email) {
    return { success: false, message: 'No email address provided' };
  }
  
  const subject = 'Alertă Stoc Scăzut - Restaurant Hybrid';
  const itemsList = items.map(item => `- ${item.name}: ${item.currentStock} ${item.unit} (minim: ${item.minStock})`).join('\n');
  const text = `
Alertă stoc scăzut!

Următoarele articole au stoc sub limita minimă:

${itemsList}

Vă rugăm să comandați noi stocuri.
  `;
  
  const htmlItems = items.map(item => `
    <li>${item.name}: <strong>${item.currentStock} ${item.unit}</strong> (minim: ${item.minStock})</li>
  `).join('');
  
  const html = `
    <h2>Alertă Stoc Scăzut</h2>
    <p>Următoarele articole au stoc sub limita minimă:</p>
    <ul>${htmlItems}</ul>
    <p>Vă rugăm să comandați noi stocuri.</p>
  `;
  
  return await sendEmail({ to: email, subject, text, html });
}

/**
 * Test email configuration
 */
export async function testEmailConfig() {
  try {
    const mailer = getTransporter();
    
    if (!mailer) {
      return { success: false, message: 'Email not configured' };
    }
    
    await mailer.verify();
    return { success: true, message: 'Email configuration is valid' };
    
  } catch (error) {
    logger.error('Email configuration test failed:', error);
    return { success: false, error: error.message };
  }
}

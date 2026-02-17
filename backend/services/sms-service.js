import twilio from 'twilio';
import { logger } from '../utils/logger.js';

// Twilio configuration
const twilioConfig = {
  accountSid: process.env.TWILIO_ACCOUNT_SID,
  authToken: process.env.TWILIO_AUTH_TOKEN,
  phoneNumber: process.env.TWILIO_PHONE_NUMBER
};

// Create Twilio client
let twilioClient = null;

function getTwilioClient() {
  if (!twilioClient && twilioConfig.accountSid && twilioConfig.authToken) {
    twilioClient = twilio(twilioConfig.accountSid, twilioConfig.authToken);
  }
  return twilioClient;
}

/**
 * Send SMS notification
 */
export async function sendSMS({ to, message }) {
  try {
    const client = getTwilioClient();
    
    if (!client) {
      logger.warn('SMS not configured, skipping SMS notification');
      return { success: false, message: 'SMS not configured' };
    }
    
    const result = await client.messages.create({
      body: message,
      from: twilioConfig.phoneNumber,
      to: to
    });
    
    logger.info(`SMS sent: ${result.sid}`);
    return { success: true, messageId: result.sid };
    
  } catch (error) {
    logger.error('Error sending SMS:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send reservation confirmation SMS
 */
export async function sendReservationConfirmationSMS(reservation) {
  const { client_name, client_phone, date, time, num_people } = reservation;
  
  if (!client_phone) {
    return { success: false, message: 'No phone number provided' };
  }
  
  const message = `Buna ziua ${client_name}! Rezervarea dvs. la Restaurant Hybrid este confirmata pentru ${date} la ora ${time} pentru ${num_people} persoane. Va asteptam!`;
  
  return await sendSMS({ to: client_phone, message });
}

/**
 * Send reservation reminder SMS
 */
export async function sendReservationReminderSMS(reservation) {
  const { client_name, client_phone, date, time } = reservation;
  
  if (!client_phone) {
    return { success: false, message: 'No phone number provided' };
  }
  
  const message = `Reminder: Aveti o rezervare la Restaurant Hybrid astazi ${date} la ora ${time}. Va asteptam!`;
  
  return await sendSMS({ to: client_phone, message });
}

/**
 * Send order ready SMS
 */
export async function sendOrderReadySMS({ phone, orderNumber, tableNumber }) {
  if (!phone) {
    return { success: false, message: 'No phone number provided' };
  }
  
  const message = `Comanda #${orderNumber} pentru masa ${tableNumber} este gata! Pofta buna!`;
  
  return await sendSMS({ to: phone, message });
}

/**
 * Test SMS configuration
 */
export async function testSMSConfig() {
  try {
    const client = getTwilioClient();
    
    if (!client) {
      return { success: false, message: 'SMS not configured' };
    }
    
    // Verify account by fetching account details
    const account = await client.api.accounts(twilioConfig.accountSid).fetch();
    
    return { 
      success: true, 
      message: 'SMS configuration is valid',
      account: account.friendlyName 
    };
    
  } catch (error) {
    logger.error('SMS configuration test failed:', error);
    return { success: false, error: error.message };
  }
}

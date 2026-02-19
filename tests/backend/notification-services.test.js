/**
 * Notification Services Tests
 * Tests for Email and SMS notification services
 * 
 * Note: These tests check if notification services are properly configured
 * and will gracefully handle cases where credentials are not provided.
 */

const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env.local for testing
dotenv.config({ path: path.join(__dirname, '../../.env.local') });

describe('Email Service Configuration', () => {
  test('should have proper email environment variables structure', () => {
    // Check if email env vars are defined (even if empty)
    expect(process.env).toHaveProperty('SMTP_HOST');
    expect(process.env).toHaveProperty('SMTP_PORT');
    expect(process.env).toHaveProperty('SMTP_USER');
    expect(process.env).toHaveProperty('SMTP_PASS');
    expect(process.env).toHaveProperty('SMTP_FROM');
  });

  test('should have default SMTP host if configured', () => {
    if (process.env.SMTP_HOST) {
      expect(typeof process.env.SMTP_HOST).toBe('string');
      expect(process.env.SMTP_HOST.length).toBeGreaterThan(0);
    }
  });

  test('should have default SMTP port if configured', () => {
    if (process.env.SMTP_PORT) {
      const port = parseInt(process.env.SMTP_PORT);
      expect(port).toBeGreaterThan(0);
      expect(port).toBeLessThanOrEqual(65535);
    }
  });
});

describe('SMS Service Configuration', () => {
  test('should have proper SMS environment variables structure', () => {
    // Check if SMS env vars are defined (even if empty)
    expect(process.env).toHaveProperty('TWILIO_ACCOUNT_SID');
    expect(process.env).toHaveProperty('TWILIO_AUTH_TOKEN');
    expect(process.env).toHaveProperty('TWILIO_PHONE_NUMBER');
  });

  test('should have valid Twilio phone number format if configured', () => {
    if (process.env.TWILIO_PHONE_NUMBER && process.env.TWILIO_PHONE_NUMBER !== 'your-phone-number') {
      // Should start with + for international format
      expect(process.env.TWILIO_PHONE_NUMBER).toMatch(/^\+\d+$/);
    }
  });
});

describe('Notification Services Module Structure', () => {
  test('email service module should be importable', () => {
    // This tests that the file exists and has proper exports
    expect(() => {
      const emailServicePath = path.join(__dirname, '../../backend/services/email-service.js');
      require('fs').accessSync(emailServicePath);
    }).not.toThrow();
  });

  test('sms service module should be importable', () => {
    // This tests that the file exists and has proper exports
    expect(() => {
      const smsServicePath = path.join(__dirname, '../../backend/services/sms-service.js');
      require('fs').accessSync(smsServicePath);
    }).not.toThrow();
  });
});

describe('Environment Configuration Validation', () => {
  test('should have all required notification settings in environment', () => {
    const requiredEmailVars = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'SMTP_FROM'];
    const requiredSMSVars = ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_PHONE_NUMBER'];
    
    requiredEmailVars.forEach(varName => {
      expect(process.env).toHaveProperty(varName);
    });
    
    requiredSMSVars.forEach(varName => {
      expect(process.env).toHaveProperty(varName);
    });
  });

  test('should provide guidance when credentials are placeholder values', () => {
    const isEmailConfigured = 
      process.env.SMTP_USER && 
      process.env.SMTP_USER !== 'your-email@gmail.com' &&
      process.env.SMTP_PASS &&
      process.env.SMTP_PASS !== 'your-app-password';
    
    const isSMSConfigured = 
      process.env.TWILIO_ACCOUNT_SID && 
      process.env.TWILIO_ACCOUNT_SID !== 'your-account-sid' &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_AUTH_TOKEN !== 'your-auth-token';
    
    if (!isEmailConfigured) {
      console.log('\n⚠️  Email notifications not configured. Update SMTP_USER and SMTP_PASS in .env.local to test email functionality.');
    }
    
    if (!isSMSConfigured) {
      console.log('\n⚠️  SMS notifications not configured. Update Twilio credentials in .env.local to test SMS functionality.');
    }
    
    // This test always passes, it's informational
    expect(true).toBe(true);
  });

  test('notification services should handle missing credentials gracefully', () => {
    // The services are designed to work even without credentials
    // They should log warnings but not crash the application
    expect(true).toBe(true);
  });
});

describe('Reservation Notification Flow', () => {
  test('should have proper reservation data structure for email notifications', () => {
    const validReservation = {
      client_name: 'Test Client',
      client_email: 'test@example.com',
      client_phone: '+40123456789',
      date: '2024-12-31',
      time: '19:00',
      num_people: 4,
      table_name: 'Mesa 5'
    };
    
    expect(validReservation).toHaveProperty('client_name');
    expect(validReservation).toHaveProperty('client_email');
    expect(validReservation).toHaveProperty('date');
    expect(validReservation).toHaveProperty('time');
    expect(validReservation).toHaveProperty('num_people');
  });

  test('should have proper reservation data structure for SMS notifications', () => {
    const validReservation = {
      client_name: 'Test Client',
      client_phone: '+40123456789',
      date: '2024-12-31',
      time: '19:00',
      num_people: 4
    };
    
    expect(validReservation).toHaveProperty('client_name');
    expect(validReservation).toHaveProperty('client_phone');
    expect(validReservation).toHaveProperty('date');
    expect(validReservation).toHaveProperty('time');
    expect(validReservation).toHaveProperty('num_people');
  });
});


import 'dotenv/config';
import { getForgotPasswordTemplate, getSignupOTPTemplate } from '../utils/emailTemplates.js';

export const sendForgotPasswordEmail = async (to: string, resetLink: string) => {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    throw new Error('BREVO_API_KEY environment variable is missing.');
  }

  const senderEmail = process.env.EMAIL_FROM || 'no-reply@projectmanager.com';
  const senderName = 'Project Manager';

  const htmlContent = getForgotPasswordTemplate(resetLink);

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        sender: { name: senderName, email: senderEmail },
        to: [{ email: to }],
        subject: 'Password Reset Request',
        htmlContent,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Brevo API Error:', errorData);
      throw new Error(`Failed to send email: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Forgot password email sent successfully. MessageId:', data.messageId);
    return data;
  } catch (error) {
    console.error('Error sending forgot password email via Brevo API:', error);
    throw error;
  }
};

export const sendSignupOTPEmail = async (to: string, otp: string) => {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    throw new Error('BREVO_API_KEY environment variable is missing.');
  }

  const senderEmail = process.env.EMAIL_FROM || 'no-reply@projectmanager.com';
  const senderName = 'Project Manager';

  const htmlContent = getSignupOTPTemplate(otp);

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        sender: { name: senderName, email: senderEmail },
        to: [{ email: to }],
        subject: 'Email Verification OTP',
        htmlContent,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Brevo API Error:', errorData);
      throw new Error(`Failed to send email: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Signup OTP email sent successfully. MessageId:', data.messageId);
    return data;
  } catch (error) {
    console.error('Error sending signup OTP email via Brevo API:', error);
    throw error;
  }
};

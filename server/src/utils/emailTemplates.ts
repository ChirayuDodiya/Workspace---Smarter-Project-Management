export const getForgotPasswordTemplate = (resetLink: string): string => `
  <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background-color: #121212; color: #ffffff;">
    <div style="background-color: #181818; border: 1px solid #27272a; border-radius: 16px; padding: 40px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">Workspace</h1>
      </div>
      <h2 style="color: #ffffff; font-size: 20px; margin-top: 0; margin-bottom: 16px; text-align: center;">Password Reset</h2>
      <p style="color: #a1a1aa; font-size: 14px; line-height: 1.6; text-align: center; margin-bottom: 30px;">
        You requested to reset your password. Click the button below to securely set a new password. This link is valid for 1 hour.
      </p>
      <div style="text-align: center; margin-bottom: 30px;">
        <a href="${resetLink}" style="display: inline-block; padding: 12px 24px; background-color: #045c22; color: #ffffff; font-size: 14px; font-weight: 600; text-decoration: none; border-radius: 8px;">Reset Password</a>
      </div>
      <p style="color: #52525b; font-size: 12px; line-height: 1.5; text-align: center; margin: 0;">
        If you did not request a password reset, you can safely ignore this email.
      </p>
    </div>
    <div style="text-align: center; margin-top: 20px;">
      <p style="color: #52525b; font-size: 12px;">&copy; ${new Date().getFullYear()} Workspace. All rights reserved.</p>
    </div>
  </div>
`;

export const getSignupOTPTemplate = (otp: string): string => `
  <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background-color: #121212; color: #ffffff;">
    <div style="background-color: #181818; border: 1px solid #27272a; border-radius: 16px; padding: 40px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">Workspace</h1>
      </div>
      <h2 style="color: #ffffff; font-size: 20px; margin-top: 0; margin-bottom: 16px; text-align: center;">Verify Your Email</h2>
      <p style="color: #a1a1aa; font-size: 14px; line-height: 1.6; text-align: center; margin-bottom: 30px;">
        Thank you for signing up! Please use the following 6-digit verification code to complete your registration. This code is valid for 10 minutes.
      </p>
      <div style="text-align: center; margin-bottom: 30px;">
        <div style="display: inline-block; padding: 16px 32px; background-color: #011408; border: 1px solid #045c22; border-radius: 12px;">
          <h1 style="letter-spacing: 8px; color: #10b981; font-size: 32px; margin: 0; text-align: center;">${otp}</h1>
        </div>
      </div>
      <p style="color: #52525b; font-size: 12px; line-height: 1.5; text-align: center; margin: 0;">
        If you did not attempt to sign up, please ignore this email.
      </p>
    </div>
    <div style="text-align: center; margin-top: 20px;">
      <p style="color: #52525b; font-size: 12px;">&copy; ${new Date().getFullYear()} Workspace. All rights reserved.</p>
    </div>
  </div>
`;

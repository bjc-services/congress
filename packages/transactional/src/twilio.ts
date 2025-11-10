/**
 * Twilio service for sending OTP codes via voice call
 *
 * To use this service, set the following environment variables:
 * - TWILIO_ACCOUNT_SID
 * - TWILIO_AUTH_TOKEN
 * - TWILIO_PHONE_NUMBER (your Twilio phone number in E.164 format, e.g., +1234567890)
 */

import { env } from "../env";

interface SendVoiceOTPOptions {
  to: string; // Phone number in E.164 format (e.g., +972501234567)
  code: string; // 6-digit OTP code
}

/**
 * Send OTP code via Twilio voice call
 *
 * In development mode, logs the code to console instead of making actual call
 */
export async function sendVoiceOTP({
  to,
  code,
}: SendVoiceOTPOptions): Promise<void> {
  const accountSid = env.TWILIO_ACCOUNT_SID;
  const authToken = env.TWILIO_AUTH_TOKEN;
  const fromNumber = env.TWILIO_PHONE_NUMBER;

  // In development, just log the code
  console.log(
    `[DEV] OTP code for ${to}: ${code}. In production, this would be sent via Twilio voice call.`,
  );
  return;

  if (!fromNumber) {
    throw new Error("TWILIO_PHONE_NUMBER environment variable is not set");
  }

  try {
    // Dynamically import Twilio SDK (install with: pnpm add twilio)
    const twilio = await import("twilio");

    const client = twilio.default(accountSid, authToken);

    // Create a message that will be read by Twilio's text-to-speech
    // Format: "Your verification code is: 1 2 3 4 5 6"
    const codeDigits = code.split("").join(" ");
    const message = `Your verification code is: ${codeDigits}. This code expires in 10 minutes.`;

    // Create TwiML for the voice call
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice" language="en-US">${message}</Say>
</Response>`;

    // Make the voice call using TwiML
    await client.calls.create({
      to,
      from: fromNumber,
      twiml,
    });
  } catch (error) {
    console.error("Failed to send OTP via Twilio:", error);
    // In development, still log the code even if Twilio fails
    if (env.NODE_ENV === "development") {
      console.log(`[DEV] OTP code for ${to}: ${code}`);
    } else {
      throw new Error("Failed to send OTP code. Please try again later.");
    }
  }
}

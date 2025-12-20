export async function sendInviteEmail(email, inviteCode, inviterName, inviterEmail, env) {
  console.log('[Email] Sending invite to:', email);
  console.log('[Email] Invite code:', inviteCode);
  console.log('[Email] Sender email:', inviterEmail);
  console.log('[Email] Frontend URL:', env.FRONTEND_URL);
  
  const inviteUrl = `${env.FRONTEND_URL}/invite/${inviteCode}`;
  
  const emailContent = {
    personalizations: [
      {
        to: [{ email }]
      }
    ],
    from: {
      email: inviterEmail,
      name: inviterName
    },
    subject: `${inviterName} invited you to join PX Tester`,
    content: [
      {
        type: 'text/plain',
        value: `Hi there!

${inviterName} has invited you to join PX Tester - a curated showcase of exceptional web design and development.

Click the link below to accept your invitation:
${inviteUrl}

This invitation will expire in 7 days.

Best regards,
The PX Tester Team`
      },
      {
        type: 'text/html',
        value: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">You're Invited!</h1>
  </div>
  
  <div style="background: #ffffff; padding: 40px 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
    <p style="font-size: 16px; margin-bottom: 20px;">Hi there!</p>
    
    <p style="font-size: 16px; margin-bottom: 20px;">
      <strong>${inviterName}</strong> has invited you to join <strong>PX Tester</strong> - a curated showcase of exceptional web design and development.
    </p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${inviteUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">Accept Invitation</a>
    </div>
    
    <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
      This invitation will expire in 7 days.
    </p>
    
    <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">
      If the button doesn't work, copy and paste this link into your browser:<br>
      <a href="${inviteUrl}" style="color: #667eea; word-break: break-all;">${inviteUrl}</a>
    </p>
  </div>
  
  <div style="text-align: center; margin-top: 20px; padding: 20px; color: #9ca3af; font-size: 12px;">
    <p>© ${new Date().getFullYear()} PX Tester. All rights reserved.</p>
  </div>
</body>
</html>`
      }
    ]
  };

  try {
    console.log('[Email] Sending to MailChannels API...');
    const response = await fetch('https://api.mailchannels.net/tx/v1/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(emailContent)
    });

    console.log('[Email] MailChannels response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Email] MailChannels error response:', errorText);
      throw new Error(`Failed to send email: ${response.status} - ${errorText}`);
    }

    const responseData = await response.text();
    console.log('[Email] MailChannels success response:', responseData);
    console.log('[Email] Email sent successfully to:', email);

    return { success: true };
  } catch (error) {
    console.error('[Email] Email send error:', error.message);
    console.error('[Email] Full error:', error);
    throw error;
  }
}

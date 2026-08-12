// Server-only. Sends the account-setup link via Resend.
//
// NOTE: Resend's sandbox sender (onboarding@resend.dev) can only deliver to
// the email address the Resend account itself was signed up with, until a
// domain is verified at resend.com/domains. Until then, this only reaches
// that one test address — real invites to teammates need domain verification.

import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendAccountSetupEmail({
  to, name, setupLink, role, department,
}: {
  to: string
  name: string
  setupLink: string
  role: string
  department: string | null
}) {
  try {
    const { error } = await resend.emails.send({
      from: 'PMT <onboarding@resend.dev>', // swap for a verified domain sender once one exists
      to,
      subject: "You've been added to PMT",
      html: `
        <div style="font-family:Arial,sans-serif;padding:24px;max-width:480px;">
          <h2 style="margin-bottom:4px;">Welcome to PMT</h2>
          <p>Hi ${name},</p>
          <p>You've been added as a <b>${role}</b>${department ? ` in <b>${department}</b>` : ''}.</p>
          <p>
            <a href="${setupLink}" style="background:#0F5C4E;color:#fff;padding:10px 18px;text-decoration:none;border-radius:6px;display:inline-block;">
              Set your password &amp; sign in
            </a>
          </p>
          <p style="color:#8B9089;font-size:12px;">This link expires after a while — if it doesn't work, ask an admin to resend it.</p>
        </div>
      `,
    })
    if (error) {
      console.error('Resend returned an error:', error)
      return { success: false, error: error.message }
    }
    return { success: true }
  } catch (err) {
    console.error('Failed to send account-setup email via Resend:', err)
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}
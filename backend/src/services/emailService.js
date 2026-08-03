import nodemailer from 'nodemailer';

export const sendRecoveryEmail = async ({ to, name, resetLink }) => {
  const host = process.env.EMAIL_HOST || 'smtp.gmail.com';
  const port = Number(process.env.EMAIL_PORT) || 587;
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  console.log(`[EMAIL] Generando enlace de recuperación para ${to}: ${resetLink}`);

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Recuperación de Contraseña - PrestamosLeoWEB</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #FAF8F5; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #2C221E;">
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed; background-color: #FAF8F5; padding: 40px 10px;">
        <tr>
          <td align="center">
            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 580px; background-color: #FFFFFF; border-radius: 20px; border: 1px solid #E6DCD2; box-shadow: 0 10px 25px rgba(44, 34, 30, 0.05); overflow: hidden;">
              <!-- Header Banner -->
              <tr>
                <td style="background: linear-gradient(135deg, #2C221E 0%, #3D2F2A 100%); padding: 32px 40px; text-align: center;">
                  <div style="display: inline-block; background: linear-gradient(135deg, #D96B27 0%, #E89D4F 100%); width: 48px; height: 48px; border-radius: 14px; line-height: 48px; text-align: center; color: #FFFFFF; font-size: 24px; font-weight: bold; margin-bottom: 12px; box-shadow: 0 4px 12px rgba(217, 107, 39, 0.3);">
                    💳
                  </div>
                  <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #FFFFFF; letter-spacing: -0.5px;">
                    Prestamos<span style="color: #D96B27;">Leo</span>
                  </h1>
                  <p style="margin: 6px 0 0 0; font-size: 13px; color: #E6DCD2; font-weight: 500;">
                    Sistema de Gestión de Préstamos (S/.)
                  </p>
                </td>
              </tr>

              <!-- Body Content -->
              <tr>
                <td style="padding: 40px; text-align: left;">
                  <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 700; color: #2C221E;">
                    Solicitud de Recuperación de Contraseña
                  </h2>
                  
                  <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: #524641;">
                    Hola, <strong>${name || 'Usuario'}</strong> 👋
                  </p>

                  <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.6; color: #524641;">
                    Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en <strong>PrestamosLeoWEB</strong>. Haz clic en el siguiente botón para crear una nueva contraseña segura:
                  </p>

                  <!-- CTA Button -->
                  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 28px;">
                    <tr>
                      <td align="center">
                        <a href="${resetLink}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #D96B27 0%, #E89D4F 100%); color: #FFFFFF; text-decoration: none; font-size: 15px; font-weight: 700; padding: 14px 32px; border-radius: 14px; box-shadow: 0 4px 14px rgba(217, 107, 39, 0.35);">
                          Restablecer mi Contraseña
                        </a>
                      </td>
                    </tr>
                  </table>

                  <!-- Notice Box -->
                  <div style="background-color: #FDF3ED; border-left: 4px solid #D96B27; border-radius: 8px; padding: 14px 18px; margin-bottom: 24px;">
                    <p style="margin: 0; font-size: 13px; line-height: 1.5; color: #7A350C;">
                      ⏱️ <strong>Importante:</strong> Este enlace de recuperación expirará en <strong>1 hora</strong> por motivos de seguridad.
                    </p>
                  </div>

                  <p style="margin: 0 0 20px 0; font-size: 13px; line-height: 1.5; color: #82756E;">
                    Si no solicitaste restablecer tu contraseña, puedes ignorar este correo de forma segura. Tu contraseña actual no sufrirá ningún cambio.
                  </p>

                  <div style="border-top: 1px solid #E6DCD2; padding-top: 20px; text-align: left;">
                    <p style="margin: 0; font-size: 12px; color: #2D7A5D; font-weight: 600;">
                      🔒 Conexión Segura & Protegida — PrestamosLeoWEB
                    </p>
                  </div>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color: #FAF8F5; border-top: 1px solid #E6DCD2; padding: 20px 40px; text-align: center;">
                  <p style="margin: 0; font-size: 12px; color: #82756E;">
                    PrestamosLeoWEB ©2026. Todos los derechos reservados.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  if (!user || !pass) {
    console.warn('⚠️ EMAIL_USER o EMAIL_PASS no están configurados en .env. El correo no fue enviado por SMTP pero el enlace fue registrado en la consola.');
    return { sent: false, link: resetLink };
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });

    const mailOptions = {
      from: `"PrestamosLeo Soporte" <${user}>`,
      to,
      subject: '🔑 Recuperación de Contraseña - PrestamosLeoWEB',
      html: htmlContent,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Correo de recuperación enviado a ${to}: ${info.messageId}`);
    return { sent: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error enviando correo por SMTP:', error.message);
    return { sent: false, error: error.message, link: resetLink };
  }
};

import nodemailer from 'nodemailer';

// Simulate a database or Redis for MVP (In-memory storage)
if (!global.verificationCodes) {
  global.verificationCodes = new Map();
}

export async function POST(request) {
  try {
    const { email, name } = await request.json();

    if (!email) {
      return Response.json({ error: 'Email required' }, { status: 400 });
    }

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store it in memory with an expiration time (10 minutes)
    global.verificationCodes.set(email, {
      code,
      expires: Date.now() + 10 * 60 * 1000
    });

    // Configure Nodemailer with Gmail SMTP
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_SERVER_USER,
        pass: process.env.EMAIL_SERVER_PASSWORD,
      },
    });

    // Send the email
    const mailOptions = {
      from: `"DropX AI" <${process.env.EMAIL_SERVER_USER}>`,
      to: email,
      subject: 'Code de vérification - DropX AI',
      html: `
        <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px;">
          <h2>Bienvenue sur DropX AI, ${name || ''} !</h2>
          <p>Voici votre code de vérification pour créer votre compte :</p>
          <div style="background-color: #f4f4f4; padding: 20px; border-radius: 10px; font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px auto; width: fit-content;">
            ${code}
          </div>
          <p>Ce code expire dans 10 minutes.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    return Response.json({ success: true, message: 'Code envoyé' });
  } catch (error) {
    console.error('Error sending email:', error);
    return Response.json({ error: 'Erreur lors de l\'envoi du code' }, { status: 500 });
  }
}

import nodemailer from 'nodemailer'

// Test SMTP configuration
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

async function testEmail() {
  console.log('Testing SMTP configuration...')
  console.log('Host:', process.env.SMTP_HOST)
  console.log('Port:', process.env.SMTP_PORT)
  console.log('User:', process.env.SMTP_USER)
  console.log('Pass:', process.env.SMTP_PASS ? '***set***' : 'NOT SET')
  console.log('---')

  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.error('❌ SMTP credentials not set!')
    process.exit(1)
  }

  try {
    console.log('Verifying SMTP connection...')
    await transporter.verify()
    console.log('✅ SMTP connection successful!')

    console.log('Sending test email...')
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: 'test@example.com',
      subject: 'Test Email',
      html: '<h1>If you see this, emails work!</h1>',
    })

    console.log('✅ Test email sent:', info.messageId)
  } catch (err) {
    console.error('❌ Error:', err.message)
    process.exit(1)
  }
}

testEmail()

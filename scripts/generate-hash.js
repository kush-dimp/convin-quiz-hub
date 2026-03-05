import bcryptjs from 'bcryptjs'

// Generate bcrypt hash for password "admin123"
async function generateHash() {
  const password = 'admin123'
  const hash = await bcryptjs.hash(password, 12)
  console.log('Password: admin123')
  console.log('Bcrypt Hash:')
  console.log(hash)
  console.log('\nUse this hash in add-password-hash.sql')
}

generateHash().catch(console.error)

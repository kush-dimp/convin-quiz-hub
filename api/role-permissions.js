import { sql } from './_db.js'

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json')

  if (req.method === 'PUT') {
    // Replace role permissions for system roles
    const { permissions, rolePermissions } = req.body
    // Upsert permission definitions
    for (const p of permissions ?? []) {
      await sql`
        INSERT INTO permissions (id, label) VALUES (${p.id}, ${p.label})
        ON CONFLICT (id) DO UPDATE SET label = ${p.label}
      `
    }
    // Delete and re-insert role_permissions
    if (rolePermissions && rolePermissions.length > 0) {
      const roles = [...new Set(rolePermissions.map(r => r.role))]
      for (const role of roles) {
        await sql`DELETE FROM role_permissions WHERE role = ${role}`
      }
      for (const r of rolePermissions) {
        await sql`
          INSERT INTO role_permissions (role, permission) VALUES (${r.role}, ${r.permission})
          ON CONFLICT DO NOTHING
        `
      }
    }
    return res.status(200).json({ ok: true })
  }

  res.status(405).json({ error: 'Method not allowed' })
}

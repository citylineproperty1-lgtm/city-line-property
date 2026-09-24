import { PrismaClient } from '@prisma/client'
const db = new PrismaClient()
async function main() {
  const leads = await db.lead.findMany({ where: { source: 'DETAIL_UNLOCK' }, orderBy: { createdAt: 'desc' }, take: 3 })
  console.log('DETAIL_UNLOCK leads:', leads.length)
  for (const l of leads) console.log(JSON.stringify({ id: l.id, name: l.name, phone: l.phone, message: l.message.slice(0, 90), propertyId: l.propertyId }))
}
main().finally(() => db.$disconnect())

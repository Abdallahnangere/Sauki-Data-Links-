import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting seed...')
  
  // 1. Wipe existing data
  await prisma.transaction.deleteMany()
  await prisma.product.deleteMany()
  await prisma.dataPlan.deleteMany()
  console.log('Database wiped.')

  // 2. Seed Permanent MTN Plan
  await prisma.dataPlan.create({
    data: {
      network: 'MTN',
      data: '1GB',
      validity: '30 Days',
      price: 300, 
      planId: 1001, // Amigo ID for MTN 1GB
    },
  })

  // 3. Seed Example Product
  await prisma.product.create({
    data: {
      name: 'Test MTN Router',
      description: 'High speed 5G router with backup battery',
      price: 25000,
      image: 'https://placehold.co/400x400/png?text=Router',
      inStock: true,
    },
  })

  console.log('Seeding completed.')
}

main()
  .catch((e) => {
    console.error(e)
    ;(process as any).exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
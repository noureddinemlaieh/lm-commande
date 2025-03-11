import { PrismaClient, ProductCategory } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Créer quelques produits de test
  const products = [
    {
      name: 'Installation électrique',
      description: 'Installation complète du système électrique',
      cost: 100,
      sellingPrice: 150,
      unit: 'h',
      category: ProductCategory.SERVICE
    },
    {
      name: 'Plomberie',
      description: 'Services de plomberie',
      cost: 80,
      sellingPrice: 120,
      unit: 'h',
      category: ProductCategory.SERVICE
    },
    {
      name: 'Peinture',
      description: 'Service de peinture',
      cost: 50,
      sellingPrice: 75,
      unit: 'm²',
      category: ProductCategory.SERVICE
    }
  ]

  for (const product of products) {
    await prisma.product.create({
      data: product
    })
  }

  console.log('Produits de test créés avec succès')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 
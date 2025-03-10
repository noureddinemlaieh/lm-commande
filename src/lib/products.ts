import { prisma } from './prisma'
import { ProductCategory } from '@prisma/client'

export async function getProducts() {
  try {
    const products = await prisma.product.findMany({
      where: {
        category: ProductCategory.SERVICE
      },
      orderBy: {
        name: 'asc'
      }
    })
    return products
  } catch (error) {
    console.error('Erreur lors de la récupération des produits:', error)
    return []
  }
} 
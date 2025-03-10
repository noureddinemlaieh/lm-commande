import { prisma } from './prisma'

export async function getPrestations() {
  try {
    const prestations = await prisma.prestation.findMany({
      orderBy: {
        nom: 'asc'
      }
    })
    return prestations
  } catch (error) {
    console.error('Erreur lors de la récupération des prestations:', error)
    return []
  }
} 
import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;

  try {
     const service = await prisma.catalogService.findUnique({    
      where: { id: id as string },
      include: {
        materials: true
      }
    });

    if (!service) {
      return res.status(404).json({ error: 'Service non trouvé' });
    }

    return res.status(200).json(service);
  } catch (error) {
    console.error('Error fetching service:', error);
    return res.status(500).json({ error: 'Erreur lors de la récupération du service' });
  }
} 
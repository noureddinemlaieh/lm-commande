import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  const catalogId = searchParams.get('catalogId');

  if (!query) {
    return NextResponse.json({ services: [] });
  }

  const services = await prisma.catalogService.findMany({
    where: {
      AND: [
        {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
          ],
        },
        {
          category: {
            catalogId: catalogId || undefined
          }
        }
      ]
    },
    include: {
      materials: true,
      category: true
    }
  });

  return NextResponse.json({ services });
} 
import { NextRequest, NextResponse } from 'next/server';
import  prisma  from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'ID manquant' }, { status: 400 });
    }
    
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      select: { id: true }
    });
    
    return NextResponse.json({ exists: !!invoice });
  } catch (error) {
    console.error('Erreur lors de la vérification de la facture:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
} 
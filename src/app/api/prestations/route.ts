import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { ProductCategory } from "@prisma/client";

export async function GET() {
  try {
    const prestations = await prisma.product.findMany({
      where: {
        category: ProductCategory.SERVICE
      },
      orderBy: {
        name: 'asc'
      }
    });
    
    return NextResponse.json(prestations);
  } catch (error) {
    console.error("Erreur lors de la récupération des prestations:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des prestations" },
      { status: 500 }
    );
  }
} 
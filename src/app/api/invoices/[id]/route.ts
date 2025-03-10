import { NextRequest, NextResponse } from 'next/server';
import  prisma  from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log("Tentative de récupération de la facture:", params.id);
    
    // Récupérer la facture avec toutes les relations nécessaires
    const invoice = await prisma.invoice.findUnique({
      where: {
        id: params.id,
      },
      include: {
        client: {
          include: {
            prescriber: true, // Inclure le prescripteur associé au client
          },
        },
        sections: {
          include: {
            items: {
              include: {
                materials: true,
              },
            },
          },
        },
        retentionGuarantee: true,
        devis: true,
      },
    });
    
    if (!invoice) {
      console.log("Facture non trouvée:", params.id);
      return NextResponse.json({ error: 'Facture non trouvée' }, { status: 404 });
    }
    
    // Construire la réponse avec les dates formatées correctement
    const response = {
      ...invoice,
      createdAt: invoice.createdAt.toISOString(),
      invoiceDate: (invoice as any).invoiceDate 
        ? (invoice as any).invoiceDate.toISOString() 
        : invoice.createdAt.toISOString(),
      dueDate: (invoice as any).dueDate ? (invoice as any).dueDate.toISOString() : null,
    };
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Erreur détaillée:', error);
    return NextResponse.json({ 
      error: 'Erreur serveur', 
      message: String(error)
    }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json();
    console.log("Données reçues pour mise à jour:", JSON.stringify(data, null, 2));
    
    // Extraire les sections, la retenue de garantie et les IDs de relation
    const { sections, clientId, devisId, updatedAt, retentionGuarantee, ...otherData } = data;
    
    // Préparer les données de base pour la mise à jour
    const updateData: any = {
      ...otherData,
      // Convertir les chaînes de date en objets Date
      invoiceDate: otherData.invoiceDate ? new Date(otherData.invoiceDate) : undefined,
      dueDate: otherData.dueDate ? new Date(otherData.dueDate) : undefined,
      // Ne pas inclure updatedAt s'il est géré automatiquement
      client: clientId ? { connect: { id: clientId } } : undefined,
      devis: devisId ? { connect: { id: devisId } } : undefined,
    };
    
    // Supprimer les propriétés qui ne peuvent pas être directement mises à jour
    delete updateData.id;
    delete updateData.createdAt;
    
    console.log("Données préparées pour mise à jour:", JSON.stringify(updateData, null, 2));
    
    // Gérer la retenue de garantie
    if (retentionGuarantee) {
      try {
        // Vérifier si une retenue existe déjà pour cette facture
        const existingRetention = await prisma.retentionGuarantee.findFirst({
          where: { invoiceId: params.id }
        });
        
        if (existingRetention) {
          if (retentionGuarantee.rate && retentionGuarantee.amount) {
            // Mettre à jour la retenue existante
            await prisma.retentionGuarantee.update({
              where: { id: existingRetention.id },
              data: {
                rate: retentionGuarantee.rate,
                amount: retentionGuarantee.amount,
                releaseDate: retentionGuarantee.releaseDate ? new Date(retentionGuarantee.releaseDate) : null,
                notes: retentionGuarantee.notes,
                status: retentionGuarantee.status || 'PENDING'
              }
            });
            
            console.log("Retenue de garantie mise à jour:", {
              id: existingRetention.id,
              rate: retentionGuarantee.rate,
              amount: retentionGuarantee.amount
            });
          } else {
            // Supprimer la retenue si elle n'est plus nécessaire
            await prisma.retentionGuarantee.delete({
              where: { id: existingRetention.id }
            });
            
            console.log("Retenue de garantie supprimée:", existingRetention.id);
          }
        } else if (retentionGuarantee.rate && retentionGuarantee.amount) {
          // Créer une nouvelle retenue
          await prisma.retentionGuarantee.create({
            data: {
              invoiceId: params.id,
              rate: retentionGuarantee.rate,
              amount: retentionGuarantee.amount,
              releaseDate: retentionGuarantee.releaseDate ? new Date(retentionGuarantee.releaseDate) : null,
              status: retentionGuarantee.status || 'PENDING',
              notes: retentionGuarantee.notes || ''
            }
          });
          
          console.log("Nouvelle retenue de garantie créée pour la facture:", params.id);
        }
      } catch (retentionError) {
        console.error("Erreur lors de la gestion de la retenue de garantie:", retentionError);
        // Continuer avec la mise à jour de la facture même si la gestion de la retenue échoue
      }
    }
    
    // Mise à jour en deux étapes: d'abord la facture principale
    const updatedInvoice = await prisma.invoice.update({
      where: { id: params.id },
      data: updateData,
      include: {
        client: true,
        devis: true,
        sections: {
          include: {
            items: {
              include: {
                materials: true
              }
            }
          }
        }
      }
    });
    
    // Si des sections sont fournies, les mettre à jour séparément
    if (sections && Array.isArray(sections)) {
      // Supprimer toutes les sections existantes
      await prisma.invoiceSection.deleteMany({
        where: { invoiceId: params.id }
      });
      
      // Créer les nouvelles sections
      for (const section of sections) {
        const { items, isDirectMode, ...sectionData } = section;
        
        const newSection = await prisma.invoiceSection.create({
          data: {
            ...sectionData,
            invoiceId: params.id,
            items: {
              create: items.map((item: any) => {
                const { materials, ...itemData } = item;
                
                return {
                  ...itemData,
                  materials: materials && materials.length > 0 ? {
                    create: materials.map((material: any) => ({
                      ...material
                    }))
                  } : undefined
                };
              })
            }
          },
        });
      }
    }
    
    // Récupérer la facture mise à jour avec toutes ses relations
    const finalInvoice = await prisma.invoice.findUnique({
      where: { id: params.id },
      include: {
        client: true,
        retentionGuarantee: true,
        sections: {
          include: {
            items: {
              include: {
                materials: true
              }
            }
          }
        }
      }
    });
    
    return NextResponse.json(finalInvoice);
  } catch (error) {
    console.error('Erreur détaillée lors de la mise à jour:', error);
    return NextResponse.json(
      { 
        error: 'Erreur lors de la mise à jour de la facture', 
        details: String(error),
        stack: (error as Error).stack
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.invoice.delete({
      where: {
        id: params.id
      }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur lors de la suppression de la facture:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression de la facture' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json();
    
    // Mise à jour partielle de la facture
    const updatedInvoice = await prisma.invoice.update({
      where: {
        id: params.id
      },
      data: {
        // Mettre à jour uniquement les champs fournis
        ...(data.notes !== undefined && { notes: data.notes }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.paymentStatus !== undefined && { paymentStatus: data.paymentStatus }),
      }
    });
    
    return NextResponse.json(updatedInvoice);
  } catch (error) {
    console.error('Erreur lors de la mise à jour partielle:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
} 
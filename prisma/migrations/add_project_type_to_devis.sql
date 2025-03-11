-- Ajouter la colonne projectType à la table Devis
ALTER TABLE "Devis" ADD COLUMN "projectType" TEXT DEFAULT 'AUTRE';

-- Créer un index sur la colonne projectType
CREATE INDEX "Devis_projectType_idx" ON "Devis"("projectType"); 
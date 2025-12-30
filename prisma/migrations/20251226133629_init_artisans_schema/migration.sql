-- CreateTable
CREATE TABLE "artisans" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "region" TEXT NOT NULL,
    "departement" TEXT NOT NULL,
    "commune" TEXT NOT NULL,
    "quartier" TEXT NOT NULL,
    "filiere" TEXT NOT NULL,
    "metier" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "telephone" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "artisans_region_idx" ON "artisans"("region");

-- CreateIndex
CREATE INDEX "artisans_departement_idx" ON "artisans"("departement");

-- CreateIndex
CREATE INDEX "artisans_filiere_idx" ON "artisans"("filiere");

-- CreateIndex
CREATE INDEX "artisans_metier_idx" ON "artisans"("metier");

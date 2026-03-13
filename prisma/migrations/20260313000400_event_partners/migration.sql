-- CreateTable
CREATE TABLE "EventPartner" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "logoUrl" TEXT NOT NULL,
    "website" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "EventPartner_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EventPartner_eventId_order_idx" ON "EventPartner"("eventId", "order");

-- AddForeignKey
ALTER TABLE "EventPartner" ADD CONSTRAINT "EventPartner_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

/*
  Warnings:

  - A unique constraint covering the columns `[userId,serviceId]` on the table `auth_sessions` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "auth_sessions_userId_serviceId_key" ON "auth_sessions"("userId", "serviceId");

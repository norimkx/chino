-- CreateTable
CREATE TABLE "GiftCode" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GiftCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GiftCodeChannel" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "baseUrl" TEXT NOT NULL,

    CONSTRAINT "GiftCodeChannel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "XMessage" (
    "id" SERIAL NOT NULL,
    "sourceId" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "XMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReactionRole" (
    "roleId" TEXT NOT NULL,
    "guildId" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "secret" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "ReactionRole_pkey" PRIMARY KEY ("roleId")
);

-- AddForeignKey
ALTER TABLE "GiftCode" ADD CONSTRAINT "GiftCode_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "GiftCodeChannel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

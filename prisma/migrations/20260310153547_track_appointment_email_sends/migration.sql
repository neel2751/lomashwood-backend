-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN     "confirmationEmailSentAt" TIMESTAMP(3),
ADD COLUMN     "missedEmailSentAt" TIMESTAMP(3),
ADD COLUMN     "reminderEmailSentAt" TIMESTAMP(3);

import { PrismaClient } from "@prisma/client";

export default eventHandler(async () => {
    const prisma = new PrismaClient()
    const verifications = await prisma.verification.findMany({
        where: {
            test: false
        },
        orderBy: {
            created_at: "desc"
        }
    })
    return verifications
})

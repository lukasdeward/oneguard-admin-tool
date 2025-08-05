import { PrismaClient } from "@prisma/client";

export default eventHandler(async () => {
    const prisma = new PrismaClient()
    const verifications = await prisma.verification.findMany({
        where: {
            manual_check_wanted: true,
            done: false,
            test: false
        }
    })
    return verifications
})

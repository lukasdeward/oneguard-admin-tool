import { PrismaClient } from "@prisma/client";

export default eventHandler(async (event) => {

    const body = await readBody(event);
    const verificationId = body.id;

    const prisma = new PrismaClient()
    
    const jobs = await prisma.verification_job.findMany({
        where: {
            verification: verificationId
        }
    })

    return jobs
})

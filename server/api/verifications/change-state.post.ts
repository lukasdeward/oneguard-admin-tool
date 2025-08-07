import { PrismaClient } from "@prisma/client";

export default eventHandler(async (event) => {

    const body = await readBody(event);
    const verificationId = body.id;
    const action = body.action;

    const prisma = new PrismaClient()

    if (action === 'complete') {

        const idData = body.idData as {
            id_number: string,
            id_country: string,
            id_birthday: string,
            id_expiry_date: string,
            id_name: string
        }


        await prisma.verification.update({
            where: { id: verificationId },
            data: { done: true, manual_check_wanted: false }
        });
    } else if (action === 'cancel') {
        await prisma.verification.update({
            where: { id: verificationId },
            data: { done: false, manual_check_wanted: false }
        });
    } else {
        return {
            status: 400,
            message: "Invalid action"
        };
    }
    
    const jobs = await prisma.verification_job.findMany({
        where: {
            verification: verificationId
        }
    })

    return jobs
})

import { PrismaClient } from "@prisma/client";
import { sendManualCheckSuccess } from "../../utils/manualCheckEmail";
import { sendShopifyCallback } from "~~/server/utils/shopifyCallback.ts";
export default eventHandler(async (event) => {

    const body = await readBody(event);
    const verificationId = body.id;
    const action = body.action;

    const prisma = new PrismaClient()

    const verification = await prisma.verification.findFirstOrThrow({
        where: {
            id: verificationId
        },
        include: {
            merchant: true
        }
    })

    if (action === 'complete') {

        const idDataRaw = body.idData as {
            id_number: string,
            id_country: string,
            id_birthday: string,
            id_expiry_date: string,
            id_type: string,
            id_name: string
        };

        const idData = {
            ...idDataRaw,
            id_birthday: new Date(idDataRaw.id_birthday),
            id_expiry_date: new Date(idDataRaw.id_expiry_date)
        };

          await prisma.verification.update({
            where: {
                id: verificationId,
            },
            data: {
                done: true,
            },
        });


        const verified = await prisma.verified.create({
            data: {
                id: verificationId,
                full_name: verification.customer_name,
                birthday: idData.id_birthday,
                card_id: idData.id_number,
                address: verification.address,
                email: verification.customer_email,
            }
        });


        if (verification.merchant.application_type === 'shopify') {
            const shopifyCallback = await sendShopifyCallback('completed', verification.merchant, verification.order_id, {
                birthday: idData.id_birthday,
                cardType: idData.id_type || 'unknown',
            });

            if (!shopifyCallback) {
            console.error(`Failed to send Shopify callback for verification ${body.verification_id}.`);
            console.error(shopifyCallback);
            }
        }

        if (verification.merchant.application_type === 'api') {
            console.warn('API callback not yet implemented');
        }

        await sendManualCheckSuccess({
            toEmail: verification.customer_email,
            toName: verification.customer_name ?? 'Customer',
            shopName: verification.merchant.display_name ?? 'OneGuard',
            orderName: verification.order_name.join(', '),
            publicUrl: verification.order_public_url || 'mailto:support@oneguard.app',
            lang: verification.customer_locale || 'en',
        })
    } else if (action === 'cancel') {
        
        console.log("Cancelling verification with ID:", verificationId);
    } else {
        return {
            status: 400,
            message: "Invalid action"
        };
    }
})

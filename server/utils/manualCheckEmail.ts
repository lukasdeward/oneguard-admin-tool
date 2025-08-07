import { locales } from "@prisma/client";
import FormData from "form-data";
import Mailgun from "mailgun.js";

// Combined translations for reminders and urgent reminders
const translations: Record<locales, Record<string, string>> = {
        en: {
            sender_name: "✅ {shopName} order Verified | OneGuard",
            email_title: "Your order verification is successful.",
            headline: "Your {shopName} has been verified. Your order will be shipped soon!",
            short_text: "Our team has successfully verified your identity. Your order is now on its way.",
            order: "Reference",
            customer: "Name",
            view_order: "View on {shopName}",
        },
        de: {
            sender_name: "✅ {shopName} Bestellung verifiziert | OneGuard",
            email_title: "Ihre Verifizierung war erfolgreich.",
            headline: "Ihre {shopName} Bestellung wurde verifiziert. Ihre Bestellung wird bald versendet!",
            short_text: "Unser Team hat Ihre Identität erfolgreich verifiziert. Ihre Bestellung ist jetzt auf dem Weg.",
            order: "Referenz",
            customer: "Name",
            view_order: "Ansehen auf {shopName}",

        },
        fr: {
            sender_name: "✅ {shopName} commande vérifiée | OneGuard",
            email_title: "Votre vérification est réussie.",
            headline: "Votre {shopName} a été vérifié. Votre commande est maintenant expédiée !",
            short_text: "Notre équipe a réussi à vérifier votre identité. Votre commande est en route.",
            order: "Référence",
            customer: "Nom",
            view_order: "Voir sur {shopName}",
        }
};

/**
 * Translate a key using the appropriate translations object.
 * Falls back to English if missing.
 */
function translate(
    key: string,
    lang: locales = "en",
    variables?: Record<string, string>,
): string {
    let template = translations?.[lang]?.[key] || translations?.en?.[key] || key;
    if (variables) {
        Object.entries(variables).forEach(([k, v]) => {
            template = template.replace(new RegExp(`{${k}}`, "g"), v);
        });
    }
    return template;
}

interface ReminderOptions {
    toEmail: string;
    toName: string;
    shopName: string;
    orderName: string;
    publicUrl?: string;
    lang?: locales;
}

/**
 * Sends a verification reminder email, either regular or urgent based on options.
 */
export async function sendManualCheckSuccess({
    toEmail,
    toName,
    shopName,
    orderName,
    publicUrl,
    lang = "en",
}: ReminderOptions): Promise<{ success: boolean; message: string }> {
    if (!process.env.MAILGUN_API_KEY) {
        console.error("Mailgun API key is not set in environment variables.");
        return {
            success: false,
            message: "Mailgun API key is not configured.",
        };
    }

    const mailgun = new Mailgun(FormData);
    const mg = mailgun.client({
        username: "api",
        key: process.env.MAILGUN_API_KEY,
        url: "https://api.eu.mailgun.net",
    });

    const vars: Record<string, string> = {
        shopName,
        orderName,
        current_year: new Date().getFullYear().toString(),
    };

    try {
        await mg.messages.create("mail.oneguard.app", {
            from: `${translate("sender_name", lang, vars)} <noreply@mail.oneguard.app>`,
            to: [`${toName} <${toEmail}>`],
            reply_to: 'support@oneguard.app', 
            subject: translate("sender_name", lang, vars),
            template: "manual verification success",
            "h:X-Mailgun-Variables": JSON.stringify({
                company_name: "OneGuard",
                current_year: vars.current_year,
                email_title: translate("email_title", lang, vars),
                headline: translate("headline", lang, vars),
                short_text: translate("short_text", lang, vars),
                street_address: "Welserstraße 3, 87463 Dietmannsried, Germany",
                support_email: "support@oneguard.app",
                order_label: translate("order", lang, vars),
                order_name: orderName,
                customer_label: translate("customer", lang, vars),
                customer_name: toName,
                public_order_url: publicUrl,
                public_order_button: translate("view_order", lang, vars),
            }),
        });
    } catch (error: any) {
        console.error("Error sending email:", error);
        return {
            success: false,
            message: error.message || "Failed to send verification email",
        };
    }

    return {
        success: true,
        message: "Verification email sent successfully",
    };
}

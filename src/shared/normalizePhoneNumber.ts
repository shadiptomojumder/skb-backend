export const normalizePhoneNumber = (phone: string): string => {
    // Remove any non-digit characters
    let normalizedPhone = phone.replace(/\D/g, "");

    // Add country code if missing
    if (normalizedPhone.startsWith("0")) {
        normalizedPhone = "+880" + normalizedPhone.slice(1);
    } else if (normalizedPhone.startsWith("880")) {
        normalizedPhone = "+880" + normalizedPhone.slice(3);
    } else if (!normalizedPhone.startsWith("+880")) {
        normalizedPhone = "+880" + normalizedPhone;
    }

    return normalizedPhone;
};
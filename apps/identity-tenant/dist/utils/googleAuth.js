import { OAuth2Client } from 'google-auth-library';
const googleClient = new OAuth2Client();
export async function verifyGoogleIdToken(idToken) {
    try {
        const ticket = await googleClient.verifyIdToken({
            idToken,
        });
        const payload = ticket.getPayload();
        if (!payload || !payload.email) {
            throw new Error('INVALID_GOOGLE_TOKEN');
        }
        return {
            email: payload.email.toLowerCase().trim(),
            name: payload.name || payload.given_name || 'User',
            picture: payload.picture,
        };
    }
    catch {
        // Fallback: verify token via Google's tokeninfo API endpoint
        try {
            const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`);
            if (!response.ok) {
                throw new Error('INVALID_GOOGLE_TOKEN');
            }
            const data = await response.json();
            if (!data?.email) {
                throw new Error('INVALID_GOOGLE_TOKEN');
            }
            return {
                email: data.email.toLowerCase().trim(),
                name: data.name || data.given_name || 'User',
                picture: data.picture,
            };
        }
        catch {
            throw new Error('INVALID_GOOGLE_TOKEN');
        }
    }
}

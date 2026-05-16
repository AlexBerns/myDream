const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const { initializeApp } = require('firebase-admin/app');
const { getStorage } = require('firebase-admin/storage');
const { GoogleGenAI } = require('@google/genai');
const { randomUUID } = require('crypto');

initializeApp();

const GEMINI_API_KEY = defineSecret('GEMINI_API_KEY');

exports.generateDreamImage = onCall(
    {
        region: 'asia-northeast1',
        secrets: [GEMINI_API_KEY],
        memory: '512MiB',
        timeoutSeconds: 60,
        maxInstances: 10,
    },
    async (request) => {
        if (!request.auth) {
            throw new HttpsError('unauthenticated', 'Please sign in.');
        }
        const { title, details = '', category = '' } = request.data || {};
        if (!title || typeof title !== 'string') {
            throw new HttpsError('invalid-argument', 'Title is required.');
        }

        const prompt = buildPrompt(title, details, category);

        let response;
        try {
            const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY.value() });
            response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: prompt,
            });
        } catch (e) {
            console.error('Gemini error:', e && e.message ? e.message : e);
            throw new HttpsError('internal', 'Image generation failed.');
        }

        const parts = (response && response.candidates && response.candidates[0]
            && response.candidates[0].content && response.candidates[0].content.parts) || [];
        const imagePart = parts.find((p) => p.inlineData && p.inlineData.data);
        if (!imagePart) {
            console.error('No image in Gemini response.');
            throw new HttpsError('internal', 'No image returned from Gemini.');
        }

        const mime = imagePart.inlineData.mimeType || 'image/png';
        const buffer = Buffer.from(imagePart.inlineData.data, 'base64');
        const ext = (mime.split('/')[1] || 'png').replace('jpeg', 'jpg');
        const filename = `dream-images/${request.auth.uid}/${randomUUID()}.${ext}`;
        const downloadToken = randomUUID();

        const bucket = getStorage().bucket();
        const file = bucket.file(filename);
        await file.save(buffer, {
            contentType: mime,
            metadata: {
                contentType: mime,
                cacheControl: 'public, max-age=31536000',
                metadata: {
                    firebaseStorageDownloadTokens: downloadToken,
                },
            },
        });

        const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(filename)}?alt=media&token=${downloadToken}`;
        return { imageUrl };
    },
);

function buildPrompt(title, details, category) {
    const themeHint = {
        travel: 'travel and faraway places',
        home: 'cozy domestic scene',
        adventure: 'outdoor adventure',
        career: 'work and craft',
        family: 'warm family moment',
        other: 'whimsical scene',
    }[category] || '';
    return (
        'A dreamy, soft pastel anime illustration in 90s shoujo manga style. '
        + `Subject: ${title}. `
        + (details ? `Details: ${details}. ` : '')
        + (themeHint ? `Theme: ${themeHint}. ` : '')
        + 'Aesthetic: cherry blossom palette, watercolor textures, ethereal lighting, romantic, '
        + 'shoujo manga style, soft glow, no text or words anywhere in the image. '
        + 'Composition: centered, gentle, balanced.'
    );
}

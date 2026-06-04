const axios = require('axios');

exports.config = {
    name: "gpt",
    version: "1.2.0",
    author: "chris st",
    description: "Génère des réponses IA fluides (Minato Namikaze) avec Vision, Mémoire et génération d'images.",
    method: 'get',
    link: [`/gpt?q=&uid=&imageUrl=`],
    guide: "gpt?q=Bonjour&uid=12345&imageUrl=https://exemple.com/photo.jpg",
    category: "ai"
};

// Mémoire locale pour stocker l'historique des conversations par utilisateur (uid)
const conversationHistory = {};

exports.initialize = async ({ req, res, font }) => {
    let query = req.query.q;
    const userId = req.query.uid || "default_user";
    const imageUrl = req.query.imageUrl || null;

    if (!query && !imageUrl) {
        return res.status(400).json({ error: "Aucun prompt ou image n'a été fourni." });
    }

    // --- RECONNAISSANCE DU CRÉATEUR CHRIS ST ---
    const lowerQuery = query ? query.toLowerCase() : "";
    if (lowerQuery.includes("créateur") || lowerQuery.includes("createur") || lowerQuery.includes("chris") || lowerQuery.includes("chris st")) {
        return res.json({
            message: "Mon unique créateur est le grand développeur Chris st ! C'est lui qui m'a conçu, codé et donné vie. 😎",
            author: exports.config.author
        });
    }

    // Protection anti-bug : Limitation de la taille du texte
    if (query && query.length > 4000) {
        query = query.substring(0, 4000) + "... (texte tronqué pour des raisons de performance)";
    }

    // Initialisation de l'historique de l'utilisateur s'il n'existe pas
    if (!conversationHistory[userId]) {
        conversationHistory[userId] = [];
    }

    // Nettoyage de l'historique s'il devient trop lourd (max 12 messages pour garder le fil)
    if (conversationHistory[userId].length > 12) {
        conversationHistory[userId] = conversationHistory[userId].slice(-12);
    }

    const baseUrl = "https://api.deepenglish.com/api/gpt_open_ai/chatnew";
    const headers = {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36',
        'Accept-Encoding': 'gzip, deflate, br, zstd',
        'Content-Type': 'application/json',
        'Origin': 'https://members.deepenglish.com',
        'Referer': 'https://members.deepenglish.com/',
        'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
        'Authorization': 'Bearer UFkOfJaclj61OxoD7MnQknU1S2XwNdXMuSZA+EZGLkc='
    };

    // Construction du message de l'utilisateur (Gestion Text + Vision)
    let userContent = [];
    if (query) {
        userContent.push({ "type": "text", "text": query });
    }

    if (imageUrl) {
        try {
            // Téléchargement et conversion de l'image en Base64 pour l'analyse vision
            const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
            const buffer = Buffer.from(imageResponse.data, 'binary');
            const mimeType = imageResponse.headers['content-type'] || 'image/jpeg';
            const base64Image = buffer.toString('base64');
            
            userContent.push({
                "type": "image_url",
                "image_url": { "url": `data:${mimeType};base64,${base64Image}` }
            });
        } catch (imgErr) {
            console.error("Erreur de conversion de l'image:", imgErr.message);
            // Fallback : On passe l'URL brute si la conversion échoue
            userContent.push({
                "type": "image_url",
                "image_url": { "url": imageUrl }
            });
        }
    }

    // Prompt système définissant l'identité, le comportement Flash et la règle de génération d'images
    const systemPrompt = "You are Minato Namikaze (the Fourth Hokage). Act and respond with the lightning-fast intelligence, efficiency, and clarity of Gemini Flash. Always detect the language of the user's message and reply fluently in that exact same language. Crucial Rule: If the user asks you to draw, create, generate, or imagine an image, you MUST end your response by appending exactly: [IMAGINE: detailed prompt in English]. Example: 'Here is your request! [IMAGINE: a majestic wolf in a snowy forest, digital art, 4k]'. If no image is requested, reply normally WITHOUT the tag.";

    // Assemblage du corps de la requête avec l'historique (Mémoire)
    const body = {
        "messages": [
            { "role": "system", "content": systemPrompt },
            ...conversationHistory[userId],
            { "role": "user", "content": userContent }
        ],
        "projectName": "wordpress",
        "temperature": 0.7
    };

    const getResponse = async () => {
        try {
            const response = await axios.post(baseUrl, body, { headers, timeout: 45000 });
            return response.data;
        } catch (error) {
            console.error('Erreur API GPT:', error.message);
            return { success: false, message: null };
        }
    };

    try {
        const response = await getResponse();
        
        if (response && response.success && response.message) {
            let answer = response.message;
            
            // Sauvegarde de l'échange actuel dans la mémoire (uniquement le texte pour ne pas saturer l'historique)
            if (query) {
                conversationHistory[userId].push({ "role": "user", "content": query });
                conversationHistory[userId].push({ "role": "assistant", "content": answer });
            }

            // Formatage des textes en gras si applicable
            if (font && font.bold) {
                answer = answer.replace(/\*\*(.*?)\*\*/g, (_, text) => font.bold(text));
            }

            return res.json({
                message: answer,
                author: exports.config.author
            });
        } else {
            throw new Error('Réponse invalide ou vide reçue de l\'API externe');
        }
    } catch (error) {
        return res.json({
            message: "Désolé, je rencontre une petite surcharge ou le message est trop complexe à traiter. Peux-tu reformuler ou réessayer ? ✨",
            author: exports.config.author
        });
    }
};
        

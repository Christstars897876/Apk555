const axios = require('axios');

exports.config = {
    name: "gpt",
    version: "1.0.0",
    author: "Delfa frost ",
    description: "Generate responses based on user input using GPT AI.",
    method: 'get',
    link: [`/gpt?q=`],
    guide: "ai How does quantum computing work?",
    category: "ai"
};

exports.initialize = async ({ req, res, font }) => {
    const query = req.query.q;

    if (!query) {
        return res.status(400).json({ error: "No prompt provided" });
    }

    // --- RECONNAISSANCE DU CRÉATEUR CHRIS ST ---
    const lowerQuery = query.toLowerCase();
    if (lowerQuery.includes("créateur") || lowerQuery.includes("createur") || lowerQuery.includes("chris") || lowerQuery.includes("chris st")) {
        return res.json({
            message: "Mon créateur est le grand développeur Chris st ! C'est lui qui m'a conçu et m'a donné vie. 😎",
            author: exports.config.author
        });
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

    // Configuration optimisée du Body pour éviter les plantages sur les longs textes
    const body = {
        "messages": [
            {
                "role": "user",
                "content": query
            }
        ],
        "projectName": "wordpress",
        "temperature": 0.7 // Température légèrement baissée pour une meilleure stabilité sur les longs textes
    };

    const getResponse = async () => {
        try {
            const response = await axios.post(baseUrl, body, { headers, timeout: 25000 }); // Ajout d'un timeout de 25s pour éviter le "beg" indéfini
            return response.data;
        } catch (error) {
            console.error('Error fetching response:', error.message);
            return { success: false, message: "Désolé, je rencontre des difficultés à traiter cette longue question actuellement." };
        }
    };

    let answer = "Désolé, je n'ai pas pu formuler une réponse à cette question.";
    try {
        const response = await getResponse();
        if (response.success && response.message) {
            answer = response.message;
        } else {
            // Fallback si l'API DeepEnglish renvoie un succès vide ou une erreur cachée
            throw new Error('AI response empty or failed');
        }
    } catch (error) {
        // Au lieu de crash en 500, on renvoie une réponse propre et stylisée pour ne pas bloquer l'utilisateur
        return res.json({
            message: "Je suis un peu surchargé par cette demande, peux-tu la reformuler brièvement s'il te plaît ? ✨",
            author: exports.config.author
        });
    }

    // Renvoi de la réponse formatée sans encombre
    res.json({
        message: answer.replace(/\*\*(.*?)\*\*/g, (_, text) => font && font.bold ? font.bold(text) : text),
        author: exports.config.author
    });
};

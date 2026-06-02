const axios = require('axios');

exports.config = {
    name: "gpt",
    version: "1.1.0",
    author: "chris st",
    description: "Génère des réponses IA fluides s'adaptant à la langue de l'utilisateur.",
    method: 'get',
    link: [`/gpt?q=`],
    guide: "gpt?q=Bonjour, comment ça va ?",
    category: "ai"
};

exports.initialize = async ({ req, res, font }) => {
    let query = req.query.q;

    if (!query) {
        return res.status(400).json({ error: "Aucun prompt n'a été fourni." });
    }

    // --- RECONNAISSANCE DU CRÉATEUR CHRIS ST ---
    const lowerQuery = query.toLowerCase();
    if (lowerQuery.includes("créateur") || lowerQuery.includes("createur") || lowerQuery.includes("chris") || lowerQuery.includes("chris st")) {
        return res.json({
            message: "Mon unique créateur est le grand développeur Chris st ! C'est lui qui m'a conçu, codé et donné vie. 😎",
            author: exports.config.author
        });
    }

    // Protection anti-bug : Si le texte est excessivement long (ex: copier-coller de logs), 
    // on le coupe proprement pour éviter de saturer ou faire planter l'API externe.
    if (query.length > 4000) {
        query = query.substring(0, 4000) + "... (texte tronqué pour des raisons de performance)";
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

    // Configuration du Body : On force l'IA à détecter et répondre dans la langue de l'utilisateur
    const body = {
        "messages": [
            {
                "role": "system",
                "content": "You are a helpful assistant. Crucial: Always detect the language of the user's message and reply fluently in that exact same language (e.g., if the user writes in French, reply in French. If in Spanish, reply in Spanish). Never state that you are an English-only AI."
            },
            {
                "role": "user",
                "content": query
            }
        ],
        "projectName": "wordpress",
        "temperature": 0.7
    };

    const getResponse = async () => {
        try {
            // Timeout de 30 secondes pour les longues requêtes complexes (histoires, codes)
            const response = await axios.post(baseUrl, body, { headers, timeout: 30000 });
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
        // Fallback sécurisé en cas de surcharge : évite que votre bot crash ou reste muet
        return res.json({
            message: "Désolé, je rencontre une petite surcharge ou le message est trop complexe à traiter. Peux-tu reformuler ou réessayer ? ✨",
            author: exports.config.author
        });
    }
};

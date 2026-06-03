const axios = require('axios');

exports.config = {
    name: "gpt",
    version: "1.1.0",
    author: "chris st",
    description: "Génère des réponses IA via l'API officielle d'OpenAI.",
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

    // --- RECONNAISSANCE DU CRÉATEUR ---
    const lowerQuery = query.toLowerCase();
    if (lowerQuery.includes("créateur") || lowerQuery.includes("createur") || lowerQuery.includes("chris") || lowerQuery.includes("chris st")) {
        return res.json({
            message: "Mon unique créateur est le grand développeur Chris st ! C'est lui qui m'a conçu, codé et donné vie. 😎",
            author: exports.config.author
        });
    }

    if (query.length > 4000) {
        query = query.substring(0, 4000) + "... (texte tronqué)";
    }

    // Récupération de la clé API depuis la configuration globale
    const apiKey = global.config.openAiApiKey;

    if (!apiKey || apiKey.includes("VOTRE_CLE_API")) {
        return res.status(500).json({ error: "La clé API OpenAI n'est pas configurée dans config.json." });
    }

    // URL officielle de l'API OpenAI pour les complétions de chat
    const baseUrl = "https://api.openai.com/v1/chat/completions";
    
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}` // <-- C'est ici que la clé API est injectée
    };

    const body = {
        "model": "gpt-4o-mini", // Vous pouvez changer le modèle ici (ex: gpt-4o, gpt-3.5-turbo)
        "messages": [
            {
                "role": "system",
                "content": "You are a helpful assistant. Crucial: Always detect the language of the user's message and reply fluently in that exact same language."
            },
            {
                "role": "user",
                "content": query
            }
        ],
        "temperature": 0.7
    };

    try {
        // Timeout de 30 secondes
        const response = await axios.post(baseUrl, body, { headers, timeout: 30000 });
        
        // Structure de réponse spécifique à l'API OpenAI
        if (response.data && response.data.choices && response.data.choices[0].message) {
            let answer = response.data.choices[0].message.content;
            
            // Formatage des textes en gras si applicable
            if (font && font.bold) {
                answer = answer.replace(/\*\*(.*?)\*\*/g, (_, text) => font.bold(text));
            }

            return res.json({
                message: answer,
                author: exports.config.author
            });
        } else {
            throw new Error('Réponse invalide reçue d\'OpenAI');
        }
    } catch (error) {
        console.error('Erreur API OpenAI:', error.response ? error.response.data : error.message);
        return res.json({
            message: "Désolé, je rencontre des difficultés à me connecter à OpenAI ou votre clé API est invalide. 🌟",
            author: exports.config.author
        });
    }
};

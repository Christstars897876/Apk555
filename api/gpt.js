const axios = require("axios");
require("dotenv").config();

exports.config = {
    name: "gpt",
    version: "2.0.0",
    author: "chris st",
    description: "Génère des réponses IA fluides et stables avec Gemini.",
    method: "get",
    link: ["/gpt?q="],
    guide: "gpt?q=Bonjour, comment ça va ?",
    category: "ai"
};

// 🔑 Clé API Gemini (mettre dans .env)
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

exports.initialize = async ({ req, res, font }) => {
    let query = req.query.q;

    // Vérification du prompt
    if (!query) {
        return res.status(400).json({
            error: "Aucun prompt n'a été fourni."
        });
    }

    // Protection longueur
    if (query.length > 4000) {
        query = query.slice(0, 4000);
    }

    // 🔥 API Gemini (Google)
    const url =
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

    // 🧠 Prompt système (Minato personnalisé)
    const body = {
        contents: [
            {
                role: "user",
                parts: [
                    {
                        text:
                            "Tu es Minato Namikaze, un assistant intelligent, rapide et utile. " +
                            "Réponds toujours dans la langue de l'utilisateur.\n\n" +
                            "Utilisateur: " +
                            query
                    }
                ]
            }
        ]
    };

    try {
        const response = await axios.post(url, body, {
            headers: {
                "Content-Type": "application/json"
            },
            timeout: 30000
        });

        // 📩 Extraction réponse
        let answer =
            response.data?.candidates?.[0]?.content?.parts?.[0]?.text ||
            "Désolé, je n'ai pas pu générer de réponse.";

        // 🔤 Formatage gras si dispo
        if (font && font.bold) {
            answer = answer.replace(/\*\*(.*?)\*\*/g, (_, text) =>
                font.bold(text)
            );
        }

        return res.json({
            message: answer,
            author: exports.config.author
        });

    } catch (error) {
        console.error("Erreur Gemini API:", error.message);

        return res.json({
            message:
                "Désolé, je rencontre un problème technique. Réessaie plus tard ✨",
            author: exports.config.author
        });
    }
};

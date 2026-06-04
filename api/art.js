const axios = require("axios");
const fs = require("fs");
const path = require("path");

exports.config = {
  name: 'art',
  author: 'Delfa frost',
  description: 'Generates AI art based on a text prompt',
  method: 'get',
  category: 'image generation',
  link: ['/art?prompt=A cat with a collar and the tag is Ace']
};

exports.initialize = async function ({ req, res }) {
  // Définition du dossier temporaire
  const tmpDir = path.join(__dirname, "tmp");
  
  // Crée le dossier 'tmp' s'il n'existe pas pour éviter le crash
  if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir, { recursive: true });
  }

  // Génère un nom de fichier unique basé sur le temps pour éviter les conflits entre utilisateurs
  const filePath = path.join(tmpDir, `art_${Date.now()}.png`);

  try {
    const { prompt } = req.query;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt parameter is required' });
    }

    const formData = new URLSearchParams({
      prompt: prompt,
      output_format: "bytes",
      user_profile_id: "null",
      anonymous_user_id: "a584e30d-1996-4598-909f-70c7ac715dc1",
      request_timestamp: Date.now(),
      user_is_subscribed: "false",
      client_id: "pSgX7WgjukXCBoYwDM8G8GLnRRkvAoJlqa5eAVvj95o",
    });

    const response = await axios.post(
      "https://ai-api.magicstudio.com/api/ai-art-generator",
      formData.toString(),
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 Edg/124.0.0.0",
          Accept: "application/json, text/plain, */*",
          "Accept-Encoding": "gzip, deflate, br, zstd",
          "Accept-Language": "en-US,en;q=0.9",
          Origin: "https://magicstudio.com",
          Referer: "https://magicstudio.com/ai-art-generator/",
          "Content-Type": "application/x-www-form-urlencoded",
        },
        responseType: "arraybuffer",
        timeout: 60000 // Ajout d'un timeout de 60s au cas où l'API est lente
      },
    );

    if (response.data && response.data.byteLength > 0) {
      // Écrit les données reçues dans le fichier unique
      fs.writeFileSync(filePath, response.data);
      
      // Envoie le fichier à l'utilisateur
      res.sendFile(filePath, (err) => {
        // La suppression du fichier se fait à l'intérieur du callback de res.sendFile
        // pour s'assurer que le fichier ne soit supprimé QU'APRÈS avoir été envoyé au bot.
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }

        if (err) {
          console.error("Error sending file:", err);
          // Si les en-têtes n'ont pas encore été envoyés, on renvoie une erreur
          if (!res.headersSent) {
            return res.status(500).json({ error: "Failed to send generated image" });
          }
        }
      });
    } else {
      res.status(500).json({ error: "No response or empty data from AI art generator" });
    }
  } catch (error) {
    console.error("Error generating art:", error.message);
    
    // Nettoyage de sécurité en cas d'erreur durant l'appel API
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    res.status(500).json({ error: "Failed to generate art. External API might be down or rate-limited." });
  }
};

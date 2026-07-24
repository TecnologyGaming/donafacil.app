const express = require('express');
const path = require('path');
const fs = require('fs');
const https = require('https');
const app = express();

const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

// Helper to fetch campaign data from Firestore REST API (no secret keys needed!)
function fetchCampaignFromFirestore(campaignId) {
  return new Promise((resolve) => {
    const url = `https://firestore.googleapis.com/v1/projects/donafacilapp/databases/(default)/documents/campaigns/${campaignId}`;
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.fields) {
            // Map Firestore REST API format to simple JS object
            const fields = json.fields;
            const campaign = {
              title: fields.title?.stringValue || "donafacil.app",
              description: fields.description?.stringValue || "",
              image: fields.images?.arrayValue?.values?.[0]?.stringValue || "https://img.icons8.com/color/120/000000/hearts.png",
              organizerName: fields.organizer?.mapValue?.fields?.name?.stringValue || "Vecino Solidario"
            };
            
            // If there's a primary image saved, let's use that
            if (fields.primaryImage?.stringValue) {
              campaign.image = fields.primaryImage.stringValue;
            }
            resolve(campaign);
          } else {
            resolve(null);
          }
        } catch (e) {
          resolve(null);
        }
      });
    }).on('error', () => {
      resolve(null);
    });
  });
}

// Serve static assets first, except the root/campaign routes which we want to inject dynamically for WhatsApp
app.use(express.static(path.join(__dirname, 'build'), { index: false }));

// Intercept Campaign Detail Route to inject Open Graph meta tags for WhatsApp previews!
app.get('/campaigns/:id', async (req, res) => {
  const campaignId = req.params.id;
  const indexPath = path.join(__dirname, 'build', 'index.html');
  
  fs.readFile(indexPath, 'utf8', async (err, htmlData) => {
    if (err) {
      return res.status(500).send('Error loading index.html');
    }

    let title = "donafacil.app | Recaudación de Fondos";
    let description = "Crea una campaña gratuita en minutos, comparte tu historia y recibe el apoyo directo de amigos, familiares y donantes con Zelle y Pago Móvil.";
    let imageUrl = "https://img.icons8.com/color/120/000000/hearts.png";

    // Fetch the real campaign details from Firestore
    const campaign = await fetchCampaignFromFirestore(campaignId);
    if (campaign) {
      title = `Dona a: ${campaign.title}`;
      description = `${campaign.description.substring(0, 150)}... Organizado por ${campaign.organizerName}. Apóyanos con Zelle y Pago Móvil.`;
      imageUrl = campaign.image;
    }

    // Replace the meta placeholders with rich preview open graph tags
    let result = htmlData
      .replace(/<title>.*?<\/title>/g, `<title>${title}</title>`)
      .replace(/<meta name="description" content=".*?" \/>/g, `<meta name="description" content="${description}" />`)
      // Inject Open Graph tags for WhatsApp / Facebook
      .replace('</head>', `
        <meta property="og:title" content="${title}" />
        <meta property="og:description" content="${description}" />
        <meta property="og:image" content="${imageUrl}" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://donafacil.app/campaigns/${campaignId}" />
        <meta property="og:site_name" content="donafacil.app" />
        <!-- WhatsApp rich preview specific overrides -->
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content="${imageUrl}" />
        </head>
      `);

    res.send(result);
  });
});

// For all other routes, serve standard SPA index.html
app.get('/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(PORT, HOST, () => {
  console.log(`donafacil.app Node.js Web App with WhatsApp Rich Previews is running!`);
  console.log(`Listening on host: ${HOST}, port: ${PORT}`);
});

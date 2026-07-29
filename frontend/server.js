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
            const fields = json.fields;
            const campaign = {
              title: fields.title?.stringValue || "donafacil.app",
              description: fields.description?.stringValue || "",
              image: fields.images?.arrayValue?.values?.[0]?.stringValue || "https://img.icons8.com/color/120/000000/hearts.png",
              organizerName: fields.organizer?.mapValue?.fields?.name?.stringValue || "Vecino Solidario"
            };
            
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

// Serve static assets first, except raw campaign pages and image endpoints
app.use(express.static(path.join(__dirname, 'build'), { index: false }));

// 1. Serving raw binary images decoded from Base64 stored in Firestore!
// This provides a valid, public absolute HTTPS link for WhatsApp crawlers!
app.get('/api/campaign-image/:id.jpg', async (req, res) => {
  const campaignId = req.params.id;
  const campaign = await fetchCampaignFromFirestore(campaignId);
  
  if (campaign && campaign.image && campaign.image.startsWith('data:image')) {
    try {
      const matches = campaign.image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        const contentType = matches[1];
        const base64Data = matches[2];
        const imageBuffer = Buffer.from(base64Data, 'base64');
        
        res.writeHead(200, {
          'Content-Type': contentType,
          'Content-Length': imageBuffer.length,
          'Cache-Control': 'public, max-age=86400' // Cache for 24 hours
        });
        return res.end(imageBuffer);
      }
    } catch (e) {
      console.error("Error decoding base64 image inside server:", e);
    }
  }
  
  // Fallback if it is already an external URL (Unsplash)
  if (campaign && campaign.image && campaign.image.startsWith('http')) {
    return res.redirect(campaign.image);
  }
  
  // Default fallback image
  res.sendFile(path.join(__dirname, 'build', 'favicon.ico'));
});

// 2. Intercept Campaign Share Route to inject Open Graph meta tags for WhatsApp previews and redirect!
app.get('/share/campaign/:id', async (req, res) => {
  const campaignId = req.params.id;
  const indexPath = path.join(__dirname, 'build', 'index.html');
  
  fs.readFile(indexPath, 'utf8', async (err, htmlData) => {
    if (err) {
      return res.status(500).send('Error loading index.html');
    }

    let title = "donafacil.app | Recaudación de Fondos";
    let description = "Crea una campaña gratuita en minutos, comparte tu historia y recibe el apoyo directo de amigos, familiares y donantes con Zelle y Pago Móvil.";
    
    // Resolve dynamic host/domain to build absolute HTTPS preview links
    const host = req.headers.host || 'donafacil.app';
    const protocol = 'https'; // Force absolute HTTPS for social media bots
    let imageUrl = `${protocol}://${host}/api/campaign-image/${campaignId}.jpg`;

    // Fetch the real campaign details from Firestore
    const campaign = await fetchCampaignFromFirestore(campaignId);
    if (campaign) {
      title = `Dona a: ${campaign.title}`;
      description = `${campaign.description.substring(0, 150)}... Organizado por ${campaign.organizerName}. Apóyanos con Zelle y Pago Móvil.`;
    }

    // Replace the meta placeholders, inject social meta tags, and REDIRECT browsers instantly to /campaigns/:id
    let result = htmlData
      .replace(/<title>.*?<\/title>/g, `<title>${title}</title>`)
      .replace(/<meta name="description" content=".*?" \/>/g, `<meta name="description" content="${description}" />`)
      // Inject Open Graph tags for WhatsApp / Facebook
      .replace('</head>', `
        <meta property="og:title" content="${title}" />
        <meta property="og:description" content="${description}" />
        <meta property="og:image" content="${imageUrl}" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="${protocol}://${host}/share/campaign/${campaignId}" />
        <meta property="og:site_name" content="donafacil.app" />
        <!-- WhatsApp rich preview specific overrides -->
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content="${imageUrl}" />
        <script type="text/javascript">
          // Redirigir de inmediato al navegador del usuario a la vista de detalles
          window.location.replace("/campaigns/${campaignId}");
        </script>
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

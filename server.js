const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Define PORT early so it can be used in routes
const PORT = process.env.PORT || 3000;

// Instagram API credentials (let for runtime token updates)
let INSTAGRAM_ACCESS_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN;
const INSTAGRAM_ACCOUNT_ID = process.env.INSTAGRAM_ACCOUNT_ID;

// Emotion metadata for Instagram captions
const EMOTION_META_SERVER = {
  joy: { label: 'たのしい', icon: '🌟' },
  shock: { label: 'おどろき', icon: '⚡' },
  sad: { label: 'せつない', icon: '💧' },
  confuse: { label: 'こんらん', icon: '🌀' },
  fire: { label: 'しげきてき', icon: '🔥' }
};
const TOOL_EMOTIONS = {
  melt: 'joy', tiltshift: 'joy',
  badtv: 'shock', edge: 'shock',
  slices: 'sad', vignette: 'sad',
  wobble: 'confuse', polar: 'confuse',
  smear: 'fire', dot: 'fire'
};

function buildCaption(effectValues) {
  const emotionTotals = { joy: 0, shock: 0, sad: 0, confuse: 0, fire: 0 };
  if (effectValues) {
    for (const [id, val] of Object.entries(effectValues)) {
      const emotion = TOOL_EMOTIONS[id];
      if (emotion) emotionTotals[emotion] += val;
    }
  }
  const sum = Object.values(emotionTotals).reduce((a, b) => a + b, 0);

  let emotionLines = '';
  if (sum > 0) {
    emotionLines = '\n\n';
    for (const [key, total] of Object.entries(emotionTotals)) {
      const pct = Math.round((total / sum) * 100);
      const meta = EMOTION_META_SERVER[key];
      emotionLines += `${meta.icon} ${meta.label} ${pct}%\n`;
    }
  }

  return `新しい作品が完成しました！🎨✨\n\n4方向からご覧ください 👀\n最後のスライドにサインがあります ✍️${emotionLines}\n#EmotionPaint #陶芸 #アート #感情を描く壺\n\n@atelier_kanna1212`;
}

// JSON body parser (50MB limit for base64 images)
app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// ══════════════════════════════════════
//  In-memory work storage (works without Firebase)
// ══════════════════════════════════════
const works = new Map();

// Save a work
app.post('/api/works/:id', async (req, res) => {
  const id = req.params.id;
  const workData = { ...req.body, savedAt: Date.now() };
  works.set(id, workData);
  console.log(`Work saved: ${id} (total: ${works.size})`);

  // レスポンスを先に返す（Instagram投稿はバックグラウンドで実行）
  res.json({ ok: true, id });

  // Auto-post to Instagram if configured (only with public URLs, not base64)
  const hasPublicImages = workData.imageUrls && workData.imageUrls.length > 1 && !workData.imageUrls[0].startsWith('data:');
  const hasPublicThumbnail = workData.thumbnailUrl && !workData.thumbnailUrl.startsWith('data:');
  if (INSTAGRAM_ACCESS_TOKEN && INSTAGRAM_ACCOUNT_ID && (hasPublicImages || hasPublicThumbnail)) {
    // 非同期でInstagram投稿（クライアントをブロックしない）
    (async () => {
      try {
        if (hasPublicImages) {
          const carouselImages = [...workData.imageUrls];
          if (workData.signatureUrl && !workData.signatureUrl.startsWith('data:')) {
            carouselImages.push(workData.signatureUrl);
          }
          console.log(`Attempting to post carousel to Instagram (${carouselImages.length} images)...`);
          const instagramResponse = await fetch(`http://localhost:${PORT}/api/instagram/carousel`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              imageUrls: carouselImages,
              caption: buildCaption(workData.effectValues)
            })
          });
          const instagramResult = await instagramResponse.json();
          if (instagramResult.success) {
            console.log('✅ Successfully posted carousel to Instagram:', instagramResult.instagramPostId);
            workData.instagramPostId = instagramResult.instagramPostId;
          } else {
            console.warn('⚠️ Instagram carousel post failed:', instagramResult.error);
          }
        } else if (hasPublicThumbnail) {
          console.log('Attempting to post single image to Instagram...');
          const instagramResponse = await fetch(`http://localhost:${PORT}/api/instagram/post`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              imageUrl: workData.thumbnailUrl,
              caption: buildCaption(workData.effectValues)
            })
          });
          const instagramResult = await instagramResponse.json();
          if (instagramResult.success) {
            console.log('✅ Successfully posted to Instagram:', instagramResult.instagramPostId);
            workData.instagramPostId = instagramResult.instagramPostId;
          } else {
            console.warn('⚠️ Instagram post failed:', instagramResult.error);
          }
        }
      } catch (error) {
        console.error('❌ Instagram auto-post error:', error.message);
      }
    })();
  } else if (INSTAGRAM_ACCESS_TOKEN && INSTAGRAM_ACCOUNT_ID) {
    console.log('⏭️ Skipping Instagram post (no public image URLs, waiting for viewer upload)');
  }
});

// Get a work
app.get('/api/works/:id', (req, res) => {
  const id = req.params.id;
  const work = works.get(id);
  if (!work) return res.status(404).json({ error: 'Not found' });
  res.json(work);
});

// List all works (for gallery)
app.get('/api/works', (req, res) => {
  const list = [];
  works.forEach((val, key) => list.push({ id: key, ...val }));
  list.sort((a, b) => (b.savedAt || 0) - (a.savedAt || 0));
  res.json(list.slice(0, 50));
});

// ══════════════════════════════════════
//  Image Upload API (replaces Firebase Storage to avoid CORS)
// ══════════════════════════════════════
const uploadsDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

app.post('/api/upload', (req, res) => {
  const { workId, images, displacement } = req.body;
  if (!workId || !images || !Array.isArray(images)) {
    return res.status(400).json({ error: 'workId and images[] required' });
  }

  const workDir = path.join(uploadsDir, workId);
  if (!fs.existsSync(workDir)) fs.mkdirSync(workDir, { recursive: true });

  const imageUrls = images.map((base64Data, index) => {
    const matches = base64Data.match(/^data:image\/(\w+);base64,(.+)$/);
    if (!matches) return null;
    const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
    const buffer = Buffer.from(matches[2], 'base64');
    const filename = `view_${index}.${ext}`;
    fs.writeFileSync(path.join(workDir, filename), buffer);
    return `/uploads/${workId}/${filename}`;
  }).filter(Boolean);

  let displacementUrl = null;
  if (displacement) {
    const matches = displacement.match(/^data:image\/(\w+);base64,(.+)$/);
    if (matches) {
      const buffer = Buffer.from(matches[2], 'base64');
      fs.writeFileSync(path.join(workDir, 'displacement.png'), buffer);
      displacementUrl = `/uploads/${workId}/displacement.png`;
    }
  }

  console.log(`Uploaded ${imageUrls.length} images for ${workId}`);
  res.json({ imageUrls, displacementUrl });
});

// ══════════════════════════════════════
//  Instagram Auto-Post API
// ══════════════════════════════════════

// Instagram Carousel Post API (複数画像投稿)
app.post('/api/instagram/carousel', async (req, res) => {
  if (!INSTAGRAM_ACCESS_TOKEN || !INSTAGRAM_ACCOUNT_ID) {
    return res.status(500).json({
      error: 'Instagram API not configured'
    });
  }

  try {
    const { imageUrls, caption } = req.body;

    if (!imageUrls || imageUrls.length === 0) {
      return res.status(400).json({ error: 'imageUrls array is required' });
    }

    console.log(`Creating carousel with ${imageUrls.length} images...`);

    // Step 1: 各画像のメディアコンテナを作成
    const mediaIds = [];
    for (const imageUrl of imageUrls) {
      const containerResponse = await fetch(
        `https://graph.facebook.com/v18.0/${INSTAGRAM_ACCOUNT_ID}/media`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image_url: imageUrl,
            is_carousel_item: true,
            access_token: INSTAGRAM_ACCESS_TOKEN
          })
        }
      );

      const containerData = await containerResponse.json();
      if (!containerData.id) {
        console.error('Failed to create media container:', containerData);
        return res.status(500).json({ error: 'Failed to create media container', details: containerData });
      }

      mediaIds.push(containerData.id);
      console.log(`Media container created: ${containerData.id}`);
    }

    // Step 2: カルーセルコンテナを作成
    const carouselResponse = await fetch(
      `https://graph.facebook.com/v18.0/${INSTAGRAM_ACCOUNT_ID}/media`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          media_type: 'CAROUSEL',
          children: mediaIds,
          caption: caption || 'Emotion Paint - 感情を描く壺 🎨',
          access_token: INSTAGRAM_ACCESS_TOKEN
        })
      }
    );

    const carouselData = await carouselResponse.json();
    if (!carouselData.id) {
      console.error('Failed to create carousel:', carouselData);
      return res.status(500).json({ error: 'Failed to create carousel', details: carouselData });
    }

    console.log(`Carousel container created: ${carouselData.id}`);

    // Step 3: メディアの処理完了を待つ
    const waitForMedia = async (mediaId, maxRetries = 10) => {
      for (let i = 0; i < maxRetries; i++) {
        await new Promise(r => setTimeout(r, 5000));
        const statusRes = await fetch(
          `https://graph.facebook.com/v18.0/${mediaId}?fields=status_code&access_token=${INSTAGRAM_ACCESS_TOKEN}`
        );
        const statusData = await statusRes.json();
        console.log(`Media ${mediaId} status: ${statusData.status_code} (attempt ${i + 1}/${maxRetries})`);
        if (statusData.status_code === 'FINISHED') return true;
        if (statusData.status_code === 'ERROR') return false;
      }
      return false;
    };

    console.log('Waiting for carousel media to be processed...');
    const ready = await waitForMedia(carouselData.id);
    if (!ready) {
      console.error('Carousel media processing timed out or failed');
      return res.status(500).json({ error: 'Carousel media processing failed' });
    }

    // Step 4: カルーセルを公開
    const publishResponse = await fetch(
      `https://graph.facebook.com/v18.0/${INSTAGRAM_ACCOUNT_ID}/media_publish`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creation_id: carouselData.id,
          access_token: INSTAGRAM_ACCESS_TOKEN
        })
      }
    );

    const publishData = await publishResponse.json();
    if (!publishData.id) {
      console.error('Failed to publish carousel:', publishData);
      return res.status(500).json({ error: 'Failed to publish carousel', details: publishData });
    }

    console.log('✅ Successfully posted carousel to Instagram:', publishData.id);
    res.json({
      success: true,
      instagramPostId: publishData.id,
      message: 'Carousel posted to Instagram successfully'
    });

  } catch (error) {
    console.error('Instagram carousel post error:', error);
    res.status(500).json({ error: 'Instagram carousel posting failed', message: error.message });
  }
});

// Instagram Single Image Post API
app.post('/api/instagram/post', async (req, res) => {
  if (!INSTAGRAM_ACCESS_TOKEN || !INSTAGRAM_ACCOUNT_ID) {
    return res.status(500).json({
      error: 'Instagram API not configured. Please set INSTAGRAM_ACCESS_TOKEN and INSTAGRAM_ACCOUNT_ID in .env file'
    });
  }

  try {
    const { imageUrl, caption } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ error: 'imageUrl is required' });
    }

    // Step 1: Create media container
    const containerResponse = await fetch(
      `https://graph.facebook.com/v18.0/${INSTAGRAM_ACCOUNT_ID}/media`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_url: imageUrl,
          caption: caption || 'Emotion Paint - 感情を描く壺 🎨',
          access_token: INSTAGRAM_ACCESS_TOKEN
        })
      }
    );

    const containerData = await containerResponse.json();

    if (!containerData.id) {
      console.error('Instagram container creation failed:', containerData);
      return res.status(500).json({ error: 'Failed to create Instagram media container', details: containerData });
    }

    // Step 2: Publish the media
    const publishResponse = await fetch(
      `https://graph.facebook.com/v18.0/${INSTAGRAM_ACCOUNT_ID}/media_publish`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creation_id: containerData.id,
          access_token: INSTAGRAM_ACCESS_TOKEN
        })
      }
    );

    const publishData = await publishResponse.json();

    if (!publishData.id) {
      console.error('Instagram publish failed:', publishData);
      return res.status(500).json({ error: 'Failed to publish to Instagram', details: publishData });
    }

    console.log('Successfully posted to Instagram:', publishData.id);
    res.json({
      success: true,
      instagramPostId: publishData.id,
      message: 'Posted to Instagram successfully'
    });

  } catch (error) {
    console.error('Instagram post error:', error);
    res.status(500).json({ error: 'Instagram posting failed', message: error.message });
  }
});

// ══════════════════════════════════════
//  Instagram Token Management
// ══════════════════════════════════════

app.get('/api/instagram/token-status', async (req, res) => {
  if (!INSTAGRAM_ACCESS_TOKEN) {
    return res.json({ valid: false, error: 'No token configured' });
  }
  try {
    const r = await fetch(`https://graph.facebook.com/v18.0/me?fields=id,name&access_token=${INSTAGRAM_ACCESS_TOKEN}`);
    const data = await r.json();
    if (data.error) {
      return res.json({ valid: false, error: data.error.message });
    }
    const debugR = await fetch(`https://graph.facebook.com/v18.0/debug_token?input_token=${INSTAGRAM_ACCESS_TOKEN}&access_token=${INSTAGRAM_ACCESS_TOKEN}`);
    const debugData = await debugR.json();
    const expiresAt = debugData.data?.expires_at;
    const now = Math.floor(Date.now() / 1000);
    res.json({
      valid: true,
      name: data.name,
      id: data.id,
      expiresAt: expiresAt ? new Date(expiresAt * 1000).toISOString() : 'unknown',
      remainingDays: expiresAt ? Math.floor((expiresAt - now) / 86400) : 'unknown'
    });
  } catch (e) {
    res.json({ valid: false, error: e.message });
  }
});

app.post('/api/instagram/exchange-token', async (req, res) => {
  const { shortLivedToken, appId, appSecret } = req.body;
  if (!shortLivedToken || !appId || !appSecret) {
    return res.status(400).json({ error: 'shortLivedToken, appId, appSecret are required' });
  }
  try {
    const url = `https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${shortLivedToken}`;
    const r = await fetch(url);
    const data = await r.json();
    if (data.error) {
      return res.status(400).json({ error: data.error.message });
    }
    INSTAGRAM_ACCESS_TOKEN = data.access_token;
    console.log('Instagram token updated (long-lived, expires in ~60 days)');
    res.json({
      success: true,
      token: data.access_token,
      expiresIn: data.expires_in,
      gcloudCommand: `gcloud run services update emotion-paint --region asia-northeast1 --set-env-vars "INSTAGRAM_ACCESS_TOKEN=${data.access_token},INSTAGRAM_ACCOUNT_ID=${INSTAGRAM_ACCOUNT_ID}"`
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/admin/token', (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="ja"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Instagram Token Manager</title>
<style>
  body{font-family:sans-serif;max-width:600px;margin:40px auto;padding:0 20px;background:#f5f5f5}
  h1{color:#333;font-size:1.4em}
  .card{background:#fff;border-radius:8px;padding:20px;margin:16px 0;box-shadow:0 1px 3px rgba(0,0,0,.1)}
  label{display:block;margin:8px 0 4px;font-weight:bold;font-size:.9em}
  input{width:100%;padding:8px;border:1px solid #ddd;border-radius:4px;box-sizing:border-box;font-size:.9em}
  button{padding:10px 20px;border:none;border-radius:4px;cursor:pointer;font-size:.9em;margin:8px 4px 0 0}
  .btn-blue{background:#1877f2;color:#fff}
  .btn-green{background:#28a745;color:#fff}
  #status,#result{margin-top:12px;padding:12px;border-radius:4px;font-size:.85em;white-space:pre-wrap;word-break:break-all}
  .ok{background:#d4edda;color:#155724}
  .err{background:#f8d7da;color:#721c24}
  .info{background:#d1ecf1;color:#0c5460}
  a{color:#1877f2}
</style></head><body>
<h1>Instagram Token Manager</h1>
<div class="card">
  <h3>Step 1: Token Status</h3>
  <button class="btn-blue" onclick="checkStatus()">Check Current Token</button>
  <div id="status"></div>
</div>
<div class="card">
  <h3>Step 2: Get Short-Lived Token</h3>
  <p><a href="https://developers.facebook.com/tools/explorer/" target="_blank">Graph API Explorer</a> を開く</p>
  <ol style="font-size:.85em;line-height:1.6">
    <li>Right dropdown: select your app</li>
    <li>User or Page: Page Access Token for <b>アトリエ＿かんな</b></li>
    <li>Add permissions: <code>instagram_basic</code>, <code>instagram_content_publish</code>, <code>pages_read_engagement</code>, <code>pages_show_list</code></li>
    <li>Click <b>Generate Access Token</b></li>
  </ol>
</div>
<div class="card">
  <h3>Step 3: Exchange for Long-Lived Token (60 days)</h3>
  <label>Short-Lived Token:</label>
  <input id="token" placeholder="EAAb...">
  <label>App ID:</label>
  <input id="appId" placeholder="123456789012345">
  <label>App Secret:</label>
  <input id="appSecret" type="password" placeholder="abc123...">
  <button class="btn-green" onclick="exchangeToken()">Exchange Token</button>
  <div id="result"></div>
</div>
<script>
async function checkStatus(){
  const el=document.getElementById('status');
  el.className='info';el.textContent='Checking...';
  try{
    const r=await fetch('/api/instagram/token-status');
    const d=await r.json();
    if(d.valid){
      el.className='ok';
      el.textContent='Valid!\\nPage: '+d.name+'\\nExpires: '+d.expiresAt+'\\nRemaining: '+d.remainingDays+' days';
    }else{
      el.className='err';
      el.textContent='Invalid: '+d.error;
    }
  }catch(e){el.className='err';el.textContent='Error: '+e.message}
}
async function exchangeToken(){
  const el=document.getElementById('result');
  const token=document.getElementById('token').value;
  const appId=document.getElementById('appId').value;
  const appSecret=document.getElementById('appSecret').value;
  if(!token||!appId||!appSecret){el.className='err';el.textContent='All fields required';return}
  el.className='info';el.textContent='Exchanging...';
  try{
    const r=await fetch('/api/instagram/exchange-token',{
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({shortLivedToken:token,appId,appSecret})
    });
    const d=await r.json();
    if(d.success){
      el.className='ok';
      el.textContent='Success! Token updated (server memory).\\n\\nExpires in: '+Math.floor(d.expiresIn/86400)+' days\\n\\nTo persist on Cloud Run, run:\\n'+d.gcloudCommand;
    }else{
      el.className='err';el.textContent='Error: '+d.error;
    }
  }catch(e){el.className='err';el.textContent='Error: '+e.message}
}
</script></body></html>`);
});

// Global mood state
let globalMood = { melt: 0, tiltshift: 0, badtv: 0, edge: 0, slices: 0, vignette: 0, wobble: 0, polar: 0, smear: 0, dot: 0 };

io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  socket.on('draw', (data) => socket.broadcast.emit('draw', data));
  socket.on('emotion', (data) => socket.broadcast.emit('emotion', data));
  socket.on('vaseShape', (data) => socket.broadcast.emit('vaseShape', data));
  socket.on('theme', (data) => socket.broadcast.emit('theme', data));

  socket.on('save', (data) => {
    console.log('Save triggered, forwarding to viewer...');
    socket.broadcast.emit('save', data);
  });

  socket.on('saveComplete', (data) => {
    console.log(`Save complete: workId=${data.workId}`);
    socket.broadcast.emit('saveComplete', data);
  });

  socket.on('enterGallery', () => socket.broadcast.emit('enterGallery'));
  socket.on('exitGallery', () => socket.broadcast.emit('exitGallery'));
  socket.on('loadWork', (data) => socket.broadcast.emit('loadWork', data));

  socket.on('updateGlobalMood', (data) => {
    globalMood = data;
    io.emit('globalMood', globalMood);
  });

  socket.emit('globalMood', globalMood);

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`Controller: http://localhost:${PORT}?role=controller`);
  console.log(`Viewer:     http://localhost:${PORT}?role=viewer`);
});

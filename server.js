const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
require('dotenv').config();

const app = express();
// Trust Cloud Run 1-hop reverse proxy to prevent X-Forwarded-For spoofing and get actual client IP
app.set('trust proxy', 1);

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

// Redirect root URL without parameters to ?role=viewer
app.get('/', (req, res, next) => {
  if (!req.query.role && !req.query.screen) {
    return res.redirect('/?role=viewer');
  }
  next();
});

app.use(express.static(path.join(__dirname, 'public')));

// ══════════════════════════════════════
//  In-memory work storage (works without Firebase)
// ══════════════════════════════════════
const works = new Map();

// Rate limiter for Instagram auto-posts (IP-based cooldown)
const postCooldownByIp = new Map();
const POST_COOLDOWN_MS = (parseInt(process.env.POST_COOLDOWN_SECONDS, 10) || 20) * 1000; // デフォルト20秒（環境変数で調整可）

// Validate Firebase Storage URL (sotuten-32fea)
function isValidStorageUrl(urlString, expectedWorkId) {
  if (typeof urlString !== 'string' || !urlString) return false;
  try {
    const parsed = new URL(urlString);
    const validHosts = [
      'firebasestorage.googleapis.com',
      'storage.googleapis.com',
      'sotuten-32fea.firebasestorage.app'
    ];
    if (!validHosts.includes(parsed.hostname)) return false;

    const decodedPath = decodeURIComponent(parsed.pathname);

    // バケット名検証 (sotuten-32fea)
    const validBucketPattern = /(?:sotuten-32fea\.firebasestorage\.app|sotuten-32fea\.appspot\.com)/;
    if (!validBucketPattern.test(parsed.hostname) && !validBucketPattern.test(decodedPath)) {
      return false;
    }

    // パス検証: /artifacts/{appId}/public/data/gallery/{workId}/
    const escapedWorkId = expectedWorkId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const galleryPattern = new RegExp('artifacts/[^/]+/public/data/gallery/' + escapedWorkId + '/[\\w.-]+$');
    return galleryPattern.test(decodedPath);
  } catch (e) {
    return false;
  }
}

// ══════════════════════════════════════
//  Instagram Auto-Post Internal Functions
// ══════════════════════════════════════

async function postCarouselToInstagram(imageUrls, caption) {
  if (!INSTAGRAM_ACCESS_TOKEN || !INSTAGRAM_ACCOUNT_ID) {
    throw new Error('Instagram API not configured');
  }
  if (!imageUrls || imageUrls.length === 0) {
    throw new Error('imageUrls array is required');
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
      throw new Error(containerData.error?.message || 'Failed to create media container');
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
    throw new Error(carouselData.error?.message || 'Failed to create carousel');
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
    throw new Error('Carousel media processing timed out or failed');
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
    throw new Error(publishData.error?.message || 'Failed to publish carousel');
  }

  console.log('✅ Successfully posted carousel to Instagram:', publishData.id);
  return { success: true, instagramPostId: publishData.id };
}

async function postSingleToInstagram(imageUrl, caption) {
  if (!INSTAGRAM_ACCESS_TOKEN || !INSTAGRAM_ACCOUNT_ID) {
    throw new Error('Instagram API not configured');
  }
  if (!imageUrl) {
    throw new Error('imageUrl is required');
  }

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
    throw new Error(containerData.error?.message || 'Failed to create Instagram media container');
  }

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
    throw new Error(publishData.error?.message || 'Failed to publish to Instagram');
  }

  console.log('✅ Successfully posted single image to Instagram:', publishData.id);
  return { success: true, instagramPostId: publishData.id };
}

// Save a work
app.post('/api/works/:id', async (req, res) => {
  const id = req.params.id;
  const workData = { ...req.body, savedAt: Date.now() };
  works.set(id, workData);
  console.log(`Work saved: ${id} (total: ${works.size})`);

  // レスポンスを先に返す（Instagram投稿はバックグラウンドで実行）
  res.json({ ok: true, id });

  // Instagram 自動投稿の実行条件検証
  if (!INSTAGRAM_ACCESS_TOKEN || !INSTAGRAM_ACCOUNT_ID) {
    return;
  }

  // クライアントIPのレート制限チェック（同一IPからの短時間連続投稿防止）
  // trust proxy 有効化により、Cloud Run のリバースプロキシが付与した正規のクライアントIPが req.ip に格納される
  const clientIp = req.ip || req.socket?.remoteAddress || 'unknown';
  const now = Date.now();
  const lastPostTime = postCooldownByIp.get(clientIp) || 0;
  if (now - lastPostTime < POST_COOLDOWN_MS) {
    console.warn(`⚠️ Instagram auto-post skipped: rate limit exceeded for IP ${clientIp} (${Math.round((POST_COOLDOWN_MS - (now - lastPostTime)) / 1000)}s remaining)`);
    return;
  }

  // 画像URLの検証（Firebase Storage の該当 workId 配下のみ許可）
  const hasImages = Array.isArray(workData.imageUrls) && workData.imageUrls.length > 0;
  let allUrlsValid = false;
  let carouselImages = [];

  if (hasImages) {
    const imagesValid = workData.imageUrls.every(url => isValidStorageUrl(url, id));
    const signatureValid = !workData.signatureUrl || isValidStorageUrl(workData.signatureUrl, id);

    if (imagesValid && signatureValid) {
      allUrlsValid = true;
      carouselImages = [...workData.imageUrls];
      if (workData.signatureUrl) {
        carouselImages.push(workData.signatureUrl);
      }
    } else {
      console.warn(`⚠️ Instagram post skipped: invalid or unauthorized image URLs for work ${id}`);
    }
  } else if (workData.thumbnailUrl && isValidStorageUrl(workData.thumbnailUrl, id)) {
    allUrlsValid = true;
  } else {
    console.warn(`⚠️ Instagram post skipped: no valid public image URLs for work ${id}`);
  }

  if (!allUrlsValid) {
    return;
  }

  // クールダウン時刻を記録
  postCooldownByIp.set(clientIp, now);

  // 非同期でInstagram投稿（直接内部関数呼び出し）
  (async () => {
    try {
      if (carouselImages.length > 1) {
        console.log(`Attempting to post carousel to Instagram (${carouselImages.length} images)...`);
        const result = await postCarouselToInstagram(carouselImages, buildCaption(workData.effectValues));
        workData.instagramPostId = result.instagramPostId;
      } else if (workData.thumbnailUrl) {
        console.log('Attempting to post single image to Instagram...');
        const result = await postSingleToInstagram(workData.thumbnailUrl, buildCaption(workData.effectValues));
        workData.instagramPostId = result.instagramPostId;
      }
    } catch (error) {
      console.error('❌ Instagram auto-post error:', error.message);
    }
  })();
});

// ══════════════════════════════════════
//  Instagram Token Management
// ══════════════════════════════════════

app.get('/api/instagram/token-status', async (req, res) => {
  if (!INSTAGRAM_ACCESS_TOKEN) {
    return res.json({ valid: false, error: 'No token configured' });
  }
  try {
    const debugR = await fetch(`https://graph.facebook.com/v18.0/debug_token?input_token=${INSTAGRAM_ACCESS_TOKEN}&access_token=${INSTAGRAM_ACCESS_TOKEN}`);
    const debugData = await debugR.json();
    if (debugData.error || !debugData.data?.is_valid) {
      return res.json({ valid: false, error: debugData.error?.message || 'Token invalid' });
    }
    const expiresAt = debugData.data?.expires_at;
    const now = Math.floor(Date.now() / 1000);
    res.json({
      valid: true,
      remainingDays: expiresAt ? Math.max(0, Math.floor((expiresAt - now) / 86400)) : 'unlimited'
    });
  } catch (e) {
    res.json({ valid: false, error: e.message });
  }
});

io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  socket.on('draw', (data) => socket.broadcast.emit('draw', data));
  socket.on('emotion', (data) => socket.broadcast.emit('emotion', data));
  socket.on('vaseShape', (data) => socket.broadcast.emit('vaseShape', data));

  socket.on('save', (data) => {
    console.log('Save triggered, forwarding to viewer...');
    socket.broadcast.emit('save', data);
  });

  socket.on('saveComplete', (data) => {
    console.log(`Save complete: workId=${data.workId}`);
    socket.broadcast.emit('saveComplete', data);
  });

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`📱 コントローラー (お絵描き画面): http://localhost:${PORT}/?role=controller`);
  console.log(`🖥️ ビューアー (3D壺画面):         http://localhost:${PORT}/?role=viewer`);
});

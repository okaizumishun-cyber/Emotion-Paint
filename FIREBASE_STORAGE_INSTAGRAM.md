# Firebase Storage + Instagram カルーセル投稿 実装ガイド

## 概要
4方向から撮影した壺の画像をFirebase Storageにアップロードし、Instagramにカルーセル投稿（複数画像）として自動投稿する仕組みを構築します。

---

## 実装手順

### Phase 1: ビューアー側で4方向の画像をキャプチャ

#### 1. `public/index.html` の修正（ビューアー部分）

焼き上げアニメーション中に4方向（0°, 90°, 180°, 270°）から画像をキャプチャします。

```javascript
// 既存のstartFiringAnimation関数を修正
function startFiringAnimation(saveData) {
  isFiring = true;
  firingStartTime = performance.now();

  const overlay = document.getElementById('firing-overlay');
  overlay.classList.add('active');
  
  // 4方向の画像を保存する配列
  const capturedImages = [];
  const captureAngles = [0, Math.PI / 2, Math.PI, Math.PI * 3 / 2]; // 0°, 90°, 180°, 270°
  let currentCaptureIndex = 0;

  function firingTick() {
    if (!isFiring) return;
    const elapsed = performance.now() - firingStartTime;
    const progress = Math.min(elapsed / FIRING_TOTAL, 1);

    // 焼き上げアニメーション（既存のコード）
    if (elapsed < FIRING_HEAT_DURATION) {
      const heatProgress = elapsed / FIRING_HEAT_DURATION;
      const heatIntensity = Math.sin(heatProgress * Math.PI) * 0.8 + heatProgress * 0.6;
      
      [matDisplacement, matParallax, matBump].forEach(mat => {
        mat.emissive = new THREE.Color(heatIntensity * 0.8, heatIntensity * 0.15, 0);
        mat.emissiveIntensity = heatIntensity * 2;
      });
      
      vase.rotation.y += 0.03;
    } else {
      const coolProgress = (elapsed - FIRING_HEAT_DURATION) / FIRING_COOL_DURATION;
      const coolIntensity = (1 - coolProgress) * 1.4;
      
      [matDisplacement, matParallax, matBump].forEach(mat => {
        mat.emissive = new THREE.Color(coolIntensity * 0.5, coolIntensity * 0.08, coolIntensity * 0.02);
        mat.emissiveIntensity = coolIntensity;
      });
      
      vase.rotation.y += 0.02 * (1 - coolProgress) + 0.004;
      
      // 冷却フェーズで4方向の画像をキャプチャ
      if (currentCaptureIndex < captureAngles.length) {
        const targetAngle = captureAngles[currentCaptureIndex];
        const currentAngle = vase.rotation.y % (Math.PI * 2);
        
        // 目標角度に近づいたらキャプチャ
        if (Math.abs(currentAngle - targetAngle) < 0.1) {
          renderer.setRenderTarget(null);
          renderer.render(scene, camera);
          const imageData = renderer.domElement.toDataURL('image/jpeg', 0.9);
          capturedImages.push(imageData);
          currentCaptureIndex++;
          console.log(`Captured image ${currentCaptureIndex}/4 at angle ${targetAngle}`);
        }
      }
    }

    if (progress >= 1) {
      isFiring = false;
      [matDisplacement, matParallax, matBump].forEach(mat => {
        mat.emissive = originalEmissive.clone();
        mat.emissiveIntensity = 1;
      });
      
      overlay.classList.remove('active');
      
      // 4方向の画像をFirebase Storageにアップロード
      uploadImagesToFirebaseAndPost(saveData, capturedImages);
      return;
    }

    requestAnimationFrame(firingTick);
  }

  requestAnimationFrame(firingTick);
}
```

---

### Phase 2: Firebase Storageへのアップロード

#### 2. アップロード関数の実装

```javascript
async function uploadImagesToFirebaseAndPost(saveData, capturedImages) {
  const workId = 'work_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  
  if (!storage || !firebaseReady) {
    console.warn('Firebase Storage not available');
    socket.emit('saveComplete', { workId, thumbnailUrl: capturedImages[0] });
    return;
  }

  try {
    console.log('Uploading 4 images to Firebase Storage...');
    const uploadPromises = capturedImages.map(async (imageData, index) => {
      const storageRef = storage.ref(`${GALLERY_PATH}/${workId}/view_${index}.jpg`);
      await storageRef.putString(imageData, 'data_url');
      const downloadUrl = await storageRef.getDownloadURL();
      console.log(`Image ${index + 1}/4 uploaded:`, downloadUrl);
      return downloadUrl;
    });

    const imageUrls = await Promise.all(uploadPromises);
    console.log('All images uploaded successfully:', imageUrls);

    // Firestoreに保存
    await db.collection(GALLERY_PATH).doc(workId).set({
      displacementData: saveData.displacementData,
      effectValues: saveData.effectValues,
      vaseShape: saveData.vaseShape,
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      thumbnailUrl: imageUrls[0],
      imageUrls: imageUrls, // 4方向の画像URL
      mode: saveData.mode,
      signatureData: saveData.signatureData
    });

    // サーバーAPIにも保存（Instagram投稿用）
    await fetch('/api/works/' + workId, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        displacementData: saveData.displacementData,
        effectValues: saveData.effectValues,
        vaseShape: saveData.vaseShape,
        mode: saveData.mode,
        thumbnailUrl: imageUrls[0],
        imageUrls: imageUrls, // 4方向の画像URL
        signatureData: saveData.signatureData
      })
    });

    console.log('Work saved with 4 images:', workId);
    socket.emit('saveComplete', { workId, thumbnailUrl: imageUrls[0] });

  } catch (error) {
    console.error('Firebase upload error:', error);
    socket.emit('saveComplete', { workId, thumbnailUrl: capturedImages[0] });
  }
}
```

---

### Phase 3: サーバー側でInstagramカルーセル投稿

#### 3. `server.js` の修正

Instagramカルーセル投稿（複数画像）をサポートします。

```javascript
// Save a work (修正版)
app.post('/api/works/:id', async (req, res) => {
  const id = req.params.id;
  const workData = { ...req.body, savedAt: Date.now() };
  works.set(id, workData);
  console.log(`Work saved: ${id} (total: ${works.size})`);

  // Auto-post to Instagram if configured
  if (INSTAGRAM_ACCESS_TOKEN && INSTAGRAM_ACCOUNT_ID && workData.imageUrls && workData.imageUrls.length > 0) {
    try {
      console.log('Attempting to post carousel to Instagram...');
      
      // カルーセル投稿の場合
      if (workData.imageUrls.length > 1) {
        const instagramResponse = await fetch(`http://localhost:${PORT}/api/instagram/carousel`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageUrls: workData.imageUrls,
            caption: `新しい作品が完成しました！🎨✨\n\n4方向からご覧ください 👀\n\n#EmotionPaint #陶芸 #アート #感情を描く壺\n\n@atelier_kanna1212`
          })
        });

        const instagramResult = await instagramResponse.json();
        if (instagramResult.success) {
          console.log('✅ Successfully posted carousel to Instagram:', instagramResult.instagramPostId);
          workData.instagramPostId = instagramResult.instagramPostId;
        } else {
          console.warn('⚠️ Instagram carousel post failed:', instagramResult.error);
        }
      }
    } catch (error) {
      console.error('❌ Instagram auto-post error:', error.message);
    }
  }

  res.json({ ok: true, id });
});

// Instagram Carousel Post API (新規追加)
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

    // Step 3: カルーセルを公開
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
```

---

## 実装のポイント

### 1. **4方向キャプチャのタイミング**
- 焼き上げアニメーションの冷却フェーズ（3秒〜6秒）で実施
- 壺が回転しながら、0°, 90°, 180°, 270°の角度で自動キャプチャ

### 2. **Firebase Storageの利点**
- 公開URLが取得できる（Instagram APIが要求）
- 永続的な保存
- CDN経由で高速配信

### 3. **Instagramカルーセル投稿**
- 最大10枚まで投稿可能（今回は4枚）
- スワイプで複数画像を閲覧可能
- より魅力的な投稿になる

---

## テスト手順

1. **ローカルでテスト**
   ```bash
   npm start
   ```

2. **作品を作成して保存**
   - コントローラーで作品を作成
   - 「保存する」→ サイン → 「かんせい！」

3. **ログを確認**
   ```
   Captured image 1/4 at angle 0
   Captured image 2/4 at angle 1.5707963267948966
   Captured image 3/4 at angle 3.141592653589793
   Captured image 4/4 at angle 4.71238898038469
   Uploading 4 images to Firebase Storage...
   Image 1/4 uploaded: https://firebasestorage.googleapis.com/...
   Image 2/4 uploaded: https://firebasestorage.googleapis.com/...
   Image 3/4 uploaded: https://firebasestorage.googleapis.com/...
   Image 4/4 uploaded: https://firebasestorage.googleapis.com/...
   Creating carousel with 4 images...
   ✅ Successfully posted carousel to Instagram: 123456789
   ```

4. **Instagramで確認**
   - @atelier_kanna1212 アカウントで投稿を確認
   - スワイプして4方向の画像を閲覧

---

## 注意事項

1. **Firebase Storageのセキュリティルール**
   ```javascript
   rules_version = '2';
   service firebase.storage {
     match /b/{bucket}/o {
       match /artifacts/{appId}/public/data/gallery/{workId}/{allPaths=**} {
         allow read: if true;
         allow write: if request.auth != null;
       }
     }
   }
   ```

2. **Instagram APIの制限**
   - 1時間あたり25投稿まで
   - 画像は公開URLである必要がある
   - 画像サイズ: 最小320px、最大1080px推奨

3. **コスト**
   - Firebase Storage: 無料枠 5GB/月
   - 超過分: $0.026/GB

---

## 次のステップ

実装が完了したら:
1. コードをコミット
2. GitHubにプッシュ
3. Render.comで自動デプロイ
4. 本番環境でテスト

これで4方向の画像をInstagramにカルーセル投稿できるようになります！🎨✨

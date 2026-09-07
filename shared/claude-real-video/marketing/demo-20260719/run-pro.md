# Pro 版真跑紀錄（crv-pro，/Users/leo/Projects/crv-pro/.venv）

## 實際指令

```
/usr/bin/time -p /Users/leo/Projects/crv-pro/.venv/bin/crv-pro input/nasa.mp4 -o crv-pro-out --senses --motion --viewer
```

（旗標以 `crv-pro --help` 實況為準：--senses、--motion、--viewer 皆存在。）

## 真實耗時（/usr/bin/time -p）

- real 124.10 秒
- user 380.42 秒
- sys 28.35 秒

（影片 164.8 秒 → 分析耗時約影片長度的 75%；含 mediapipe/CLIP/librosa 感知管線）

## 工具實際輸出摘要

```
✓ Done → crv-pro-out
  128 frames  (deduped from 172 extracted)  in crv-pro-out/frames
  manifest:   crv-pro-out/MANIFEST.txt
  viewer:     crv-pro-out/viewer.html
  transcript: crv-pro-out/transcript.txt
  perception: 51 events → crv-pro-out/perception.json (timeline also in MANIFEST.txt)
```

## 產出檔案清單（crv-pro-out/）

- MANIFEST.txt
- frames/（128 張 keyframe jpg + 目錄共 129 個項目）
- frames.json
- motion.json
- perception.json（51 個感知事件：mood / music / scene / OCR text）
- perception.wav
- source.mp4
- timeline.json
- transcript.json
- transcript.txt
- viewer.html

## Viewer 絕對路徑

/Users/leo/Projects/claude-real-video/marketing/demo-20260719/crv-pro-out/viewer.html

## 驗收截圖（shots/，headless Chromium 1600x1000 @2x，實際點擊語言切換鈕拍攝）

- /Users/leo/Projects/claude-real-video/marketing/demo-20260719/shots/viewer-default-page.png — Chrome --headless=new --screenshot 直拍的預設頁（viewer 預設語言是繁中：localStorage 無值時 fallback zh_tw）
- /Users/leo/Projects/claude-real-video/marketing/demo-20260719/shots/viewer-en.png — 點 EN 後
- /Users/leo/Projects/claude-real-video/marketing/demo-20260719/shots/viewer-zh-tw.png — 點 繁中 後
- /Users/leo/Projects/claude-real-video/marketing/demo-20260719/shots/viewer-zh-cn.png — 點 简中 後

語言切換是頁面右上角的 a[data-lang] 控制項，純 --screenshot 模式點不到；改用 Playwright（獨立 headless Chromium，經 localhost http server，因 file:// 被擋）真點擊後截圖。已目視驗證 EN 與繁中截圖：UI 標籤（PERCEPTION TIMELINE/感知時間軸、mood/氛圍、music/音樂）確實隨語言切換，transcript 與 OCR text 事件維持英文原文。

## 過程備註

- stdout 有無害警告：cv2 與 av 的 libavdevice 重複載入警告、librosa.beat.tempo FutureWarning、HF Hub 未帶 token 提示（模型仍正常載入，未重新下載大檔）。完整 stdout 在 run-pro-stdout.txt。
- 免費版與 Pro 版分開先後執行，避免 CPU 搶佔影響計時。

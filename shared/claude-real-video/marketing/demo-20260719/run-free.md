# 免費版真跑紀錄（claude-real-video 0.7.15）

## 實際指令

```
/usr/bin/time -p demo-venv/bin/crv input/nasa.mp4 -o crv-out --speakers --viewer
```

註：0.7.15 沒有 `--transcript` 旗標——逐字稿是預設行為（`--no-transcribe` 才會關掉）。`--speakers` 需先 `pip install 'claude-real-video[speakers]'`（sherpa-onnx 離線 diarization），已裝進 demo-venv。

## 真實耗時（/usr/bin/time -p）

- real 67.58 秒
- user 143.36 秒
- sys 13.51 秒

（影片 164.8 秒，2:45 → 分析耗時約影片長度的 41%）

## 抽幀結果（工具實際輸出）

```
✓ Done → crv-out
  132 frames  (deduped from 172 extracted)  in crv-out/frames
  manifest:   crv-out/MANIFEST.txt
  timestamps: crv-out/frames.json
  viewer:     crv-out/viewer.html
  transcript: crv-out/transcript.txt
```

即：抽出 172 幀、去重後保留 132 幀。

## 逐字稿前 10 行（crv-out/transcript.txt 原文）

```
[SPEAKER_00] The future of human space exploration is being driven by what we can discover and accomplish
[SPEAKER_00] on the moon.
[SPEAKER_00] And with NASA's confirmation of ice existing at the lunar South Pole, the critical task
[SPEAKER_00] of finding and mapping where water exists, what form it is in, and where it came from,
[SPEAKER_00] can now begin.
[SPEAKER_00] Leading us on that journey will be NASA's first mobile robotic mission on the moon, known
[SPEAKER_00] as Viper, the volatile investigating polar exploration rover.
[SPEAKER_00] It will be delivered to the nobile region of the South Pole as part of NASA's commercial
[SPEAKER_00] lunar payload services initiative.
[SPEAKER_00] This region sits just outside the western rim of nobile crater, and covers an area of
```

完整 stdout 存於 run-free-stdout.txt。

import time, shutil
from playwright.sync_api import sync_playwright

DEMO = "/Users/leo/Projects/claude-real-video/marketing/demo-20260719"
BASE = "http://localhost:8722"

def smooth_scroll(page, total_px, steps, step_ms):
    for i in range(steps):
        page.mouse.wheel(0, total_px/steps)
        page.wait_for_timeout(step_ms)

with sync_playwright() as p:
    browser = p.chromium.launch(channel="chrome", headless=True,
        args=["--window-size=1920,1080", "--hide-scrollbars", "--autoplay-policy=no-user-gesture-required"])

    # ---- 2. pro viewer ----
    ctx = browser.new_context(viewport={"width":1920,"height":1080},
        record_video_dir=DEMO+"/videos-pro", record_video_size={"width":1920,"height":1080})
    page = ctx.new_page()
    page.goto("file://"+DEMO+"/crv-pro-out/viewer.html")
    page.wait_for_timeout(2000)
    # ensure zh_tw
    page.locator('.lang a[data-lang="zh_tw"]').click()
    page.wait_for_timeout(800)

    # start playback from 0
    page.evaluate("document.getElementById('v').play()")
    page.wait_for_timeout(2800)

    # click 00:45 3D animation/CGI event
    ev1 = page.locator('.ev', has_text="3D 動畫／CGI (0.70)").first
    ev1.scroll_into_view_if_needed()
    page.wait_for_timeout(1200)
    ev1.hover()
    page.wait_for_timeout(600)
    ev1.click()
    page.wait_for_timeout(2000)

    # click 01:34 music building
    ev2 = page.locator('.ev[data-t="94.85"]').first
    ev2.scroll_into_view_if_needed()
    page.wait_for_timeout(1200)
    ev2.hover()
    page.wait_for_timeout(500)
    ev2.click()
    page.wait_for_timeout(1800)

    # click 01:36 text: Nobile Region
    ev3 = page.locator('.ev', has_text="文字：Nobile Region").first
    ev3.hover()
    page.wait_for_timeout(500)
    ev3.click()
    page.wait_for_timeout(2000)

    # language switch zh_tw -> EN -> zh_tw
    page.locator('.lang a[data-lang="en"]').click()
    page.wait_for_timeout(1500)
    page.locator('.lang a[data-lang="zh_tw"]').click()
    page.wait_for_timeout(1500)
    page.wait_for_timeout(1000)

    video = page.video
    ctx.close()
    shutil.move(video.path(), DEMO+"/pro-viewer.webm")
    print("pro-viewer.webm done")
    browser.close()

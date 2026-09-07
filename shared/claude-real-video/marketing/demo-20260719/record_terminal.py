import time, shutil, os
from playwright.sync_api import sync_playwright

DEMO = "/Users/leo/Projects/claude-real-video/marketing/demo-20260719"

with sync_playwright() as p:
    browser = p.chromium.launch(channel="chrome", headless=True,
        args=["--window-size=1920,1080", "--hide-scrollbars"])
    ctx = browser.new_context(viewport={"width":1920,"height":1080},
        record_video_dir=DEMO+"/videos-term", record_video_size={"width":1920,"height":1080})
    page = ctx.new_page()
    page.goto("http://localhost:8722/player.html")
    page.wait_for_timeout(2000)
    page.evaluate("window.startPlayback()")
    # wait until ended (cast total ~74.3s), poll
    deadline = time.time() + 110
    while time.time() < deadline:
        if page.evaluate("window.isEnded"):
            break
        page.wait_for_timeout(1000)
    page.wait_for_timeout(2000)
    video = page.video
    ctx.close()
    path = video.path()
    browser.close()

shutil.move(path, DEMO+"/terminal-raw.webm")
print("saved", DEMO+"/terminal-raw.webm")

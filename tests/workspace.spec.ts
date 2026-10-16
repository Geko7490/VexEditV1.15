import { expect, test } from "@playwright/test";

test("home navigation and project cards open a real timeline", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "VexEdit Studio" })).toBeVisible();
  await expect(page.getByRole("button", { name: "New Project" })).toBeVisible();
  await page.screenshot({ path: "test-results/home-desktop.png", fullPage: true });
  await page.getByRole("button", { name: "Projects", exact: true }).first().click();
  await expect(page.getByText("Midnight Edit").first()).toBeVisible();
  await page.getByRole("button", { name: "Open Midnight Edit" }).click();
  await expect(page.getByText("Timeline", { exact: true })).toBeVisible();
  await expect(page.locator(".timeline-clip.video")).toHaveCount(3);
  await expect(page.locator(".preview-frame img")).toBeVisible();
  await page.screenshot({ path: "test-results/editor-desktop.png", fullPage: true });
});

test("project search, favorite, rename, duplicate and delete are real actions", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Projects", exact: true }).first().click();
  await page.locator(".projects-grid .project-card").first().locator(".project-more").click();
  await page.getByRole("menu").getByRole("button", { name: "Add to favorites" }).click();
  await page.getByRole("button", { name: "Favorites" }).click();
  await expect(page.locator(".projects-grid .project-card")).toHaveCount(1);
  await page.locator(".projects-grid .project-more").click();
  await page.getByRole("menu").getByRole("button", { name: "Rename" }).click();
  await page.getByRole("dialog").getByLabel("Project name").fill("Midnight Cut");
  await page.getByRole("dialog").getByRole("button", { name: "Save" }).click();
  await page.getByPlaceholder("Search projects...").fill("Midnight Cut");
  await expect(page.locator(".projects-grid .project-card")).toHaveCount(1);
  await page.locator(".projects-grid .project-more").click();
  await page.getByRole("menu").getByRole("button", { name: "Duplicate" }).click();
  await page.getByRole("button", { name: "All", exact: true }).click();
  await expect(page.locator(".projects-grid .project-card")).toHaveCount(2);
  await page.locator(".projects-grid .project-card").first().locator(".project-more").click();
  await page.getByRole("menu").getByRole("button", { name: "Delete" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Delete" }).click();
  await expect(page.locator(".projects-grid .project-card")).toHaveCount(1);
});

test("new project, media import, split, undo, redo and reload", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "New Project" }).click();
  await page.getByLabel("Project name").fill("Test Sequence");
  await page.getByRole("dialog").getByRole("button", { name: "Create" }).click();
  await expect(page.getByText("Test Sequence").first()).toBeVisible();
  await page.getByRole("button", { name: "Add Media" }).first().click();
  await expect(page.locator(".media-tile")).toHaveCount(5);
  await page.locator(".media-tile").first().click();
  await expect(page.locator(".selection-count")).toContainText("1");
  await page.getByRole("button", { name: "Add to Timeline" }).click();
  await expect(page.locator(".timeline-clip.video")).toHaveCount(1);
  await page.locator(".timeline-ruler").click({ position: { x: 96, y: 17 } });
  await expect(page.locator(".time-readout").first()).toContainText("00:02");
  await page.getByRole("button", { name: "Split", exact: true }).first().click();
  await expect(page.locator(".timeline-clip.video")).toHaveCount(2);
  await page.getByRole("button", { name: "Undo" }).click();
  await expect(page.locator(".timeline-clip.video")).toHaveCount(1);
  await page.getByRole("button", { name: "Redo" }).click();
  await expect(page.locator(".timeline-clip.video")).toHaveCount(2);
  await page.reload();
  await page.getByRole("button", { name: "Open Test Sequence" }).click();
  await expect(page.locator(".timeline-clip.video")).toHaveCount(2);
});

test("a damaged project save falls back to the previous valid snapshot", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "New Project" }).click();
  await page.getByLabel("Project name").fill("Recovery Check");
  await page.getByRole("dialog").getByRole("button", { name: "Create" }).click();
  await page.evaluate(() => {
    const key = "vexedit-studio-workspace-v1";
    localStorage.setItem(`${key}-previous`, localStorage.getItem(key)!);
    localStorage.setItem(key, "{invalid json");
  });
  await page.reload();
  await expect(page.getByText("Recovery Check").first()).toBeVisible();
  const recoveryCopies = await page.evaluate(() => Object.keys(localStorage).filter((key) => key.includes("-invalid-")));
  expect(recoveryCopies).toHaveLength(1);
});

test("effect, keyframe and language controls update project state", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Open Midnight Edit" }).click();
  await page.locator(".timeline-clip.video").first().click();
  await page.getByRole("button", { name: "Effects", exact: true }).last().click();
  await page.getByRole("button", { name: "Noir" }).click();
  await page.getByRole("button", { name: "Apply" }).click();
  await expect(page.locator(".preview-frame img")).toHaveCSS("filter", /grayscale/);
  await page.getByRole("button", { name: "Keyframes" }).last().click();
  await page.getByRole("button", { name: "Add Keyframe" }).click();
  await expect(page.locator(".keyframe-marker")).toHaveCount(1);
  await page.getByRole("button", { name: "Settings", exact: true }).first().click();
  await page.getByRole("button", { name: "Türkçe" }).click();
  await expect(page.getByRole("heading", { name: "Ayarlar" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Ana Sayfa" }).first()).toBeVisible();
});

test("module center lists only included tools and opens a working tool", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Module Center" }).last().click();
  await expect(page.getByRole("heading", { name: "Built-in tools" })).toBeVisible();
  await page.getByRole("button", { name: "Audio", exact: true }).click();
  await expect(page.locator(".module-row")).toHaveCount(1);
  await page.locator(".module-action button").click();
  await expect(page.getByRole("heading", { name: "No audio clips yet" })).toBeVisible();
});

test("a browser file is stored and can be restored from project backup", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Import Media" }).click();
  await page.locator('input[type="file"][accept="video/*,image/*,audio/*"]').setInputFiles("public/images/coastline.jpg");
  await expect(page.locator(".selection-count")).toContainText("1");
  await page.getByRole("button", { name: "Add to Timeline" }).click();
  await expect(page.locator(".preview-frame img")).toBeVisible();
  await page.getByRole("button", { name: "Projects", exact: true }).first().click();
  await page.locator(".project-card").first().locator(".project-more").click();
  const backupDownload = page.waitForEvent("download");
  await page.getByRole("menu").getByRole("button", { name: "Backup" }).click();
  const backup = await backupDownload;
  expect(backup.suggestedFilename()).toContain("vexedit.json");
  const backupPath = await backup.path();
  expect(backupPath).not.toBeNull();
  await page.locator('input[type="file"][accept^=".json"]').setInputFiles(backupPath!);
  await expect(page.getByText("Untitled Project (restored)").first()).toBeVisible();
  await expect(page.locator(".preview-frame img")).toBeVisible();
});

test("silent WebM export reports real completion and downloads a file", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Open Summer Memories" }).click();
  await page.getByRole("button", { name: "Export", exact: true }).click();
  await expect(page.getByText("silent WebM", { exact: false })).toBeVisible();
  await page.getByRole("button", { name: "480p" }).click();
  const downloadPromise = page.waitForEvent("download", { timeout: 30_000 });
  await page.getByRole("button", { name: "Start Export" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/480p\.webm$/);
  await expect(page.getByText("Export complete", { exact: false })).toBeVisible();
});

test("a real VP9 video can be selected, previewed and rendered", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Import Media" }).click();
  await page.getByRole("button", { name: "Videos", exact: true }).click();
  await expect(page.locator(".media-tile")).toHaveCount(1);
  await page.locator(".media-tile").click();
  await page.getByRole("button", { name: "Add to Timeline" }).click();
  await expect(page.locator(".preview-frame video")).toBeVisible();
  await expect.poll(async () => page.locator(".preview-frame video").evaluate((video: HTMLVideoElement) => video.videoWidth)).toBe(640);
  await page.locator(".timeline-ruler").click({ position: { x: 48, y: 17 } });
  await expect(page.locator(".time-readout").first()).toContainText("00:01");
  await page.getByRole("button", { name: "Export", exact: true }).click();
  await page.getByRole("button", { name: "480p" }).click();
  const downloadPromise = page.waitForEvent("download", { timeout: 25_000 });
  await page.getByRole("button", { name: "Start Export" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/\.webm$/);
  await expect(page.getByText("Export complete", { exact: false })).toBeVisible();
});

test("imported WAV has real peaks and editable audio levels", async ({ page }) => {
  const sampleRate = 22_050;
  const samples = sampleRate * 2;
  const wav = Buffer.alloc(44 + samples * 2);
  wav.write("RIFF", 0);
  wav.writeUInt32LE(wav.length - 8, 4);
  wav.write("WAVEfmt ", 8);
  wav.writeUInt32LE(16, 16);
  wav.writeUInt16LE(1, 20);
  wav.writeUInt16LE(1, 22);
  wav.writeUInt32LE(sampleRate, 24);
  wav.writeUInt32LE(sampleRate * 2, 28);
  wav.writeUInt16LE(2, 32);
  wav.writeUInt16LE(16, 34);
  wav.write("data", 36);
  wav.writeUInt32LE(samples * 2, 40);
  for (let index = 0; index < samples; index++) {
    const envelope = 0.25 + 0.6 * Math.abs(Math.sin(index / 2_400));
    wav.writeInt16LE(Math.round(Math.sin(index * 440 * 2 * Math.PI / sampleRate) * 18_000 * envelope), 44 + index * 2);
  }

  await page.goto("/");
  await page.getByRole("button", { name: "Import Media" }).click();
  await page.locator('input[type="file"][accept="video/*,image/*,audio/*"]').setInputFiles({ name: "tone.wav", mimeType: "audio/wav", buffer: wav });
  await expect(page.locator(".media-tile .waveform i")).toHaveCount(70);
  await page.getByRole("button", { name: "Add to Timeline" }).click();
  await page.getByRole("button", { name: "Audio", exact: true }).last().click();
  await expect(page.locator(".timeline-clip.audio")).toHaveCount(1);
  await page.getByRole("spinbutton", { name: "Fade in (s)" }).fill("0.4");
  await expect(page.getByRole("spinbutton", { name: "Fade in (s)" })).toHaveValue("0.4");
  await page.locator(".mixer-switches button").first().click();
  await expect(page.locator(".mixer-switches button").first()).toHaveClass(/active/);
  await page.locator(".timeline-ruler").click({ position: { x: 33, y: 17 } });
  await page.getByRole("button", { name: "Split", exact: true }).click();
  await expect(page.locator(".timeline-clip.audio")).toHaveCount(2);
});

test("mobile home and media browser fit a phone viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "VexEdit Studio" })).toBeVisible();
  await expect(page.locator(".mobile-bottom-nav")).toBeVisible();
  await expect.poll(async () => page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await page.screenshot({ path: "test-results/home-mobile.png", fullPage: true });
  await page.getByRole("button", { name: "Import Media" }).click();
  await expect(page.locator(".media-tile")).toHaveCount(5);
  await expect(page.locator(".import-footer")).toBeInViewport();
  await page.screenshot({ path: "test-results/import-mobile.png", fullPage: true });
  await page.locator(".media-tile").first().click();
  await page.getByRole("button", { name: "Add to Timeline" }).click();
  await expect(page.locator(".timeline-shell")).toBeVisible();
  await page.screenshot({ path: "test-results/editor-mobile.png", fullPage: true });
});

test("layouts do not create horizontal document overflow", async ({ page }) => {
  for (const width of [320, 768, 900, 1024, 1440]) {
    await page.setViewportSize({ width, height: 850 });
    await page.goto("/");
    await expect.poll(async () => page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
  }
  await page.setViewportSize({ width: 320, height: 740 });
  await page.getByRole("button", { name: "Settings", exact: true }).last().click();
  await page.getByRole("button", { name: "Türkçe" }).click();
  await page.getByRole("button", { name: "Ana Sayfa" }).last().click();
  await expect.poll(async () => page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  await page.getByRole("button", { name: "Medya İçe Aktar" }).click();
  await expect.poll(async () => page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
});
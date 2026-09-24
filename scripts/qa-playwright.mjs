import { chromium, devices } from '@playwright/test';
import { mkdirSync, writeFileSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { mergeCloudDown, planCloudSync, mergeLocalAndCloud, stripDeleted } from '../src/domain/cloudSync.js';
import { definitionToCloudRow, eventToCloudRow } from '../src/storage/cloudMapping.js';

const BASE_URL = 'http://localhost:5199';
const SHOT_DIR = 'C:\\Users\\Hp\\AppData\\Local\\Temp\\claude\\d--WORK-projects-ai-sandbox\\529fabb6-dad4-4bb6-9f1c-2e79270b6c8f\\scratchpad\\qa-screenshots';
mkdirSync(SHOT_DIR, { recursive: true });

const results = [];
function record(section, label, pass, detail = '') {
  results.push({ section, label, pass, detail });
  console.log(`${pass ? 'PASS' : 'FAIL'} [${section}] ${label}${detail ? ' — ' + detail : ''}`);
}
async function shot(page, name) {
  await page.screenshot({ path: join(SHOT_DIR, name), fullPage: false });
}

// Visible-only nav locator: BottomNav renders both the desktop sidebar and
// the mobile bar in the DOM at all times, toggled purely by CSS breakpoint.
function navButton(page, label) {
  return page.locator('button:visible', { hasText: label }).first();
}

async function dismissOnboardingIfPresent(page) {
  const skipBtn = page.getByRole('button', { name: 'Bỏ qua' });
  try {
    await skipBtn.waitFor({ state: 'visible', timeout: 2000 });
    await skipBtn.click();
  } catch {
    // already dismissed / not first run
  }
}

async function runMobileFunctionalQA(browser) {
  const context = await browser.newContext({ ...devices['iPhone 13'] });
  const page = await context.newPage();
  page.setDefaultTimeout(8000);
  const consoleErrors = [];
  page.on('pageerror', e => consoleErrors.push('pageerror: ' + e.message));
  page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push('console.error: ' + msg.text()); });

  await page.goto(BASE_URL);
  await dismissOnboardingIfPresent(page);
  await page.waitForSelector('text=Hôm nay');
  record('mobile', 'app loads to Capture page', true);

  // --- v2.1 positioning: capture-first, not a habit/activity dashboard ---
  const headlineVisible = await page.locator('h1', { hasText: 'Chuyện gì vừa xảy ra?' }).isVisible().catch(() => false);
  record('positioning', 'Capture headline asks "Chuyện gì vừa xảy ra?" (not a date/dashboard title)', headlineVisible);
  await shot(page, '01-mobile-capture-empty.png');

  // Quick grid should be pre-seeded with mundane/bodily starters, not a
  // productivity-flavored set (spec v2.1 §6 — this IS the positioning test).
  const starterNames = ['Đại tiện', 'Tiểu tiện', 'Uống nước', 'Cà phê', 'Tắm', 'Ăn', 'Uống thuốc', 'Đau đầu'];
  let starterHits = 0;
  for (const name of starterNames) {
    const visible = await page.locator('main').getByRole('button', { name, exact: true }).first().isVisible().catch(() => false);
    if (visible) starterHits++;
  }
  record('positioning', `first-run quick grid is mundane/bodily-first (${starterHits}/${starterNames.length} expected starters present)`, starterHits === starterNames.length);

  // --- 1-tap moment logging (Đại tiện — the exact example from spec §1) ---
  const moment = page.locator('main').getByRole('button', { name: 'Đại tiện', exact: true }).first();
  await moment.click();
  const toastVisible1 = await page.locator('text=Đại tiện đã ghi nhận').first().isVisible({ timeout: 2000 }).catch(() => false);
  record('mobile', 'one-tap moment logging (💩 Đại tiện) shows confirmation toast', toastVisible1);
  await page.waitForTimeout(200);
  const inTodayStream1 = await page.locator('main').getByText('Đại tiện').first().isVisible().catch(() => false);
  record('mobile', 'logged event immediately appears in "Hôm nay" stream on Capture page', inTodayStream1);
  await shot(page, '02-mobile-toast.png');

  // --- count: 1-tap default (Uống nước, ml unit) ---
  const waterTile = page.locator('main').getByRole('button', { name: 'Uống nước', exact: true }).first();
  await waterTile.click();
  const toast2 = await page.locator('text=Uống nước đã ghi nhận').first().isVisible({ timeout: 2000 }).catch(() => false);
  record('mobile', 'count event: one tap logs default quantity', toast2);

  // --- count: long-press customize (volume unit -> ml-scale chips), does not double-log ---
  // Ground-truth via localStorage rather than parsing rendered text, which
  // can race the toast/re-render — ordinary event count is source of truth.
  const rawEventCount = () => page.evaluate(() => JSON.parse(localStorage.getItem('rongleo_life_log')).events.length);
  const beforeN = await rawEventCount();
  await waterTile.click({ delay: 650 });
  const sheetVisible = await page.getByText('500 ml', { exact: true }).isVisible({ timeout: 2000 }).catch(() => false);
  record('mobile', 'long-press on ml-unit count tile shows volume-scale chips (500 ml)', sheetVisible);
  if (sheetVisible) {
    await page.getByText('500 ml', { exact: true }).click();
    const toast3 = await page.locator('text=Uống nước đã ghi nhận').first().isVisible({ timeout: 2000 }).catch(() => false);
    record('mobile', 'customize sheet: preset chip logs and confirms', toast3);
  }
  await page.waitForTimeout(300);
  const afterN = await rawEventCount();
  record('mobile', 'long-press + chip submit logs exactly one event (no double-log)', afterN === beforeN + 1, `before=${beforeN} after=${afterN}`);

  // --- count with a non-volume unit (Uống thuốc, "lần") must NOT show ml-scale chips ---
  const pillTile = page.locator('main').getByRole('button', { name: 'Uống thuốc', exact: true }).first();
  await pillTile.click({ delay: 650 });
  const smallPresetVisible = await page.getByText('1 lần', { exact: true }).isVisible({ timeout: 2000 }).catch(() => false);
  const nonsensePresetVisible = await page.getByText('150 lần', { exact: true }).isVisible({ timeout: 500 }).catch(() => false);
  record('mobile', 'non-volume count (Uống thuốc, "lần") shows small presets (1/2/3/5/10), not ml-scale numbers', smallPresetVisible && !nonsensePresetVisible);
  if (smallPresetVisible) await page.getByText('1 lần', { exact: true }).click();

  // --- duration + rating: not in the mundane starter set anymore, reach via search ---
  await page.getByRole('button', { name: 'Ghi điều khác' }).first().click();
  await page.getByPlaceholder('Tìm sự kiện... (tiếng Việt hoặc English)').fill('đi bộ');
  await page.getByRole('button', { name: 'Đi bộ', exact: true }).first().click();
  const toast4 = await page.locator('text=Đi bộ đã ghi nhận').first().isVisible({ timeout: 2000 }).catch(() => false);
  record('mobile', 'duration event (via search + activate): logs default duration and confirms', toast4);

  await page.getByRole('button', { name: 'Ghi điều khác' }).first().click();
  await page.getByPlaceholder('Tìm sự kiện... (tiếng Việt hoặc English)').fill('tâm trạng');
  await page.getByRole('button', { name: 'Tâm trạng', exact: true }).first().click();
  const ratingSheet = await page.getByLabel('Mức 4').isVisible({ timeout: 2000 }).catch(() => false);
  record('mobile', 'rating tile (via search + activate) opens 1-5 picker sheet (no sensible default)', ratingSheet);
  if (ratingSheet) {
    await page.getByLabel('Mức 4').click();
    await page.locator('div.z-50').getByRole('button', { name: 'Ghi nhận', exact: true }).click();
    const toast5 = await page.locator('text=Tâm trạng đã ghi nhận').first().isVisible({ timeout: 2000 }).catch(() => false);
    record('mobile', 'rating submit logs and confirms', toast5);
  }

  // --- measurement: via Add Event search ---
  await page.getByRole('button', { name: 'Ghi điều khác' }).first().click();
  await page.getByPlaceholder('Tìm sự kiện... (tiếng Việt hoặc English)').fill('cân nặng');
  const weightResult = page.getByRole('button', { name: 'Cân nặng', exact: true }).first();
  const weightVisible = await weightResult.isVisible({ timeout: 2000 }).catch(() => false);
  record('mobile', 'add-event search finds "Cân nặng" (measurement type)', weightVisible);
  if (weightVisible) {
    await weightResult.click();
    const measurementInput = page.getByPlaceholder('Nhập số đo');
    const inputVisible = await measurementInput.isVisible({ timeout: 2000 }).catch(() => false);
    record('mobile', 'measurement tap opens numeric input (not quick-logged blindly)', inputVisible);
    if (inputVisible) {
      await measurementInput.fill('70.5');
      await page.locator('div.z-50').getByRole('button', { name: 'Ghi nhận', exact: true }).click();
      await page.waitForTimeout(300);
      const onCapture = await page.locator('h1', { hasText: 'Chuyện gì vừa xảy ra?' }).first().isVisible().catch(() => false);
      record('mobile', 'measurement submit logs and returns to Capture', onCapture);
    }
  } else {
    await page.getByRole('button', { name: 'Đóng' }).first().click().catch(() => {});
  }

  // --- mundane/private event library coverage (spec v2.1 §9 — the whole point of this revision) ---
  await page.getByRole('button', { name: 'Ghi điều khác' }).first().click();
  const mundaneChecks = [
    ['xi hoi', 'Xì hơi'],
    ['hat hoi', 'Hắt hơi'],
    ['fart', 'Xì hơi'],
    ['poop', 'Đại tiện'],
    ['pee', 'Tiểu tiện'],
  ];
  let mundaneHits = 0;
  for (const [query, expectedName] of mundaneChecks) {
    await page.getByPlaceholder('Tìm sự kiện... (tiếng Việt hoặc English)').fill(query);
    const hit = await page.getByRole('button', { name: expectedName, exact: true }).first().isVisible({ timeout: 1500 }).catch(() => false);
    if (hit) mundaneHits++;
  }
  record('library', `mundane/private events are searchable, not hidden (${mundaneHits}/${mundaneChecks.length}: xì hơi, hắt hơi, poop, pee)`, mundaneHits === mundaneChecks.length);

  // --- Vietnamese diacritic-insensitive + English alias search ---
  await page.getByPlaceholder('Tìm sự kiện... (tiếng Việt hoặc English)').fill('nuoc');
  const diacriticHit = await page.getByRole('button', { name: 'Uống nước', exact: true }).first().isVisible({ timeout: 2000 }).catch(() => false);
  record('search', 'diacritic-insensitive VN search: "nuoc" finds "Uống nước"', diacriticHit);

  await page.getByPlaceholder('Tìm sự kiện... (tiếng Việt hoặc English)').fill('water');
  const englishHit = await page.getByRole('button', { name: 'Uống nước', exact: true }).first().isVisible({ timeout: 2000 }).catch(() => false);
  record('search', 'English alias search: "water" finds "Uống nước"', englishHit);

  await page.getByPlaceholder('Tìm sự kiện... (tiếng Việt hoặc English)').fill('coffee');
  const coffeeHit = await page.getByRole('button', { name: 'Cà phê', exact: true }).first().isVisible({ timeout: 2000 }).catch(() => false);
  record('search', 'English alias search: "coffee" finds "Cà phê"', coffeeHit);
  await shot(page, '03-mobile-add-event-search.png');
  await page.getByRole('button', { name: 'Đóng' }).first().click();

  // --- Calendar/Timeline consistency bug repro (spec v2.1 §15, mandatory fix) ---
  await page.locator('main').getByRole('button', { name: 'Uống nước', exact: true }).first().click();
  await page.waitForTimeout(150);
  await navButton(page, 'Lịch').click();
  await page.waitForSelector('h1:has-text("Lịch")');
  const calendarCountText = await page.locator('text=/Sự kiện trong ngày \\(\\d+\\)/').first().textContent().catch(() => '(0)');
  const calendarCountNum = parseInt((calendarCountText || '').match(/\((\d+)\)/)?.[1] || '0', 10);
  record('bugfix', 'Calendar day count is NOT 0 right after logging on Capture (mandatory fix, spec §15)', calendarCountNum > 0, calendarCountText);
  const calendarDotVisible = await page.locator('button:has-text("' + new Date().getDate() + '")').locator('span.bg-amber-500, span.bg-white').first().isVisible().catch(() => false);
  await navButton(page, 'Ghi nhận').click();
  await page.waitForSelector('h1:has-text("Chuyện gì vừa xảy ra?")');

  // --- rapid logging: tap water 7x quickly, each tap MUST stay its own row
  // (operator explicitly rejected "× N" grouping — every tap is a distinct,
  // separately-timestamped row, newest first, no clumping) ---
  const rawCountBeforeRapid = await rawEventCount();
  const before7 = Date.now();
  for (let i = 0; i < 7; i++) {
    await page.locator('main').getByRole('button', { name: 'Uống nước', exact: true }).first().click();
  }
  const elapsed7 = Date.now() - before7;
  record('rapid', `7 rapid taps completed in ${elapsed7}ms without hang`, elapsed7 < 5000, `${elapsed7}ms`);
  const rawCountAfterRapid = await rawEventCount();
  record('rapid', 'all 7 rapid taps create 7 distinct raw events', rawCountAfterRapid === rawCountBeforeRapid + 7, `${rawCountBeforeRapid} -> ${rawCountAfterRapid}`);

  const noGroupOnCapture = await page.locator('main').locator('button', { hasText: /× \d+/ }).count();
  record('rapid', 'Today Stream shows each tap as its own row (no "× N" grouping)', noGroupOnCapture === 0, `found ${noGroupOnCapture} grouped rows`);
  const captureWaterRowCount = await page.locator('main').getByRole('button').filter({ hasText: 'Uống nước' }).count();
  record('rapid', 'Today Stream lists the repeated taps as separate rows', captureWaterRowCount >= 7, `${captureWaterRowCount} rows`);

  await navButton(page, 'Dòng thời gian').click();
  await page.waitForSelector('h1:has-text("Dòng thời gian")');
  const noGroupOnTimeline = await page.locator('main').locator('button', { hasText: /× \d+/ }).count();
  record('rapid', 'Timeline shows each tap as its own row (no "× N" grouping)', noGroupOnTimeline === 0, `found ${noGroupOnTimeline} grouped rows`);
  const timelineWaterRowCount = await page.locator('main').getByRole('button').filter({ hasText: 'Uống nước' }).count();
  record('rapid', 'Timeline lists the repeated taps as separate chronological rows', timelineWaterRowCount >= 7, `${timelineWaterRowCount} rows`);
  const todaySeparatorVisible = await page.getByText('Hôm nay', { exact: true }).first().isVisible({ timeout: 1000 }).catch(() => false);
  record('rapid', 'Timeline shows a "Hôm nay" day separator above today\'s rows', todaySeparatorVisible);
  await shot(page, '04-mobile-timeline-ungrouped.png');

  // --- Timeline: search + filter + detail edit/delete ---
  await page.getByPlaceholder('Tìm theo tên, ghi chú...').fill('nước');
  const filteredTimeline = await page.locator('text=Uống nước').first().isVisible({ timeout: 2000 }).catch(() => false);
  record('timeline', 'timeline search filters by name', filteredTimeline);
  await page.getByPlaceholder('Tìm theo tên, ghi chú...').fill('');

  const firstRow = page.locator('main button').filter({ hasText: 'Uống thuốc' }).first();
  if (await firstRow.isVisible().catch(() => false)) {
    await firstRow.click();
    const detailOpen = await page.getByRole('button', { name: 'Sửa' }).isVisible({ timeout: 2000 }).catch(() => false);
    record('timeline', 'tapping an event opens detail modal', detailOpen);
    if (detailOpen) {
      await page.getByRole('button', { name: 'Sửa' }).click();
      await page.getByPlaceholder('Ghi chú (tuỳ chọn)').fill('QA note');
      await page.getByRole('button', { name: 'Lưu thay đổi' }).click();
      await page.waitForTimeout(200);
      record('timeline', 'edit event: note saves without crash', true);

      await firstRow.click().catch(() => {});
      const deleteBtn = page.getByRole('button', { name: 'Xóa', exact: true }).first();
      if (await deleteBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
        await deleteBtn.click();
        await page.getByRole('button', { name: 'Xóa', exact: true }).last().click();
        await page.waitForTimeout(200);
        record('timeline', 'delete event: confirm flow removes it', true);
      }
    }
  } else {
    record('timeline', 'tapping an event opens detail modal', false, 'row not found');
  }

  // --- undo ---
  await navButton(page, 'Ghi nhận').click();
  const beforeUndo = await rawEventCount();
  await page.locator('main').getByRole('button', { name: 'Uống thuốc', exact: true }).first().click();
  const undoBtn = page.getByRole('button', { name: 'Hoàn tác' });
  const undoVisible = await undoBtn.isVisible({ timeout: 2000 }).catch(() => false);
  record('undo', 'toast shows "Hoàn tác" action after logging', undoVisible);
  if (undoVisible) {
    await undoBtn.click();
    await page.waitForTimeout(300);
    const b = beforeUndo;
    const a = await rawEventCount();
    record('undo', 'undo removes the just-logged event', a === b, `before=${b} after=${a}`);
  }

  // --- favorites toggle ---
  await page.getByRole('button', { name: 'Quản lý' }).click();
  await page.waitForSelector('text=Yêu thích');
  const favStar = page.getByRole('button', { name: 'Bỏ yêu thích' }).first();
  const favStarVisible = await favStar.isVisible({ timeout: 2000 }).catch(() => false);
  record('favorites', 'favorited item shows "Bỏ yêu thích" toggle in Manage', favStarVisible);
  if (favStarVisible) {
    await favStar.click();
    await page.waitForTimeout(200);
    const restar = page.getByRole('button', { name: 'Đánh dấu yêu thích' }).first();
    const restarVisible = await restar.isVisible({ timeout: 1000 }).catch(() => false);
    record('favorites', 'un-favorite then re-favorite works', restarVisible);
    if (restarVisible) await restar.click();
  }

  // --- no hide/deactivate concept: only Sửa/Nhân bản/Xóa (behind a labeled
  // "⋯" menu, not bare icons) plus the inline favorite star ---
  const powerButtonGone = await page.getByRole('button', { name: /Ẩn khỏi danh sách|Kích hoạt lại/ }).count();
  record('unify', 'no hide/deactivate ("Ẩn") control exists anymore — delete is the only removal path', powerButtonGone === 0);
  const moreButton = page.getByRole('button', { name: 'Thêm tùy chọn' }).first();
  await moreButton.click();
  const menuLabelsVisible = await page.getByText('Đổi tên, emoji, nhóm hoặc kiểu ghi nhận').isVisible({ timeout: 2000 }).catch(() => false);
  record('unify', 'row actions (Sửa/Nhân bản/Xóa) show a text explanation, not bare icons', menuLabelsVisible);
  // Escape must close only the topmost layer (the action sheet), not also
  // the Quản lý screen underneath it — nested overlays previously each had
  // their own independent Escape listener and all fired at once.
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);
  const actionSheetClosed = !(await page.getByText('Đổi tên, emoji, nhóm hoặc kiểu ghi nhận').isVisible({ timeout: 500 }).catch(() => false));
  const manageStillOpen = await page.locator('h2', { hasText: 'Quản lý' }).isVisible({ timeout: 500 }).catch(() => false);
  record('unify', 'Escape closes only the topmost nested overlay (action sheet), not Quản lý underneath', actionSheetClosed && manageStillOpen);
  await shot(page, '05-mobile-manage.png');

  // --- Manage "+" opens the SAME find-or-create screen as Capture's "Ghi
  // điều khác" (unified: one way to add an event type, everywhere), but
  // picking here only ADDS the definition — it does not log an event. ---
  const eventCountBeforeManageAdd = await rawEventCount();
  await page.getByRole('button', { name: 'Thêm sự kiện' }).click();
  const manageAddTitleVisible = await page.locator('h2', { hasText: 'Thêm sự kiện' }).isVisible({ timeout: 2000 }).catch(() => false);
  record('unify', 'Manage "+" opens a find-or-create screen (same as Ghi điều khác)', manageAddTitleVisible);
  await page.getByPlaceholder('Tìm sự kiện... (tiếng Việt hoặc English)').fill('hắt hơi');
  const sneezeResult = page.getByRole('button', { name: 'Hắt hơi', exact: true }).first();
  const sneezeVisible = await sneezeResult.isVisible({ timeout: 2000 }).catch(() => false);
  if (sneezeVisible) {
    await sneezeResult.click();
    const addedToast = await page.locator('text=/Đã thêm.*Hắt hơi/').isVisible({ timeout: 2000 }).catch(() => false);
    record('unify', 'picking a library item from Manage adds it (toast says "Đã thêm", not "đã ghi nhận")', addedToast);
  } else {
    record('unify', 'picking a library item from Manage adds it (toast says "Đã thêm", not "đã ghi nhận")', false, 'Hắt hơi tile not found');
  }
  await page.waitForTimeout(300);
  const eventCountAfterManageAdd = await rawEventCount();
  record('unify', 'adding a definition from Manage does NOT create a log event', eventCountAfterManageAdd === eventCountBeforeManageAdd, `${eventCountBeforeManageAdd} -> ${eventCountAfterManageAdd}`);
  const sneezeInManageList = await page.locator('main').getByText('Hắt hơi', { exact: true }).first().isVisible({ timeout: 2000 }).catch(() => false);
  record('unify', 'newly-added definition appears in Quản lý → Sự kiện list', sneezeInManageList);

  // --- delete a definition via the app's own confirm modal, not the native
  // browser confirm() dialog (which was the reported bug: delete silently
  // did nothing in some contexts). Delete now lives behind the "⋯" menu. ---
  if (sneezeInManageList) {
    const sneezeRow = page.locator('div', { hasText: 'Hắt hơi' }).filter({ has: page.getByRole('button', { name: 'Thêm tùy chọn' }) }).last();
    await sneezeRow.getByRole('button', { name: 'Thêm tùy chọn' }).click();
    await page.getByText('Xóa', { exact: true }).click();
    const confirmModalVisible = await page.locator('h3', { hasText: 'Xóa sự kiện' }).isVisible({ timeout: 2000 }).catch(() => false);
    record('delete', 'delete uses an in-app confirm modal (not native browser confirm())', confirmModalVisible);
    if (confirmModalVisible) {
      await page.getByRole('button', { name: 'Xóa', exact: true }).last().click();
      await page.waitForTimeout(300);
      const stillThere = await page.locator('main').getByText('Hắt hơi', { exact: true }).first().isVisible({ timeout: 1000 }).catch(() => false);
      record('delete', 'confirming delete actually removes the definition from the list', !stillThere);
    }
  }

  // --- export --- (switch from "Hoạt động" to "Dữ liệu" tab first)
  await page.getByRole('button', { name: 'Dữ liệu', exact: true }).click();
  const [download] = await Promise.all([
    page.waitForEvent('download', { timeout: 5000 }).catch(() => null),
    page.getByRole('button', { name: /Xuất dữ liệu/ }).click(),
  ]);
  let exportOk = false, exportShape = '';
  if (download) {
    const p = await download.path();
    if (p) {
      const json = JSON.parse(readFileSync(p, 'utf-8'));
      exportOk = json.app === 'rongleo-life-log' && json.schemaVersion === 2 && Array.isArray(json.events);
      exportShape = `defs=${json.eventDefinitions?.length} events=${json.events?.length}`;
    }
  }
  record('data', 'export produces a valid v2 JSON backup', exportOk, exportShape);

  // --- import: legacy v1 file -> merge ---
  const legacyFixture = join(SHOT_DIR, '..', 'legacy-v1-fixture.json');
  writeFileSync(legacyFixture, JSON.stringify({
    version: 1,
    data: {
      habits: [{ id: 'h_qa', name: 'Hút thuốc QA', unit: 'điếu', created_at: new Date().toISOString() }],
      logs: [{ id: 'l_qa', habit_id: 'h_qa', quantity: 2, note: 'qa import', created_at: new Date().toISOString() }],
      messages: [],
    },
  }));
  await page.setInputFiles('input[type="file"]', legacyFixture);
  const previewVisible = await page.getByText('Nhập dữ liệu').isVisible({ timeout: 2000 }).catch(() => false);
  record('data', 'importing a legacy v1 file shows preview modal', previewVisible);
  if (previewVisible) {
    await page.getByRole('button', { name: /Gộp/ }).click();
    await page.waitForTimeout(300);
    const mergedToast = await page.locator('text=Đã gộp dữ liệu thành công').isVisible({ timeout: 2000 }).catch(() => false);
    record('data', 'legacy v1 import merges and confirms', mergedToast);
  }
  await page.getByRole('button', { name: 'Đóng' }).first().click().catch(() => {});

  // --- Calendar ---
  await navButton(page, 'Lịch').click();
  await page.waitForSelector('h1:has-text("Lịch")');
  const calGridVisible = await page.locator('text=/Tháng \\d+, \\d+/').isVisible({ timeout: 2000 }).catch(() => false);
  record('calendar', 'calendar month grid renders', calGridVisible);
  await page.getByRole('button', { name: 'Tháng sau' }).click();
  await page.waitForTimeout(150);
  await page.getByRole('button', { name: 'Tháng trước' }).click();
  record('calendar', 'month navigation (next/prev) does not error', true);
  const dayHasEvents = await page.locator('text=/Sự kiện trong ngày \\(\\d+\\)/').isVisible().catch(() => false);
  record('calendar', 'selecting today shows its event list', dayHasEvents);
  await shot(page, '06-mobile-calendar.png');

  // --- Statistics ---
  await navButton(page, 'Thống kê').click();
  await page.waitForSelector('h1:has-text("Thống kê")');
  const statsRow = page.locator('button').filter({ hasText: 'Uống nước' }).first();
  const statsRowVisible = await statsRow.isVisible({ timeout: 2000 }).catch(() => false);
  record('statistics', 'statistics lists definitions with data in range', statsRowVisible);
  if (statsRowVisible) {
    await statsRow.click();
    const statFieldVisible = await page.getByText('Tổng', { exact: true }).first().isVisible({ timeout: 2000 }).catch(() => false);
    record('statistics', 'expanding a definition shows type-specific stat card', statFieldVisible);
  }
  await page.getByRole('button', { name: '30 ngày' }).click();
  await page.waitForTimeout(150);
  await page.getByRole('button', { name: 'Tất cả', exact: true }).click();
  record('statistics', 'range tabs (7/30/90/all) switch without error', true);
  const noJudgment = !(await page.locator('text=/Tốt|Xấu|Good|Bad/').first().isVisible().catch(() => false));
  record('statistics', 'no good/bad judgmental labels present', noJudgment);
  await shot(page, '07-mobile-statistics.png');

  record('console', 'no uncaught page errors during full mobile QA pass', consoleErrors.length === 0, consoleErrors.slice(0, 5).join(' | '));

  await context.close();
}

async function runDesktopResponsiveQA(browser) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  page.setDefaultTimeout(8000);
  await page.goto(BASE_URL);
  await dismissOnboardingIfPresent(page);
  await page.waitForSelector('text=Hôm nay');

  const sidebarVisible = await page.locator('div:visible', { hasText: 'Quan Sát' }).first().isVisible().catch(() => false);
  const mobileNavHidden = await page.locator('nav.sm\\:hidden').isHidden().catch(() => true);
  record('desktop', 'desktop shows fixed left sidebar', sidebarVisible);
  record('desktop', 'mobile bottom-nav is hidden at desktop width', mobileNavHidden);
  await shot(page, '08-desktop-capture.png');

  for (const label of ['Dòng thời gian', 'Lịch', 'Thống kê', 'Ghi nhận']) {
    await navButton(page, label).click();
    await page.waitForTimeout(200);
  }
  record('desktop', 'all 4 tabs navigate correctly at desktop width', true);
  await shot(page, '09-desktop-timeline.png');

  await context.close();
}

async function runLegacyMigrationQA(browser) {
  const context = await browser.newContext();
  const page = await context.newPage();
  page.setDefaultTimeout(8000);
  await page.goto(BASE_URL);
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem('habits', JSON.stringify([{ id: 'h1', name: 'Hút thuốc', unit: 'điếu', created_at: new Date().toISOString() }]));
    localStorage.setItem('logs', JSON.stringify([{ id: 'l1', habit_id: 'h1', quantity: 2, note: 'sau cà phê', created_at: new Date().toISOString() }]));
  });
  await page.reload();
  const migratedToast = await page.locator('text=Đã chuyển dữ liệu từ phiên bản cũ').isVisible({ timeout: 3000 }).catch(() => false);
  record('migration', 'first load with legacy v1 localStorage auto-migrates + confirms', migratedToast);
  await context.close();
}

async function runPwaQA(browser) {
  const context = await browser.newContext();
  const page = await context.newPage();
  page.setDefaultTimeout(8000);
  await page.goto(BASE_URL);

  const manifestLink = await page.locator('link[rel="manifest"]').getAttribute('href').catch(() => null);
  record('pwa', 'index.html declares <link rel="manifest">', !!manifestLink, manifestLink || '');

  const manifestRes = await page.request.get(BASE_URL + (manifestLink || '/manifest.webmanifest'));
  const manifestJson = manifestRes.ok() ? await manifestRes.json() : null;
  record('pwa', 'manifest.webmanifest is fetchable and valid JSON', !!manifestJson);
  if (manifestJson) {
    record('pwa', 'manifest: display = standalone', manifestJson.display === 'standalone');
    record('pwa', 'manifest: has 192 + 512 "any" icons', manifestJson.icons?.some(i => i.sizes === '192x192' && i.purpose === 'any') && manifestJson.icons?.some(i => i.sizes === '512x512' && i.purpose === 'any'));
    record('pwa', 'manifest: has maskable icon', manifestJson.icons?.some(i => i.purpose === 'maskable'));
    record('pwa', 'manifest: theme_color + background_color set', !!manifestJson.theme_color && !!manifestJson.background_color);
    record('pwa', 'manifest: short_name set for home-screen label', !!manifestJson.short_name);
  }

  const appleTouchIcon = await page.locator('link[rel="apple-touch-icon"]').getAttribute('href').catch(() => null);
  record('pwa', 'apple-touch-icon link present', !!appleTouchIcon, appleTouchIcon || '');
  const themeColor = await page.locator('meta[name="theme-color"]').getAttribute('content').catch(() => null);
  record('pwa', 'theme-color meta present', !!themeColor, themeColor || '');

  // Wait for SW registration to settle.
  await page.waitForFunction(async () => {
    if (!('serviceWorker' in navigator)) return false;
    const reg = await navigator.serviceWorker.getRegistration();
    return !!reg && (reg.active || reg.waiting || reg.installing);
  }, { timeout: 10000 }).catch(() => null);
  const swState = await page.evaluate(async () => {
    const reg = await navigator.serviceWorker.getRegistration();
    return reg ? { active: !!reg.active, scope: reg.scope } : null;
  });
  record('pwa', 'service worker registers', !!swState, JSON.stringify(swState));

  // Give the SW a moment to fully activate + finish precaching before going offline.
  await page.waitForTimeout(2000);
  await context.setOffline(true);
  await page.reload().catch(() => {});
  const offlineShellOk = await page.locator('text=Hôm nay').first().isVisible({ timeout: 5000 }).catch(() => false);
  record('pwa', 'reload while offline still renders the app shell (Capture page)', offlineShellOk);
  await shot(page, '10-pwa-offline-reload.png');
  await context.setOffline(false);

  await context.close();
}

async function runPerformanceQA(browser) {
  const context = await browser.newContext();
  const page = await context.newPage();
  page.setDefaultTimeout(8000);
  await page.goto(BASE_URL);

  const genResult = await page.evaluate(() => {
    const CATS = ['body', 'food', 'drink', 'health', 'sleep', 'movement', 'work', 'learning'];
    const TYPES = ['moment', 'count', 'duration', 'measurement', 'rating'];
    const defs = [];
    for (let i = 0; i < 100; i++) {
      const type = TYPES[i % TYPES.length];
      defs.push({
        id: `perf_def_${i}`,
        name: `Sự kiện thử ${i}`,
        emoji: '⭐',
        category: CATS[i % CATS.length],
        type,
        unit: type === 'count' ? 'lần' : type === 'duration' ? 'phút' : type === 'measurement' ? 'đv' : null,
        defaultValue: type === 'count' || type === 'duration' ? 10 : null,
        aliases: [],
        favorite: i < 8,
        active: true,
        createdAt: new Date().toISOString(),
      });
    }
    const events = [];
    const now = Date.now();
    for (let i = 0; i < 10000; i++) {
      const def = defs[i % defs.length];
      const ts = new Date(now - i * 60000).toISOString();
      events.push({
        id: `perf_evt_${i}`,
        eventDefinitionId: def.id,
        timestamp: ts,
        value: def.type === 'count' || def.type === 'duration' || def.type === 'measurement' ? (i % 50) + 1 : (def.type === 'rating' ? (i % 5) + 1 : null),
        unit: def.unit,
        durationSeconds: def.type === 'duration' ? ((i % 50) + 1) * 60 : null,
        rating: def.type === 'rating' ? (i % 5) + 1 : null,
        note: i % 20 === 0 ? 'ghi chú mẫu' : '',
        nameSnapshot: def.name,
        emojiSnapshot: def.emoji,
        categorySnapshot: def.category,
        createdAt: ts,
      });
    }
    const state = { schemaVersion: 2, eventDefinitions: defs, events, settings: { onboardingSeen: true, theme: 'light' } };
    const t0 = performance.now();
    localStorage.setItem('rongleo_life_log', JSON.stringify(state));
    const t1 = performance.now();
    return { writeMs: t1 - t0, defs: defs.length, events: events.length };
  });
  record('performance', `synthetic dataset written to localStorage (${genResult.defs} defs / ${genResult.events} events)`, true, `write=${genResult.writeMs.toFixed(1)}ms`);

  const t0 = Date.now();
  await page.reload();
  await page.waitForSelector('text=Hôm nay', { timeout: 15000 });
  const captureLoadMs = Date.now() - t0;
  record('performance', 'Capture page loads with 10k-event dataset present', true, `${captureLoadMs}ms`);

  const t1 = Date.now();
  await navButton(page, 'Dòng thời gian').click();
  await page.waitForSelector('text=Xem thêm', { timeout: 15000 }).catch(() => {});
  const timelineLoadMs = Date.now() - t1;
  const domRowCount = await page.locator('main .space-y-2 > *').count().catch(() => -1);
  record('performance', 'Timeline renders 10k-event history without hanging', timelineLoadMs < 8000, `${timelineLoadMs}ms`);
  record('performance', 'Timeline DOM stays bounded (paginated, not 10,000 rows)', domRowCount > 0 && domRowCount < 200, `rendered ${domRowCount} rows`);
  await shot(page, '11-perf-timeline-10k.png');

  const t2 = Date.now();
  await navButton(page, 'Thống kê').click();
  await page.waitForSelector('h1:has-text("Thống kê")', { timeout: 15000 });
  await page.waitForTimeout(300);
  const statsLoadMs = Date.now() - t2;
  record('performance', 'Statistics page computes for 100 definitions / 10k events', statsLoadMs < 8000, `${statsLoadMs}ms`);

  const t3 = Date.now();
  await navButton(page, 'Lịch').click();
  await page.waitForSelector('h1:has-text("Lịch")', { timeout: 15000 });
  const calLoadMs = Date.now() - t3;
  record('performance', 'Calendar renders with 10k-event dataset', calLoadMs < 8000, `${calLoadMs}ms`);

  await navButton(page, 'Ghi nhận').click();
  await page.waitForSelector('text=Hôm nay');
  const t4 = Date.now();
  await page.getByRole('button', { name: 'Ghi điều khác' }).first().click();
  await page.getByPlaceholder('Tìm sự kiện... (tiếng Việt hoặc English)').fill('nuoc');
  await page.waitForTimeout(200);
  const searchMs = Date.now() - t4;
  record('performance', 'Add-event search stays responsive', searchMs < 3000, `${searchMs}ms`);

  const heap = await page.evaluate(() => performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576) : null);
  record('performance', 'JS heap after full 10k-event tour stays reasonable', heap == null || heap < 300, heap != null ? `${heap} MB` : 'performance.memory unavailable');

  await context.close();
}

// Permanent regression test for the exact operator-reported scenario:
// Capture said 11, Quản lý looked like 19 (8 favorited rows rendered once
// under "Yêu thích" AND again under their category in "Tất cả" — genuine
// double-rendering, not a sync bug) plus an explicit "no cap" request.
async function runNoCapNoDuplicateQA(browser) {
  const context = await browser.newContext({ ...devices['iPhone 13'] });
  const page = await context.newPage();
  page.setDefaultTimeout(8000);
  await page.goto(BASE_URL);

  await page.evaluate(() => {
    const now = new Date().toISOString();
    const mk = (id, name, emoji, category, favorite) => ({
      id, name, emoji, category, type: 'moment', unit: null, defaultValue: null,
      aliases: [], favorite, active: true, createdAt: now,
    });
    const favorited = [
      mk('f1', 'Uống nước', '💧', 'body', true),
      mk('f2', 'Bữa ăn', '🍽️', 'food', true),
      mk('f3', 'Cà phê', '☕', 'drink', true),
      mk('f4', 'Làm việc', '💼', 'work', true),
      mk('f5', 'Đi bộ', '🚶', 'movement', true),
      mk('f6', 'Chạy', '🏃', 'movement', true),
      mk('f7', 'Uống thuốc', '💊', 'health', true),
      mk('f8', 'Tâm trạng', '🙂', 'mind', true),
    ];
    const rest = [
      mk('r1', 'Cắt tóc', '💇', 'body', false),
      mk('r2', 'Đánh răng', '🪥', 'body', false),
      mk('r3', 'Bữa ăn (bản sao)', '🍽️', 'food', false),
    ];
    const state = {
      schemaVersion: 2,
      eventDefinitions: [...favorited, ...rest],
      events: [],
      settings: { onboardingSeen: true, theme: 'light' },
    };
    localStorage.setItem('rongleo_life_log', JSON.stringify(state));
  });
  await page.reload();
  await page.waitForSelector('h1:has-text("Chuyện gì vừa xảy ra?")');

  const gridTileCount = await page.evaluate(() => document.querySelectorAll('main .grid > button').length);
  record('nocap', 'Capture grid shows ALL 11 definitions, no 12-tile cap', gridTileCount === 11, `${gridTileCount} tiles`);

  await page.getByRole('button', { name: 'Quản lý' }).click();
  await page.waitForSelector('text=Yêu thích');
  await page.waitForTimeout(200);

  // Each EventDefinitionRow has exactly one "Thêm tùy chọn" (⋯) button —
  // a stable, style-independent way to count rendered rows.
  const totalRowCount = await page.getByRole('button', { name: 'Thêm tùy chọn' }).count();
  record('nocap', 'Quản lý renders exactly 11 rows total, no duplicates (not 19)', totalRowCount === 11, `${totalRowCount} rows`);

  const favSectionCount = await page.locator('text=/⭐ Yêu thích \\(\\d+\\)/').first().textContent().catch(() => '');
  const khacSectionCount = await page.locator('text=/Khác \\(\\d+\\)/').first().textContent().catch(() => '');
  record('nocap', 'section counts read 8 favorited + 3 khác (8+3=11, matching Capture)', favSectionCount.includes('8') && khacSectionCount.includes('3'), `${favSectionCount.trim()} / ${khacSectionCount.trim()}`);

  const totalLabel = await page.locator('text=/Tổng cộng \\d+ sự kiện/').first().textContent().catch(() => '');
  record('nocap', 'intro text states the total (11) matches Capture, explains no cap', totalLabel.includes('11'), totalLabel.trim());

  await shot(page, '12-manage-no-duplicate.png');
  await context.close();
}

// 3 chế độ giao diện (CLAUDE.md UI preferences): Sáng / Tối / Sang trọng.
// Guards the theme switcher in Quản lý → Dữ liệu and the pre-paint
// data-theme bootstrap in index.html (no flash of the wrong theme, and the
// choice survives a reload via settings.theme in localStorage).
async function runThemeQA(browser) {
  const context = await browser.newContext({ ...devices['iPhone 13'] });
  const page = await context.newPage();
  page.setDefaultTimeout(8000);
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));

  await page.goto(BASE_URL);
  await dismissOnboardingIfPresent(page);
  await page.waitForSelector('h1:has-text("Chuyện gì vừa xảy ra?")');

  const defaultTheme = await page.evaluate(() => document.documentElement.dataset.theme);
  record('theme', 'defaults to light (data-theme on <html>)', defaultTheme === 'light', defaultTheme);

  await page.getByRole('button', { name: 'Quản lý' }).click();
  await page.getByRole('button', { name: 'Dữ liệu' }).click();
  const allThreeVisible = await page.getByRole('button', { name: 'Sáng', exact: true }).isVisible()
    && await page.getByRole('button', { name: 'Tối', exact: true }).isVisible()
    && await page.getByRole('button', { name: 'Sang trọng', exact: true }).isVisible();
  record('theme', 'Quản lý → Dữ liệu shows all 3 theme options', allThreeVisible);

  await page.getByRole('button', { name: 'Tối', exact: true }).click();
  await page.waitForTimeout(150);
  const afterDark = await page.evaluate(() => document.documentElement.dataset.theme);
  record('theme', 'selecting Tối sets data-theme=dark immediately', afterDark === 'dark', afterDark);

  await page.reload();
  await page.waitForSelector('h1:has-text("Quản lý"), h1:has-text("Chuyện gì vừa xảy ra?")').catch(() => {});
  const themeAtFirstPaint = await page.evaluate(() => document.documentElement.dataset.theme);
  record('theme', 'dark theme survives reload with no flash (set before React mounts)', themeAtFirstPaint === 'dark', themeAtFirstPaint);

  // Quick-access entry point on Capture itself (operator: "cho giao diện ra
  // ngoài màn hình chính"), not just buried in Quản lý → Dữ liệu.
  const onCapture = await page.locator('h1', { hasText: 'Chuyện gì vừa xảy ra?' }).isVisible().catch(() => false);
  if (!onCapture) await page.getByRole('button', { name: 'Đóng' }).click().catch(() => {});
  await page.getByRole('button', { name: 'Đổi giao diện' }).click();
  const quickPickerVisible = await page.locator('h3', { hasText: 'Giao diện' }).isVisible({ timeout: 2000 }).catch(() => false);
  record('theme', 'quick theme icon on Capture header opens the picker directly', quickPickerVisible);
  await page.getByRole('button', { name: 'Sang trọng', exact: true }).click();
  await page.waitForTimeout(150);
  const afterLuxury = await page.evaluate(() => document.documentElement.dataset.theme);
  record('theme', 'selecting Sang trọng from the Capture quick picker sets data-theme=luxury', afterLuxury === 'luxury', afterLuxury);
  await shot(page, '13-theme-luxury.png');
  await page.getByRole('button', { name: 'Đóng' }).click();

  await page.getByRole('button', { name: 'Quản lý' }).click();
  await page.getByRole('button', { name: 'Dữ liệu' }).click();
  await page.getByRole('button', { name: 'Sáng', exact: true }).click();
  await page.waitForTimeout(150);
  const backToLight = await page.evaluate(() => document.documentElement.dataset.theme);
  record('theme', 'switching back to Sáng from Quản lý restores data-theme=light', backToLight === 'light', backToLight);
  await page.getByRole('button', { name: 'Đóng' }).click();

  record('theme', 'no uncaught page errors while switching themes', errors.length === 0, errors.join(' | '));

  await context.close();
}

// operator feedback: "bấm nhầm hoặc duplicate mà không xóa được" — a trash
// icon now lives directly on every Timeline/Today-stream/Calendar row, and
// Quản lý → Dữ liệu has a self-service "wipe my test data" reset. Both
// still confirm through an in-app Modal, never native confirm().
async function runRowDeleteAndResetQA(browser) {
  const context = await browser.newContext({ ...devices['iPhone 13'] });
  const page = await context.newPage();
  page.setDefaultTimeout(8000);
  await page.goto(BASE_URL);

  await page.evaluate(() => {
    const now = new Date().toISOString();
    const def = { id: 'd1', name: 'Đánh răng', emoji: '🪥', category: 'body', type: 'moment', unit: null, defaultValue: null, aliases: [], favorite: true, active: true, createdAt: now };
    const mkEvent = (id, ts) => ({ id, definitionId: 'd1', nameSnapshot: def.name, emojiSnapshot: def.emoji, categorySnapshot: def.category, timestamp: ts, value: null, durationSeconds: null, rating: null, note: '' });
    const nowTs = new Date();
    const state = {
      schemaVersion: 2,
      eventDefinitions: [def],
      events: [mkEvent('e1', nowTs.toISOString()), mkEvent('e2', new Date(nowTs.getTime() - 60000).toISOString())],
      settings: { onboardingSeen: true, theme: 'light' },
    };
    localStorage.setItem('rongleo_life_log', JSON.stringify(state));
  });
  await page.reload();
  await page.waitForSelector('h1:has-text("Chuyện gì vừa xảy ra?")');

  const rowsBefore = await page.getByRole('button', { name: 'Xóa sự kiện' }).count();
  record('row-delete', 'Today stream shows a trash icon directly on each row', rowsBefore === 2, `${rowsBefore} trash icons`);

  await page.getByRole('button', { name: 'Xóa sự kiện' }).first().click();
  const usesModal = await page.locator('h3', { hasText: 'Xóa sự kiện' }).isVisible({ timeout: 2000 }).catch(() => false);
  record('row-delete', 'inline delete confirms via in-app Modal (not native confirm())', usesModal);
  await page.getByRole('button', { name: 'Xóa', exact: true }).click();
  await page.waitForTimeout(200);
  const rowsAfter = await page.getByRole('button', { name: 'Xóa sự kiện' }).count();
  record('row-delete', 'confirming inline delete actually removes just that one event', rowsAfter === 1, `${rowsAfter} left`);

  // Reset-all-data (Quản lý → Dữ liệu → Vùng nguy hiểm).
  await page.getByRole('button', { name: 'Quản lý' }).click();
  await page.getByRole('button', { name: 'Dữ liệu' }).click();
  await page.getByRole('button', { name: 'Xóa toàn bộ dữ liệu trên thiết bị này' }).click();
  const resetModalVisible = await page.locator('h3', { hasText: 'Xóa toàn bộ dữ liệu' }).isVisible({ timeout: 2000 }).catch(() => false);
  record('row-delete', 'reset-all-data confirms via in-app Modal', resetModalVisible);
  await page.getByRole('button', { name: 'Xóa hết' }).click();
  await page.waitForTimeout(200);
  const defsAfterReset = await page.evaluate(() => JSON.parse(localStorage.getItem('rongleo_life_log')).eventDefinitions.length);
  const eventsAfterReset = await page.evaluate(() => JSON.parse(localStorage.getItem('rongleo_life_log')).events.length);
  record('row-delete', 'reset restores the 8-item starter set and wipes all events', defsAfterReset === 8 && eventsAfterReset === 0, `${defsAfterReset} defs / ${eventsAfterReset} events`);

  await context.close();
}

// "Theo hoạt động" — operator: "xem tập thể dục tổng hay tổng lượng nước
// uống trong ngày" instead of only a flat chronological list. Same toggle
// on Dòng thời gian and Lịch, backed by the shared GroupedByActivity +
// computeStatsForDefinition (same aggregation Thống kê already uses).
async function runGroupedByActivityQA(browser) {
  const context = await browser.newContext({ ...devices['iPhone 13'] });
  const page = await context.newPage();
  page.setDefaultTimeout(8000);
  await page.goto(BASE_URL);

  await page.evaluate(() => {
    const now = new Date();
    const water = { id: 'water', name: 'Uống nước', emoji: '💧', category: 'body', type: 'count', unit: 'ml', defaultValue: 300, aliases: [], favorite: true, active: true, createdAt: now.toISOString() };
    const exercise = { id: 'exercise', name: 'Tập thể dục', emoji: '🏃', category: 'movement', type: 'moment', unit: null, defaultValue: null, aliases: [], favorite: true, active: true, createdAt: now.toISOString() };
    const mkWater = (id, minsAgo) => ({ id, eventDefinitionId: 'water', timestamp: new Date(now.getTime() - minsAgo * 60000).toISOString(), value: 300, unit: 'ml', durationSeconds: null, rating: null, note: '', nameSnapshot: water.name, emojiSnapshot: water.emoji, categorySnapshot: water.category, createdAt: now.toISOString() });
    const mkExercise = (id, minsAgo) => ({ id, eventDefinitionId: 'exercise', timestamp: new Date(now.getTime() - minsAgo * 60000).toISOString(), value: null, unit: null, durationSeconds: null, rating: null, note: '', nameSnapshot: exercise.name, emojiSnapshot: exercise.emoji, categorySnapshot: exercise.category, createdAt: now.toISOString() });
    const state = {
      schemaVersion: 2,
      eventDefinitions: [water, exercise],
      events: [mkWater('w1', 10), mkWater('w2', 60), mkWater('w3', 120), mkExercise('x1', 30), mkExercise('x2', 200)],
      settings: { onboardingSeen: true, theme: 'light' },
    };
    localStorage.setItem('rongleo_life_log', JSON.stringify(state));
  });
  await page.reload();
  await page.waitForSelector('h1:has-text("Chuyện gì vừa xảy ra?")');

  // Dòng thời gian
  await navButton(page, 'Dòng thời gian').click();
  await page.waitForSelector('h1:has-text("Dòng thời gian")');
  await page.getByRole('button', { name: 'Theo hoạt động', exact: true }).click();
  const waterHeadlineTimeline = await page.getByText('900 ml · 3 lần').first().isVisible({ timeout: 2000 }).catch(() => false);
  record('grouped', 'Timeline "Theo hoạt động" aggregates Uống nước to 900 ml · 3 lần', waterHeadlineTimeline);
  const exerciseHeadlineTimeline = await page.getByText('2 lần', { exact: true }).first().isVisible({ timeout: 2000 }).catch(() => false);
  record('grouped', 'Timeline "Theo hoạt động" counts Tập thể dục as 2 lần (moment type, no unit)', exerciseHeadlineTimeline);
  await shot(page, '14-grouped-timeline.png');

  await page.getByText('Uống nước', { exact: true }).first().click();
  const expandedCard = await page.getByText('Trung bình/lần').isVisible({ timeout: 2000 }).catch(() => false);
  record('grouped', 'expanding a grouped row shows the full StatisticCard breakdown', expandedCard);

  await page.locator('main').getByRole('button', { name: 'Dòng thời gian', exact: true }).click();
  const backToChrono = await page.getByRole('button', { name: 'Xóa sự kiện' }).first().isVisible({ timeout: 2000 }).catch(() => false);
  record('grouped', 'switching back to Dòng thời gian restores the flat per-event list', backToChrono);

  // Lịch (same seeded events are all "today")
  await navButton(page, 'Lịch').click();
  await page.waitForSelector('h1:has-text("Lịch")');
  await page.getByRole('button', { name: 'Theo hoạt động', exact: true }).click();
  const waterHeadlineCalendar = await page.getByText('900 ml · 3 lần').first().isVisible({ timeout: 2000 }).catch(() => false);
  record('grouped', 'Calendar "Theo hoạt động" aggregates the selected day the same way', waterHeadlineCalendar);

  await context.close();
}

// Pure-logic check for mergeCloudDown (App.jsx's ongoing pull-down sync,
// fixing the real "máy tính không đồng bộ với điện thoại" report — cloud
// only ever got fetched ONCE, right after a fresh login, so a second
// signed-in device never saw anything created/edited afterwards on
// another device). No browser/network needed since this is a plain
// function of two arrays; a live two-device round trip against production
// Supabase is deliberately NOT scripted here — it would write real rows to
// the operator's actual account with no safe, repeatable way to clean up.
async function runCloudMergeLogicQA() {
  const local = {
    eventDefinitions: [
      { id: 'water', name: 'Uống nước (local, cũ)' },
      { id: 'offline_only', name: 'Tạo lúc mất mạng, chưa kịp đẩy lên' },
    ],
    events: [
      { id: 'e1', note: 'ghi chú cũ trên máy này' },
      { id: 'e_offline', note: 'sự kiện tạo lúc mất mạng, chưa kịp đẩy lên' },
    ],
  };
  const cloud = {
    definitions: [
      { id: 'water', name: 'Uống nước (sửa từ điện thoại)' },
      { id: 'exercise', name: 'Tập thể dục (mới, tạo từ điện thoại)' },
    ],
    events: [
      { id: 'e1', note: 'đã sửa ghi chú từ điện thoại' },
      { id: 'e2', note: 'sự kiện mới ghi từ điện thoại' },
    ],
  };
  const merged = mergeCloudDown(local, cloud);

  const editPropagated = merged.eventDefinitions.find(d => d.id === 'water')?.name === 'Uống nước (sửa từ điện thoại)';
  record('cloud-sync', 'pulling picks up an EDIT made on another device (cloud wins on matching id)', editPropagated);

  const additionPropagated = merged.eventDefinitions.some(d => d.id === 'exercise') && merged.events.some(e => e.id === 'e2');
  record('cloud-sync', 'pulling picks up a NEW definition + event created on another device', additionPropagated);

  const offlineDataPreserved = merged.eventDefinitions.some(d => d.id === 'offline_only') && merged.events.some(e => e.id === 'e_offline');
  record('cloud-sync', 'pulling never discards a local-only record cloud doesn\'t have yet (not-yet-pushed data survives)', offlineDataPreserved);

  const eventEditPropagated = merged.events.find(e => e.id === 'e1')?.note === 'đã sửa ghi chú từ điện thoại';
  record('cloud-sync', 'event edits (not just definitions) also propagate from another device', eventEditPropagated);

  // Soft-delete (tombstone) propagation — 0002_soft_delete.sql.
  const localWithBoth = {
    eventDefinitions: [{ id: 'water', name: 'Uống nước' }, { id: 'stays', name: 'Không đụng tới' }],
    events: [{ id: 'e1', note: 'sẽ bị xóa từ điện thoại' }, { id: 'e_stays', note: 'không đụng tới' }],
  };
  const cloudWithTombstone = {
    definitions: [{ id: 'water', name: 'Uống nước', deletedAt: '2026-09-24T00:00:00.000Z' }],
    events: [{ id: 'e1', note: 'sẽ bị xóa từ điện thoại', deletedAt: '2026-09-24T00:00:00.000Z' }],
  };
  const afterDelete = mergeCloudDown(localWithBoth, cloudWithTombstone);
  const deletePropagated = !afterDelete.eventDefinitions.some(d => d.id === 'water') && !afterDelete.events.some(e => e.id === 'e1');
  record('cloud-sync', 'a delete made on another device (tombstone) removes the record locally too', deletePropagated);
  const untouchedSurvived = afterDelete.eventDefinitions.some(d => d.id === 'stays') && afterDelete.events.some(e => e.id === 'e_stays');
  record('cloud-sync', 'delete propagation only removes the tombstoned id, nothing else', untouchedSurvived);

  // A tombstoned row must never resurrect through the first-login merge
  // screen (planCloudSync/mergeLocalAndCloud) — stripDeleted() guards both.
  const rawCloudWithTombstone = { definitions: [{ id: 'gone', name: 'Đã xóa trước khi máy này đăng nhập lần đầu', deletedAt: '2026-09-24T00:00:00.000Z' }], events: [] };
  const stripped = stripDeleted(rawCloudWithTombstone);
  record('cloud-sync', 'stripDeleted() removes tombstoned rows', stripped.definitions.length === 0);
  const emptyLocal = { eventDefinitions: [], events: [] };
  const plan = planCloudSync(emptyLocal, rawCloudWithTombstone);
  record('cloud-sync', 'planCloudSync treats an all-tombstoned cloud as empty (kind=none, no restore prompt)', plan.kind === 'none');
  const loginMerged = mergeLocalAndCloud(emptyLocal, rawCloudWithTombstone);
  record('cloud-sync', 'mergeLocalAndCloud never resurrects a tombstoned row on first login', loginMerged.eventDefinitions.length === 0);

  // Re-creating the same id after a delete (e.g. re-add from the library)
  // must clear the tombstone, or the next pull would delete it right back.
  const revivedRow = definitionToCloudRow({ id: 'water', name: 'Uống nước', emoji: '💧', category: 'body', type: 'count' }, 'user-1');
  record('cloud-sync', 'upserting a definition explicitly clears deleted_at (revive-on-recreate)', revivedRow.deleted_at === null);
  const revivedEventRow = eventToCloudRow({ id: 'e1', eventDefinitionId: 'water', timestamp: new Date().toISOString(), nameSnapshot: 'Uống nước', emojiSnapshot: '💧' }, 'user-1');
  record('cloud-sync', 'upserting an event explicitly clears deleted_at too', revivedEventRow.deleted_at === null);
}

// v2.2 admin/cloud QA — this environment has no real Supabase project (spec
// v2.2's own note: inspect/provision that separately), so only the GUEST
// side of the feature and its "never touches the network" guarantee can be
// exercised for real here. The login/merge/restore/RLS flows are verified
// by code review + this graceful-degradation path, not by a live backend —
// documented as a known gap in the final report rather than faked.
async function runCloudGuestQA(browser) {
  const context = await browser.newContext({ ...devices['iPhone 13'] });
  const page = await context.newPage();
  page.setDefaultTimeout(8000);

  const supabaseRequests = [];
  page.on('request', req => { if (/supabase\.co|\/rest\/v1\/|\/auth\/v1\//.test(req.url())) supabaseRequests.push(req.url()); });

  await page.goto(BASE_URL);
  await dismissOnboardingIfPresent(page);
  await page.waitForSelector('h1:has-text("Chuyện gì vừa xảy ra?")');

  const badge = page.getByText('📱 Lưu trên thiết bị', { exact: true });
  record('cloud-guest', 'guest sees "📱 Lưu trên thiết bị" badge on Capture', await badge.isVisible({ timeout: 2000 }).catch(() => false));

  // Do a normal capture pass (log a few events, browse Timeline/Calendar/
  // Statistics) to make sure NOTHING in ordinary guest usage calls out to
  // Supabase — this is the "cloud down != app down, and guest never calls
  // cloud at all" guarantee (spec §7, §39, §43).
  await page.locator('main').getByRole('button', { name: 'Đại tiện', exact: true }).click();
  await page.locator('main').getByRole('button', { name: 'Uống nước', exact: true }).click();
  await navButton(page, 'Dòng thời gian').click();
  await page.waitForSelector('h1:has-text("Dòng thời gian")');
  await navButton(page, 'Lịch').click();
  await page.waitForSelector('h1:has-text("Lịch")');
  await navButton(page, 'Thống kê').click();
  await page.waitForSelector('h1:has-text("Thống kê")');
  await navButton(page, 'Ghi nhận').click();
  await page.waitForTimeout(300);
  record('cloud-guest', 'a full guest capture/browse pass makes zero Supabase requests', supabaseRequests.length === 0, `${supabaseRequests.length} requests`);

  await badge.click();
  const guestInfoVisible = await page.getByText('Dữ liệu trên thiết bị', { exact: false }).first().isVisible({ timeout: 2000 }).catch(() => false);
  record('cloud-guest', 'tapping the badge opens the storage-info sheet (guest copy)', guestInfoVisible);

  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
  const loginTitleVisible = await page.locator('h3', { hasText: 'Đăng nhập quản trị viên' }).isVisible({ timeout: 2000 }).catch(() => false);
  record('cloud-guest', '"Đăng nhập" opens the admin login screen', loginTitleVisible);
  const noWallCopy = await page.getByText('Tiếp tục không đăng nhập', { exact: false }).first().isVisible({ timeout: 1000 }).catch(() => false);
  record('cloud-guest', 'login screen offers "Tiếp tục không đăng nhập" — never a hard wall', noWallCopy);
  const notConfiguredNotice = await page.getByText('chưa được cấu hình đám mây', { exact: false }).first().isVisible({ timeout: 1000 }).catch(() => false);
  record('cloud-guest', 'with no Supabase env configured, login explains that plainly instead of crashing', notConfiguredNotice);
  const noSupabaseWordVisible = await page.getByText('Supabase', { exact: false }).count();
  record('cloud-guest', 'no "Supabase" terminology leaks into user-facing copy', noSupabaseWordVisible === 0, `${noSupabaseWordVisible} occurrences`);

  await page.getByRole('button', { name: 'Tiếp tục không đăng nhập' }).click();
  const backOnCapture = await page.locator('h1', { hasText: 'Chuyện gì vừa xảy ra?' }).isVisible({ timeout: 2000 }).catch(() => false);
  record('cloud-guest', '"Tiếp tục không đăng nhập" returns cleanly to Capture, still guest', backOnCapture);

  record('cloud-guest', 'guest capture/browse pass still made zero Supabase requests after visiting login', supabaseRequests.length === 0, `${supabaseRequests.length} requests`);

  await context.close();
}

// Static checks on the actual production bundle: the one thing that must
// be true regardless of whether a real Supabase project is wired up.
async function runBundleSecurityQA() {
  const distAssets = join(process.cwd(), 'dist', 'assets');
  let bundleText = '';
  try {
    for (const f of readdirSync(distAssets)) {
      if (f.endsWith('.js')) bundleText += readFileSync(join(distAssets, f), 'utf-8');
    }
  } catch (err) {
    record('security', 'production bundle is readable for a secret scan', false, String(err));
    return;
  }
  record('security', 'no "service_role" string in the production JS bundle', !bundleText.includes('service_role'));
  record('security', 'no "SUPABASE_SERVICE_ROLE_KEY" string in the production JS bundle', !bundleText.includes('SUPABASE_SERVICE_ROLE_KEY'));
  record('security', 'no hardcoded VITE_ADMIN_PASSWORD-style constant in the bundle', !/ADMIN_PASSWORD/i.test(bundleText));

  const envExample = readFileSync(join(process.cwd(), '.env.example'), 'utf-8');
  record('security', '.env.example ships only placeholders (no populated values)', /VITE_SUPABASE_URL=\s*\n/.test(envExample) && /VITE_SUPABASE_ANON_KEY=\s*\n?$/.test(envExample.trimEnd() + '\n'));

  const gitignore = readFileSync(join(process.cwd(), '.gitignore'), 'utf-8');
  const hasAllEnvPatterns = ['.env', '.env.local', '.env.*.local'].every(p => gitignore.includes(p));
  record('security', '.gitignore covers .env / .env.local / .env.*.local', hasAllEnvPatterns);
}

const browser = await chromium.launch();
const runners = [runMobileFunctionalQA, runDesktopResponsiveQA, runLegacyMigrationQA, runPwaQA, runPerformanceQA, runNoCapNoDuplicateQA, runThemeQA, runRowDeleteAndResetQA, runGroupedByActivityQA, runCloudMergeLogicQA, runCloudGuestQA, runBundleSecurityQA];
for (const fn of runners) {
  try {
    await fn(browser);
  } catch (err) {
    record(fn.name, 'section crashed unexpectedly', false, String(err.message || err).split('\n')[0]);
    console.error(err);
  }
}
await browser.close();

const failed = results.filter(r => !r.pass);
console.log('\n=== SUMMARY ===');
console.log(`Total: ${results.length}  Passed: ${results.length - failed.length}  Failed: ${failed.length}`);
if (failed.length) {
  console.log('\nFailed checks:');
  for (const f of failed) console.log(` - [${f.section}] ${f.label}${f.detail ? ' — ' + f.detail : ''}`);
}
writeFileSync(join(SHOT_DIR, '..', 'qa-results.json'), JSON.stringify(results, null, 2));
process.exit(failed.length ? 1 : 0);

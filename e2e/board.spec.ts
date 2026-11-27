import { test, expect, type Page } from '@playwright/test'

const KEY = 'sdlc-demo-board:v1'
const STATUS_KEYS = ['plan', 'progress', 'review', 'blocked', 'done'] as const
const STATUS_VALUES = ['待规划', '进行中', '审核中', '阻塞中', '已完成'] as const

/** 首次导航清理本应用 key 与其他测试 key；reload 时通过 sessionStorage 守卫保留 localStorage。 */
async function seedStorage(page: Page) {
  await page.addInitScript((key) => {
    try {
      if (sessionStorage.getItem('__e2e_seeded__') !== '1') {
        localStorage.removeItem(key)
        localStorage.setItem('i18nextLng', 'zh')
        localStorage.setItem('elderly-mode', 'false')
        localStorage.setItem('unrelated-key', 'keep-me')
        sessionStorage.setItem('__e2e_seeded__', '1')
      }
    } catch {
      // 存储不可用场景由专门用例覆盖
    }
  }, KEY)
}

async function gotoBoard(page: Page) {
  await page.goto('/')
  await expect(page).toHaveURL(/#\/board$/)
  await expect(page.getByTestId('board-root')).toBeVisible()
}

async function stat(page: Page, id: string): Promise<number> {
  return Number((await page.getByTestId(id).innerText()).trim())
}

async function openCard(page: Page, id: string, title?: string) {
  const card = title
    ? page.getByTestId('item-card').filter({ hasText: title })
    : page.locator(`[data-testid="item-card"][data-id="${id}"]`)
  await card.first().click()
  await expect(page.getByTestId('detail-drawer')).toBeVisible()
}

async function expectStatsConsistent(page: Page) {
  const total = await stat(page, 'stat-total')
  await expect(page.getByTestId('item-card')).toHaveCount(total)
  let sum = 0
  if (total > 0) {
    for (let index = 0; index < STATUS_KEYS.length; index += 1) {
      const count = await stat(page, `stat-${STATUS_KEYS[index]}`)
      expect(await stat(page, `column-count-${STATUS_KEYS[index]}`)).toBe(count)
      expect(await page.locator(`[data-testid="item-card"][data-status="${STATUS_VALUES[index]}"]`).count()).toBe(count)
      sum += count
    }
    expect(sum).toBe(total)
    const rate = (await page.getByTestId('stat-completion').innerText()).trim()
    const done = await stat(page, 'stat-done')
    expect(rate).toBe(`${Math.round((done / total) * 100)}%`)
  } else {
    await expect(page.getByTestId('empty-state')).toBeVisible()
    expect((await page.getByTestId('stat-completion').innerText()).trim()).toBe('无数据')
    for (const key of STATUS_KEYS) expect(await stat(page, `stat-${key}`)).toBe(0)
  }
  const statsText = await page.locator('section[aria-label="总览统计"]').innerText()
  expect(statsText).not.toContain('NaN')
}

test.describe('研发需求与缺陷看板 E2E', () => {
  test.beforeEach(async ({ page }) => {
    await seedStorage(page)
  })

  test('E2E-AC-01: 首屏 12 条合成数据、5 列、合成标识与 25% 完成率', async ({ page }) => {
    await gotoBoard(page)
    await expect(page.getByTestId('synthetic-banner')).toContainText('演示合成数据')
    await expect(page.getByTestId('item-card')).toHaveCount(12)
    for (let index = 0; index < STATUS_KEYS.length; index += 1) {
      expect(await stat(page, `column-count-${STATUS_KEYS[index]}`)).toBe([2, 3, 2, 2, 3][index])
    }
    await expect(page.getByTestId('stat-total')).toHaveText('12')
    await expect(page.getByTestId('stat-completion')).toHaveText('25%')
    await page.screenshot({ path: test.info().outputPath('board-desktop.png'), fullPage: true })
  })

  test('E2E-AC-02: 新增合法、编辑保存、取消编辑与取消新增均无副作用', async ({ page }) => {
    await gotoBoard(page)
    await page.getByTestId('open-create').click()
    await page.getByTestId('title-input').fill('E2E 新增需求')
    await page.getByTestId('description-input').fill('用于验证新增与刷新持久化')
    await page.getByTestId('acceptance-input').fill('刷新后保留\n取消不写入')
    await page.getByTestId('save-item').click()
    await expect(page.getByTestId('detail-drawer')).toBeVisible()
    await expect(page.getByTestId('detail-title')).toHaveText('E2E 新增需求')
    await expect(page.getByTestId('detail-id')).toHaveText('DEMO-113')
    await page.screenshot({ path: test.info().outputPath('create-success.png'), fullPage: true })
    await page.getByTestId('close-detail').click()
    await expect(page.getByTestId('item-card')).toHaveCount(13)

    await page.getByTestId('item-card').filter({ hasText: 'E2E 新增需求' }).click()
    await page.getByTestId('edit-item').click()
    await page.getByTestId('title-input').fill('E2E 已编辑')
    await page.getByTestId('save-item').click()
    await expect(page.getByTestId('detail-title')).toHaveText('E2E 已编辑')
    await page.getByTestId('close-detail').click()

    await page.getByTestId('item-card').filter({ hasText: 'E2E 已编辑' }).click()
    await page.getByTestId('edit-item').click()
    await page.getByTestId('title-input').fill('不应保存的标题')
    await page.screenshot({ path: test.info().outputPath('edit-cancel.png'), fullPage: true })
    await page.getByTestId('cancel-item').click()
    await expect(page.getByTestId('item-form')).toHaveCount(0)
    await expect(page.getByTestId('item-card').filter({ hasText: 'E2E 已编辑' })).toHaveCount(1)
    await expect(page.getByTestId('item-card').filter({ hasText: '不应保存的标题' })).toHaveCount(0)

    await page.getByTestId('open-create').click()
    await page.getByTestId('title-input').fill('取消不应创建')
    await page.getByTestId('cancel-item').click()
    await expect(page.getByTestId('item-card')).toHaveCount(13)
    await expect(page.getByTestId('item-card').filter({ hasText: '取消不应创建' })).toHaveCount(0)
  })

  test('E2E-AC-03: 空白/超长标题与超长描述被拒绝，错误定位且输入保留', async ({ page }) => {
    await gotoBoard(page)
    await page.getByTestId('open-create').click()
    await page.getByTestId('title-input').fill('   ')
    await page.getByTestId('description-input').fill('这段内容必须保留')
    await page.getByTestId('save-item').click()
    await expect(page.getByTestId('form-error-title')).toHaveText('标题不能为空。')
    await expect(page.getByTestId('title-input')).toHaveAttribute('aria-invalid', 'true')
    await expect(page.getByTestId('title-input')).toBeFocused()
    await expect(page.getByTestId('title-input')).toHaveValue('   ')
    await expect(page.getByTestId('description-input')).toHaveValue('这段内容必须保留')

    await page.getByTestId('title-input').fill('汉'.repeat(81))
    await page.getByTestId('save-item').click()
    await expect(page.getByTestId('form-error-title')).toContainText('81')
    await expect(page.getByTestId('form-error-title')).toContainText('80')
    await expect(page.getByTestId('title-input')).toHaveValue('汉'.repeat(81))

    await page.getByTestId('title-input').fill('合法标题')
    await page.getByTestId('description-input').fill('字'.repeat(2001))
    await page.getByTestId('save-item').click()
    await expect(page.getByTestId('form-error-description')).toContainText('2001')
    await expect(page.getByTestId('form-error-description')).toContainText('2000')
    await expect(page.getByTestId('description-input')).toBeFocused()
    await page.screenshot({ path: test.info().outputPath('validation-error.png'), fullPage: true })

    await page.getByTestId('description-input').fill('短描述')
    await page.getByTestId('save-item').click()
    await expect(page.getByTestId('detail-drawer')).toBeVisible()
    await expect(page.getByTestId('detail-title')).toHaveText('合法标题')
  })

  test('E2E-AC-04: 关键词、组合筛选、清空与零结果空态', async ({ page }) => {
    await gotoBoard(page)
    await page.getByTestId('search-input').fill('筛选')
    await expect(page.getByTestId('item-card')).toHaveCount(4)
    await expect(page.getByTestId('filter-summary')).toContainText('关键词「筛选」')

    await page.getByTestId('clear-filters').click()
    await expect(page.getByTestId('item-card')).toHaveCount(12)

    await page.getByTestId('filter-type').selectOption('defect')
    await page.getByTestId('filter-status').selectOption('已完成')
    await expect(page.getByTestId('item-card')).toHaveCount(1)
    await expect(page.getByTestId('item-card')).toContainText('卡片点击区域不一致')

    await page.getByTestId('clear-filters').click()
    await expect(page.getByTestId('item-card')).toHaveCount(12)

    await page.getByTestId('search-input').fill('不存在的关键词XYZ')
    await expect(page.getByTestId('item-card')).toHaveCount(0)
    await expect(page.getByTestId('empty-state')).toBeVisible()
    await expect(page.getByTestId('empty-state')).toContainText('当前筛选下没有工作项')
    await page.screenshot({ path: test.info().outputPath('filters-empty.png'), fullPage: true })
    await page.getByTestId('empty-clear').click()
    await expect(page.getByTestId('item-card')).toHaveCount(12)
  })

  test('E2E-AC-05: 合法流转、非法拒绝写入历史、已完成只读', async ({ page }) => {
    await gotoBoard(page)
    await openCard(page, 'DEMO-103')
    await page.getByTestId('transition-select').selectOption('已完成')
    await page.getByTestId('transition-submit').click()
    await expect(page.getByTestId('transition-alert')).toContainText('不允许从「进行中」直接流转到「已完成」')
    await expect(page.getByTestId('transition-alert')).toContainText('允许的目标状态：审核中、阻塞中')
    await expect(page.getByTestId('history-result').first()).toHaveText('拒绝')
    expect(await stat(page, 'column-count-progress')).toBe(3)
    expect(await stat(page, 'column-count-done')).toBe(3)
    await page.screenshot({ path: test.info().outputPath('transition-rejected.png'), fullPage: true })

    await page.getByTestId('transition-select').selectOption('审核中')
    await page.getByTestId('transition-submit').click()
    await expect(page.getByTestId('toast')).toContainText('已流转到「审核中」')
    expect(await stat(page, 'column-count-progress')).toBe(2)
    expect(await stat(page, 'column-count-review')).toBe(3)
    await expect(page.getByTestId('history-result').first()).toHaveText('成功')

    await page.getByTestId('close-detail').click()
    await openCard(page, 'DEMO-110')
    await expect(page.getByTestId('readonly-note')).toContainText('已完成，只读')
    await expect(page.getByTestId('edit-item')).toHaveCount(0)
    await expect(page.getByTestId('transition-select')).toHaveCount(0)
    await page.screenshot({ path: test.info().outputPath('completed-readonly.png'), fullPage: true })
  })

  test('E2E-AC-06a: 新增、编辑、合法流转后刷新仍保留', async ({ page }) => {
    await gotoBoard(page)
    await page.getByTestId('open-create').click()
    await page.getByTestId('title-input').fill('持久化验证')
    await page.getByTestId('save-item').click()
    await page.getByTestId('edit-item').click()
    await page.getByTestId('title-input').fill('持久化验证-已编辑')
    await page.getByTestId('save-item').click()
    await page.getByTestId('transition-select').selectOption('进行中')
    await page.getByTestId('transition-submit').click()
    await expect(page.getByTestId('toast')).toContainText('已流转到「进行中」')
    await page.getByTestId('close-detail').click()

    await page.reload()
    await expect(page.getByTestId('board-root')).toBeVisible()
    await page.getByTestId('search-input').fill('持久化验证')
    await expect(page.getByTestId('item-card')).toHaveCount(1)
    await expect(page.locator('[data-testid="item-card"][data-status="进行中"]')).toContainText('持久化验证-已编辑')
    await page.screenshot({ path: test.info().outputPath('persist-reload.png'), fullPage: true })
    await page.getByTestId('item-card').click()
    await expect(page.getByTestId('detail-title')).toHaveText('持久化验证-已编辑')
    await expect(page.getByTestId('detail-history')).toContainText('进行中')
  })

  test('E2E-AC-06b: 损坏数据受控提示、raw 保留、显式覆盖后恢复', async ({ page }) => {
    await page.addInitScript((key) => {
      try {
        localStorage.setItem('unrelated-key', 'keep-me')
        localStorage.setItem(key, 'not-json')
      } catch {
        // ignore
      }
    }, KEY)
    await gotoBoard(page)
    await expect(page.getByTestId('storage-banner')).toBeVisible()
    await expect(page.getByTestId('storage-banner')).toContainText('原始内容已保留')
    await expect(page.getByTestId('export-raw')).toBeVisible()
    expect(await page.evaluate((key) => localStorage.getItem(key), KEY)).toBe('not-json')
    await page.screenshot({ path: test.info().outputPath('storage-corrupt.png'), fullPage: true })

    await page.getByTestId('overwrite-corrupt').click()
    await expect(page.getByTestId('storage-banner')).toHaveCount(0)
    const parsed = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) || '{}'), KEY)
    expect(parsed.version).toBe(1)
    expect(parsed.items).toHaveLength(12)
    expect(await page.evaluate(() => localStorage.getItem('unrelated-key'))).toBe('keep-me')
  })

  test('E2E-AC-06c: 存储不可用时内存态运行、刷新回种子且无 pageerror', async ({ page }) => {
    const pageErrors: string[] = []
    page.on('pageerror', (error) => pageErrors.push(error.message))
    await page.addInitScript(() => {
      try {
        localStorage.setItem('unrelated-key', 'keep-me')
        localStorage.setItem('i18nextLng', 'zh')
      } catch {
        // ignore
      }
      const proto = Storage.prototype
      proto.getItem = function blockedGet() { throw new Error('storage blocked') }
      proto.setItem = function blockedSet() { throw new Error('storage blocked') }
    })
    await gotoBoard(page)
    await expect(page.getByTestId('storage-banner')).toContainText('仅在本次页面保留')
    await page.getByTestId('open-create').click()
    await page.getByTestId('title-input').fill('内存态新增')
    await page.getByTestId('save-item').click()
    await expect(page.getByTestId('detail-drawer')).toBeVisible()
    await expect(page.getByTestId('stat-total')).toHaveText('13')
    await page.screenshot({ path: test.info().outputPath('storage-unavailable.png'), fullPage: true })
    await page.getByTestId('close-detail').click()

    await page.reload()
    await expect(page.getByTestId('storage-banner')).toContainText('仅在本次页面保留')
    await expect(page.getByTestId('stat-total')).toHaveText('12')
    await expect(page.getByTestId('item-card').filter({ hasText: '内存态新增' })).toHaveCount(0)
    expect(pageErrors).toEqual([])
  })

  test('E2E-AC-07: 统计与卡片/列计数同源，空集合无 NaN', async ({ page }) => {
    await gotoBoard(page)
    await expectStatsConsistent(page)
    await page.getByTestId('search-input').fill('筛选')
    await expectStatsConsistent(page)
    await page.getByTestId('clear-filters').click()
    await page.getByTestId('filter-type').selectOption('defect')
    await page.getByTestId('filter-status').selectOption('已完成')
    await expectStatsConsistent(page)
    await page.screenshot({ path: test.info().outputPath('stats-filtered.png'), fullPage: true })
    await page.getByTestId('search-input').fill('零结果集合')
    await expectStatsConsistent(page)
    await expect(page.getByTestId('stat-completion')).toHaveText('无数据')
  })

  test('E2E-AC-08: 详情证据分级、能力证据 7 节点、真实产物可访问且无 PASS/虚构 PR', async ({ page }) => {
    await gotoBoard(page)
    await openCard(page, 'DEMO-101')
    await expect(page.getByTestId('evidence-item')).toHaveCount(2)
    await expect(page.getByTestId('evidence-tag').first()).toHaveText('示例记录')
    await expect(page.getByTestId('detail-real-evidence')).toBeVisible()
    await expect(page.getByTestId('detail-real-evidence')).toContainText('本轮真实产物')
    expect(await page.getByTestId('detail-drawer').innerText()).not.toContain('PASS')
    await page.screenshot({ path: test.info().outputPath('detail-evidence.png'), fullPage: true })
    await page.getByTestId('close-detail').click()

    await page.getByTestId('nav-evidence').click()
    await expect(page.getByTestId('evidence-view')).toBeVisible()
    await expect(page.getByTestId('stage-card')).toHaveCount(7)
    await expect(page.getByTestId('evidence-view')).toContainText('已生成 · 待评审')
    await expect(page.getByTestId('evidence-view')).toContainText('未创建')
    await expect(page.getByTestId('evidence-view')).toContainText('待确认')
    await expect(page.locator('[data-testid^="ac-row-AC-"]')).toHaveCount(12)
    const text = await page.getByTestId('evidence-view').innerText()
    expect(text).not.toContain('PASS')
    expect(text).not.toContain('/pull/')

    for (const path of [
      '/docs/prd/requirements-defect-board.md',
      '/docs/spec/requirements-defect-board.spec.md',
      '/docs/spec/requirements-defect-board.design.md',
      '/docs/spec/requirements-defect-board.test-plan.md',
      '/docs/prototype/requirements-board/index.html',
    ]) {
      const response = await page.request.get(path)
      expect(response.status()).toBe(200)
    }
  })

  test('E2E-AC-09: 复位两步取消无变化，确认只重置本应用数据', async ({ page }) => {
    await gotoBoard(page)
    await page.getByTestId('open-create').click()
    await page.getByTestId('title-input').fill('复位前新增')
    await page.getByTestId('save-item').click()
    await page.getByTestId('close-detail').click()
    await expect(page.getByTestId('item-card')).toHaveCount(13)

    await page.getByTestId('open-reset').click()
    await expect(page.getByTestId('reset-modal')).toHaveAttribute('data-step', '1')
    await page.screenshot({ path: test.info().outputPath('reset-step1.png'), fullPage: true })
    await page.getByTestId('reset-cancel').click()
    await expect(page.getByTestId('item-card')).toHaveCount(13)

    await page.getByTestId('open-reset').click()
    await page.getByTestId('reset-continue').click()
    await expect(page.getByTestId('reset-modal')).toHaveAttribute('data-step', '2')
    await page.screenshot({ path: test.info().outputPath('reset-step2.png'), fullPage: true })
    await page.getByTestId('reset-cancel').click()
    await expect(page.getByTestId('item-card')).toHaveCount(13)

    await page.getByTestId('open-reset').click()
    await page.getByTestId('reset-continue').click()
    await page.getByTestId('reset-confirm').click()
    await expect(page.getByTestId('toast')).toContainText('其他 localStorage key 未改动')
    await expect(page.getByTestId('item-card')).toHaveCount(12)
    await expect(page.getByTestId('search-input')).toHaveValue('')
    expect(await page.evaluate(() => localStorage.getItem('i18nextLng'))).toBe('zh')
    expect(await page.evaluate(() => localStorage.getItem('elderly-mode'))).toBe('false')
    expect(await page.evaluate(() => localStorage.getItem('unrelated-key'))).toBe('keep-me')
  })

  test('E2E-AC-10: HTML/脚本输入作为文本显示且不执行', async ({ page }) => {
    const pageErrors: string[] = []
    const consoleErrors: string[] = []
    page.on('pageerror', (error) => pageErrors.push(error.message))
    page.on('console', (message) => {
      if (message.type() !== 'error') return
      const url = message.location().url || ''
      if (url.includes('fonts.googleapis.com') || url.includes('fonts.gstatic.com')) return
      consoleErrors.push(message.text())
    })
    await gotoBoard(page)
    const payloadTitle = '<img src=x onerror="window.__xss=1">'
    const payloadDescription = '<script>window.__xss=2</script>'
    await page.getByTestId('open-create').click()
    await page.getByTestId('title-input').fill(payloadTitle)
    await page.getByTestId('description-input').fill(payloadDescription)
    await page.getByTestId('save-item').click()
    await expect(page.getByTestId('detail-title')).toHaveText(payloadTitle)
    await expect(page.getByTestId('detail-description')).toContainText(payloadDescription)
    expect(await page.locator('img[src="x"]').count()).toBe(0)
    expect(await page.evaluate(() => (window as unknown as { __xss?: number }).__xss)).toBeUndefined()
    await page.screenshot({ path: test.info().outputPath('xss-safe.png'), fullPage: true })
    expect(pageErrors).toEqual([])
    expect(consoleErrors).toEqual([])
  })

  test('E2E-AC-11a: 仅用键盘完成新增、搜索、流转与关闭', async ({ page }) => {
    await gotoBoard(page)
    await page.getByTestId('open-create').focus()
    await page.keyboard.press('Enter')
    await expect(page.getByTestId('item-form')).toBeVisible()
    await page.getByTestId('title-input').focus()
    await page.keyboard.type('键盘新增')
    await page.keyboard.press('Enter')
    await expect(page.getByTestId('detail-drawer')).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.getByTestId('detail-drawer')).toHaveCount(0)
    const newCard = page.locator('[data-testid="item-card"][data-id="DEMO-113"]')
    await expect(newCard).toBeFocused()

    await page.getByTestId('search-input').focus()
    await page.keyboard.type('键盘')
    await expect(page.getByTestId('item-card')).toHaveCount(1)
    await page.getByTestId('clear-filters').focus()
    await page.keyboard.press('Enter')
    await expect(page.getByTestId('item-card')).toHaveCount(13)

    const pendingCard = page.locator('[data-testid="item-card"][data-id="DEMO-101"]')
    await pendingCard.focus()
    await page.keyboard.press('Enter')
    await expect(page.getByTestId('detail-drawer')).toBeVisible()
    await page.getByTestId('transition-select').focus()
    await page.keyboard.press('Home')
    await page.keyboard.press('Enter')
    await page.getByTestId('transition-submit').focus()
    await page.keyboard.press('Enter')
    await expect(page.getByTestId('toast')).toContainText('已流转到「进行中」')
    await page.keyboard.press('Escape')
    await expect(page.getByTestId('detail-drawer')).toHaveCount(0)
  })

  test('E2E-AC-11b: 390px 窄屏无页面级横向溢出，详情与表单可用', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await gotoBoard(page)
    const widths = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
      columnScroll: document.querySelector('[data-testid="board-columns-scroll"]')?.scrollWidth ?? 0,
      columnClient: document.querySelector('[data-testid="board-columns-scroll"]')?.clientWidth ?? 0,
    }))
    expect(widths.scrollWidth).toBeLessThanOrEqual(widths.innerWidth + 1)
    expect(widths.columnScroll).toBeGreaterThan(widths.columnClient)
    await page.screenshot({ path: test.info().outputPath('mobile-board.png'), fullPage: true })

    await openCard(page, 'DEMO-101')
    const drawerWidth = await page.getByTestId('detail-drawer').evaluate((element) => element.getBoundingClientRect().width)
    expect(drawerWidth).toBeLessThanOrEqual(390)
    await page.screenshot({ path: test.info().outputPath('mobile-detail.png'), fullPage: true })
    await page.getByTestId('close-detail').click()
    await page.getByTestId('open-create').click()
    await expect(page.getByTestId('save-item')).toBeVisible()
    const formWidth = await page.getByTestId('item-form').evaluate((element) => element.getBoundingClientRect().width)
    expect(formWidth).toBeLessThanOrEqual(390)
  })

  test('E2E-AC-11c: 核心操作无本次引入的 console error / pageerror', async ({ page }) => {
    const pageErrors: string[] = []
    const consoleErrors: string[] = []
    page.on('pageerror', (error) => pageErrors.push(error.message))
    page.on('console', (message) => {
      if (message.type() !== 'error') return
      const url = message.location().url || ''
      if (url.includes('fonts.googleapis.com') || url.includes('fonts.gstatic.com')) return
      consoleErrors.push(message.text())
    })
    await gotoBoard(page)
    await page.getByTestId('search-input').fill('筛选')
    await page.getByTestId('clear-filters').click()
    await openCard(page, 'DEMO-103')
    await page.getByTestId('transition-select').selectOption('审核中')
    await page.getByTestId('transition-submit').click()
    await page.keyboard.press('Escape')
    await page.getByTestId('open-reset').click()
    await page.getByTestId('reset-cancel').click()
    await page.getByTestId('nav-evidence').click()
    await page.getByTestId('nav-board').click()
    await expect(page.getByTestId('item-card')).toHaveCount(12)
    expect(pageErrors).toEqual([])
    expect(consoleErrors).toEqual([])
  })
})

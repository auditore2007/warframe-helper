'use strict'

const { desktopCapturer, screen, nativeImage } = require('electron')
const fs = require('node:fs/promises')
const path = require('node:path')
const { createWorker } = require('tesseract.js')
const { groupColumns } = require('./lib/rewards.cjs')
const { DEFAULT_SETTINGS } = require('./lib/settings.cjs')

const UPSCALE = 2
// текст в игре светлый на тёмном фоне, всё ярче порога считаем буквами
const TEXT_THRESHOLD = 150
const MIN_CONFIDENCE = 15

let worker = null
let workerLangs = null
let workerReady = null

// один воркер на всё приложение, язык меняем только если поменялся клиент
function getWorker(lang, cacheDir) {
  const langs = lang === 'ru' ? 'rus+eng' : 'eng'
  if (workerReady && workerLangs === langs) return workerReady
  const prev = worker
  workerLangs = langs
  workerReady = (async () => {
    if (prev) await prev.terminate().catch(() => undefined)
    await fs.mkdir(cacheDir, { recursive: true })
    worker = await createWorker(langs, 1, { cachePath: cacheDir })
    return worker
  })()
  return workerReady
}

// скрин экрана, где сейчас мышка; display нужен, чтобы пересчитать координаты курсора
async function captureScreen() {
  const display = screen.getDisplayNearestPoint(screen.getCursorScreenPoint())
  const { width, height } = display.size
  const sf = display.scaleFactor
  const sources = await desktopCapturer.getSources({
    types: ['screen'],
    thumbnailSize: { width: Math.round(width * sf), height: Math.round(height * sf) },
  })
  const source = sources.find((s) => s.display_id === String(display.id)) || sources[0]
  if (!source) throw new Error('Не удалось сделать снимок экрана')
  return { image: source.thumbnail, display }
}

// вырезаем кусок (в пикселях картинки), увеличиваем и делаем чёрный текст на белом
function prepareRect(image, rect) {
  const scaled = image.crop(rect).resize({ width: rect.width * UPSCALE, height: rect.height * UPSCALE, quality: 'best' })
  const size = scaled.getSize()
  const px = Buffer.from(scaled.toBitmap())
  for (let i = 0; i < px.length; i += 4) {
    const v = Math.max(px[i], px[i + 1], px[i + 2]) > TEXT_THRESHOLD ? 0 : 255
    px[i] = v
    px[i + 1] = v
    px[i + 2] = v
    px[i + 3] = 255
  }
  return { png: nativeImage.createFromBitmap(px, size).toPNG(), width: size.width, height: size.height }
}

function areaRect(image, area) {
  const { width, height } = image.getSize()
  return {
    x: Math.round(width * area.x),
    y: Math.round(height * area.y),
    width: Math.max(1, Math.round(width * Math.min(area.w, 1 - area.x))),
    height: Math.max(1, Math.round(height * Math.min(area.h, 1 - area.y))),
  }
}

function collect(data, level) {
  const out = []
  for (const block of data.blocks || []) {
    for (const par of block.paragraphs || []) {
      for (const line of par.lines || []) {
        const items = level === 'line' ? [line] : line.words || []
        for (const w of items) {
          const text = (w.text || '').trim()
          if (text.length >= 2 && w.confidence >= MIN_CONFIDENCE) out.push({ text, confidence: w.confidence, bbox: w.bbox })
        }
      }
    }
  }
  return out
}

async function recognize(png, lang, cacheDir) {
  const w = await getWorker(lang, cacheDir)
  const { data } = await w.recognize(png, {}, { blocks: true })
  return data
}

// награды: image можно передать готовый (для проверки), иначе снимаем экран
async function readRewardColumns({ lang, cacheDir, debugFile, image, area = DEFAULT_SETTINGS.rewardArea }) {
  const shot = image || (await captureScreen()).image
  const { png, width } = prepareRect(shot, areaRect(shot, area))
  if (debugFile) await fs.writeFile(debugFile, png).catch(() => undefined)
  return groupColumns(collect(await recognize(png, lang, cacheDir), 'word'), width)
}

// строки текста вокруг точки (в пикселях картинки). координаты строк - относительно этой точки
async function readLinesAround({ lang, cacheDir, image, point, box, debugFile }) {
  const { width, height } = image.getSize()
  const x = Math.max(0, Math.round(point.x - box.left))
  const y = Math.max(0, Math.round(point.y - box.up))
  const rect = {
    x,
    y,
    width: Math.max(1, Math.min(width - x, Math.round(box.left + box.right))),
    height: Math.max(1, Math.min(height - y, Math.round(box.up + box.down))),
  }
  const { png } = prepareRect(image, rect)
  if (debugFile) await fs.writeFile(debugFile, png).catch(() => undefined)
  const lines = collect(await recognize(png, lang, cacheDir), 'line')
  return lines.map((l) => ({
    text: l.text,
    dx: (l.bbox.x0 + l.bbox.x1) / 2 / UPSCALE + rect.x - point.x,
    dy: (l.bbox.y0 + l.bbox.y1) / 2 / UPSCALE + rect.y - point.y,
  }))
}

async function stopOcr() {
  if (worker) await worker.terminate().catch(() => undefined)
  worker = null
  workerReady = null
}

module.exports = { readRewardColumns, readLinesAround, captureScreen, stopOcr, OCR_DIR: (userData) => path.join(userData, 'ocr') }

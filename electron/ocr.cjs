'use strict'

const { desktopCapturer, screen, nativeImage } = require('electron')
const fs = require('node:fs/promises')
const path = require('node:path')
const { createWorker } = require('tesseract.js')
const { groupColumns } = require('./lib/rewards.cjs')

// где на экране названия наград, доли от экрана. взято с запасом под разные масштабы интерфейса
const REWARD_AREA = { x: 0.18, y: 0.16, w: 0.64, h: 0.4 }
const UPSCALE = 2
// текст наград светлый на тёмном фоне, всё ярче порога считаем буквами
const TEXT_THRESHOLD = 150
const MIN_CONFIDENCE = 15

let worker = null
let workerLangs = null

async function getWorker(lang, cacheDir) {
  const langs = lang === 'ru' ? 'rus+eng' : 'eng'
  if (worker && workerLangs === langs) return worker
  if (worker) await worker.terminate()
  await fs.mkdir(cacheDir, { recursive: true })
  worker = await createWorker(langs, 1, { cachePath: cacheDir })
  workerLangs = langs
  return worker
}

// скрин того экрана, где сейчас мышка
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
  return source.thumbnail
}

// вырезаем область, увеличиваем и делаем чёрный текст на белом - так tesseract читает лучше
function prepare(image, area = REWARD_AREA) {
  const { width, height } = image.getSize()
  const rect = {
    x: Math.round(width * area.x),
    y: Math.round(height * area.y),
    width: Math.round(width * area.w),
    height: Math.round(height * area.h),
  }
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
  return { png: nativeImage.createFromBitmap(px, size).toPNG(), width: size.width }
}

function wordsOf(data) {
  const out = []
  for (const block of data.blocks || []) {
    for (const par of block.paragraphs || []) {
      for (const line of par.lines || []) {
        for (const w of line.words || []) {
          const text = (w.text || '').trim()
          if (text.length >= 2 && w.confidence >= MIN_CONFIDENCE) out.push({ text, confidence: w.confidence, bbox: w.bbox })
        }
      }
    }
  }
  return out
}

// image можно передать готовый (для проверки), иначе снимаем экран
async function readRewardColumns({ lang, cacheDir, debugFile, image }) {
  const shot = image || (await captureScreen())
  const { png, width } = prepare(shot)
  if (debugFile) await fs.writeFile(debugFile, png).catch(() => undefined)
  const w = await getWorker(lang, cacheDir)
  const { data } = await w.recognize(png, {}, { blocks: true })
  return groupColumns(wordsOf(data), width)
}

async function stopOcr() {
  if (worker) await worker.terminate().catch(() => undefined)
  worker = null
}

module.exports = { readRewardColumns, stopOcr, prepare, REWARD_AREA, OCR_DIR: (userData) => path.join(userData, 'ocr') }

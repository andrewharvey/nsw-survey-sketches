#!/usr/bin/env node

import { readdir, readFile, appendFile, lstat } from 'node:fs/promises'
import { join } from 'node:path'
import pLimit from 'p-limit'

import util from 'node:util'
import { execFile } from 'node:child_process'
const execFilePromise = util.promisify(execFile);

const limit = pLimit(16)
const tasks = []

const geojsonFile = 'data/SurveyMarkGDA2020.geojson'
const imagesRoot = 'data/images'
const outputRoot = 'data/geotagged'

// index features
console.log(`Indexing ${geojsonFile}...`)
const geojson = JSON.parse(await readFile(geojsonFile, { encoding: 'utf8' }))
const index = {}
for (const feature of geojson.features) {
  const id = [feature.properties?.marktype, feature.properties?.marknumber].join('')
  index[id] = feature.geometry.coordinates
}

const imageFileNames = (await readdir(imagesRoot)).filter(async fileName => (await lstat(join(imagesRoot, fileName))).isFile() && fileName.endsWith('.jpg'))

for (const imageFileName of imageFileNames) {
  const id = imageFileName.split('-')[0]

  if (id in index) {
    const coordinates = index[id]

    const lon = coordinates[0]
    const lat = coordinates[1]

    //console.log(`${id}: ${lon}, ${lat}`)

    const img_input = join(imagesRoot, imageFileName)
    const img_output = join(outputRoot, imageFileName)

    const i = tasks.length
    // use setexif.pl to set the EXIF tags
    tasks.push(limit(async () => {
      const { stdout, stderr } = await execFilePromise('./src/setexif.pl', ['--input', img_input, '--output', img_output, '--lat', lat, '--lon', lon])

      process.stdout.write(`${i} of ${tasks.length}\r`)

      if (stderr) {
        console.log(stdout)
        console.error(stderr)
        await appendFile('geotag.setexif-error.log', `${id}\n`);
      }
    }))
  } else {
    console.log(`No coordinates for ${id}`)
    await appendFile('geotag.missing-footprint.log', `${id}\n`);
  }
}

console.log(`${tasks.length} tasks`)
await Promise.all(tasks)

process.stdout.write('\n')

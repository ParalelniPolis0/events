import * as fs from "node:fs";
import { join } from "node:path";
import { load } from "./events.js";

const destDir = './dist';

const output = {
    events: load(true),
    generatedAt: new Date().toISOString()
}

if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir)
}
const destFn = join(destDir, 'index.json')
fs.writeFileSync(destFn, JSON.stringify(output, null, 2))
console.log(`Writed: ${destFn}`)

const destJsFn = join(destDir, 'events.js')
fs.writeFileSync(destJsFn, `export default ${JSON.stringify(output)};`)
console.log(`Writed: ${destJsFn}`)
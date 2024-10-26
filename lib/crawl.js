import { load } from "./events.js";
import { loadConnectors } from "./connector.js";
import * as yaml from 'js-yaml';
import * as path from 'node:path';
import * as fs from "node:fs";

const genDir = './gen';
const events = load();
const connectors = await loadConnectors();

for (const e of events) {
    if (e.refs?.luma) {
        const resp = await connectors.luma.inspect({}, `https://lu.ma/${e.refs.luma}`);
        if (!resp) {
            continue;
        }
        const respEvent = resp.events[0];
        if (!respEvent) {
            continue;
        }
        const gen = {
            'gen:luma': respEvent
        }
        const outDir = path.join(genDir, e.year);
        if (!fs.existsSync(outDir)) {
            fs.mkdirSync(outDir, { recursive: true });
        }
        const outFn = path.join(outDir, e.id + '.json');
        fs.writeFileSync(outFn, JSON.stringify(gen, null, 2));
        console.log(`Writed: ${outFn}`);
    }
}
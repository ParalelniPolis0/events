import * as fs from 'node:fs';
import * as path from 'node:path';
import * as yaml from 'js-yaml';

const srcDir = "./src";
const genDir = "./gen";

export function load(full = false) {
    const items = []
    for (const fn of fs.readdirSync(srcDir)) {
        const fullFn = path.join(srcDir, fn);
        const year = path.parse(fn).name;
        if (!year.match(/^\d{4}$/)) {
            continue;
        }
        const data = yaml.load(fs.readFileSync(fullFn));
        items.push(...data.map(i => {
            i.year = year
            if (full) {
                const genFn = path.join(genDir, year, i.id + ".json");
                if (fs.existsSync(genFn)) {
                    const gen = JSON.parse(fs.readFileSync(genFn));
                    for (const genId of Object.keys(gen)) {
                        Object.assign(i, gen[genId]);
                    }
                }
            }
            return i
        }));
    }
    return items
}
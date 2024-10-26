import * as cheerio from "cheerio";
import * as fs from "node:fs";
import { createHash } from "node:crypto";
import { join, resolve } from "node:path";

export class Connector {
    constructor(data) {
        Object.assign(this, data);
    }
}

export async function fetchNextPage(connector, url) {
    const hash = createHash('sha256');
    hash.update(url);
    const digest = hash.digest('hex');
    //console.log({ url, digest })

    const tmpDir = `./tmp/${connector.id}`;
    const tmpFile = join(tmpDir, digest);
    if (fs.existsSync(tmpFile)) {
        return JSON.parse(fs.readFileSync(tmpFile));
    }

    const res = await fetch(url);
    const html = await res.text();
    const page = cheerio.load(html);
    const nextData = JSON.parse(page("#__NEXT_DATA__").text());
    const data = nextData.props.pageProps;

    if (!fs.existsSync(tmpDir)) {
        fs.mkdirSync(tmpDir, { recursive: true });
    }
    fs.writeFileSync(tmpFile, JSON.stringify(data, null, 2));

    return data;
}

export async function loadConnectors(api) {
    const cdir = "./lib/connectors";

    const out = {};
    for (const cf of fs.readdirSync(cdir)) {
        const fn = resolve(cdir, cf);
        const d = await import(fn);
        const n = cf.replace(".js", "");
        out[n] = d.default;
        out[n].id = n;
    }
    return out;
}
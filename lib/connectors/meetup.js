import slugify from 'slugify'
import { dump } from 'js-yaml'
import { Connector } from '../connector.js';
import { createHash } from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";

function calcHash(str) {
    const hash = createHash('sha256');
    hash.update(str);
    return hash.digest('hex');
}

async function meetup_gql2(bodyObj) {
    const body = JSON.stringify(bodyObj)
    const hash = calcHash(body)

    const tmpDir = `./tmp/meetup`;
    if (!fs.existsSync(tmpDir)) {
        fs.mkdirSync(tmpDir, { recursive: true })
    }
    const tmpFile = path.join(tmpDir, hash);
    if (fs.existsSync(tmpFile)) {
        return JSON.parse(fs.readFileSync(tmpFile));
    }

    const resp = await fetch("https://www.meetup.com/gql2", {
        "headers": {
            "accept": "*/*",
            "accept-language": "en-US",
            "apollographql-client-name": "nextjs-web",
            "cache-control": "no-cache",
            "content-type": "application/json",
            "pragma": "no-cache",
            "priority": "u=1, i",
            "sec-ch-ua": "\"Chromium\";v=\"129\", \"Not=A?Brand\";v=\"8\"",
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": "\"macOS\"",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-origin",
            "x-meetup-view-id": "68ee4c71-36df-4065-be79-355c51263730"
        },
        "referrer": "https://www.meetup.com/paralelnipolis/events/?type=past",
        "referrerPolicy": "strict-origin-when-cross-origin",
        "body": body,
        "method": "POST",
        "mode": "cors",
        "credentials": "include"
    });
    const json = await resp.json()

    fs.writeFileSync(tmpFile, JSON.stringify(json, null, 2));
    return json
}

async function loadEvents(urlKey, after) {
    const body = {
        "operationName": "getPastGroupEvents",
        "variables": {
            "urlname": urlKey
        },
        "extensions": {
            "persistedQuery": {
                "version": 1,
                "sha256Hash": "d2bfd9a0aa0e463c7b016f03666b76ded93f148b3f0445cd6d32c3258eff17d2"
            }
        }
    }
    if (after && after !== true) {
        body.variables.after = after
    }
    const json = await meetup_gql2(body)
    const base = json.data?.groupByUrlname.events
    return {
        items: base.edges.map(e => e.node),
        nextPage: base.pageInfo.hasNextPage ? base.pageInfo.endCursor : false
    }
}

async function fetchItems(accountName = "paralelnipolis") {
    const events = []

    let nextPage = true
    while (nextPage) {
        const out = await loadEvents(accountName, nextPage)
        nextPage = out.nextPage
        for (const e of out.items) {
            if (events.length === 0) {
                //console.log(e)
            }
            const date = e.dateTime.match(/^(\d{4}-\d{2}-\d{2})/)[1]
            const id = `${date}-${slugify(e.title, { lower: true, strict: true })}`
            if (events.find(e => e.id === id)) {
                continue
            }
            events.push({
                id,
                name: e.title,
                place: {
                    city: 'Prague',
                    country: 'cz',
                },
                venues: [{ name: "Paralelni Polis Praha" }],
                date,
                startTime: e.dateTime,
                endTime: e.endTime,
                description: e.description.replace(/\[(.*?)\]\((?!https?:\/\/)(.*?)\)/g, '[$1](https://$2)'),
                refs: {
                    meetup_id: e.id,
                    meetup: `https://www.meetup.com/${accountName}/events/${e.id}/`
                },
            })
        }
    }

    /*const outputFn = `./src/data/meetup.yaml`
    await Bun.write(outputFn, dump(events))
    console.log(`\nWrited: ${outputFn} (${events.length} events)`)*/
    return events
}

export default new Connector({
    id: 'meetup',
    fetchItems
})
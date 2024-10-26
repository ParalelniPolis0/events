import { load } from "./events.js";
import { loadConnectors } from "./connector.js";
import * as yaml from 'js-yaml';

const genDir = './gen';
const events = load();
const connectors = await loadConnectors();

const meetupItems = await connectors.meetup.fetchItems();
console.log(`Missing items: \n\n`)
for (const i of meetupItems) {
    if (events.find(e => e.refs?.meetup_id && (e.refs?.meetup_id === i.refs?.meetup_id))) {
        continue;
    }
    console.log(yaml.dump([i]) + '\n')
}
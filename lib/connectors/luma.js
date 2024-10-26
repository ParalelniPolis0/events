import { Connector, fetchNextPage } from "../connector.js";

function processEvent(d) {
    const e = d.event;
    return {
        remoteId: 'luma:' + e.api_id,
        name: e.name,
        dateStart: e.start_at,
        dateEnd: e.end_at,
        timezone: e.timezone,
        place: {
            name: e.geo_address_info?.address || undefined,
            city: e.geo_address_info?.city || undefined,
            countryName: e.geo_address_info?.country || undefined
        },
        img: e.cover_url,
        /*guests: d.featured_guests?.map((p) => ({
            name: p.name,
            avatarUrl: p.avatar_url,
            timezone: p.timezone,
        })),*/
        hosts: d.hosts?.map((p) => ({
            name: p.name,
            avatarUrl: p.avatar_url,
            timezone: p.timezone,
        })),
        guestCount: d.guest_count || undefined,
    };
}

async function inspect(ctx, url) {
    const pg = await fetchNextPage(this, url);
    const data = pg.initialData;

    const events = [];
    if (data.kind === "event") {
        events.push(processEvent(data.data));
    } else if (data.kind === "calendar") {
        events.push(...data.data.featured_items.map((fi) => processEvent(fi)));
    } else if (data.featured_items) {
        events.push(...data.featured_items.map((fi) => processEvent(fi)));
    }
    return {
        events,
    };
}

export default new Connector({
    id: 'luma',
    urlPatterns: [/^https:\/\/lu\.ma\//],
    inspect,
});
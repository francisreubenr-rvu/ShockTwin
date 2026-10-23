'use strict';
const {
  cds,
  context,
  allow,
  payload,
  fail,
  number,
  text,
  audit,
  randomUUID,
} = require('./lib/common');
const repo = require('./lib/repository');
const { rankListings, publicListing, date } = require('./lib/matching');
const { explain } = require('./lib/explanations');
module.exports = cds.service.impl(function () {
  this.on('listListings', async (req) => {
    allow(req, 'Buyer', 'Planner', 'CapacityProvider', 'Admin');
    const listings = await cds
      .tx(req)
      .run(cds.ql.SELECT.from(repo.entity('CapacityListings')).where({ active: true }));
    return JSON.stringify({ illustrative: true, listings: listings.map(publicListing) });
  });
  this.on('publishListing', async (req) => {
    allow(req, 'CapacityProvider');
    const ctx = context(req);
    const db = cds.tx(req);
    const input = payload(req);
    const permitted = new Set(['capacityType', 'location', 'startDate', 'endDate', 'priceBand']);
    if (Object.keys(input).some((k) => !permitted.has(k)))
      fail(400, 'Only public capacity-envelope fields may be published');
    if (!['moulding', 'transport', 'warehouse', 'supplier'].includes(input.capacityType))
      fail(400, 'Unsupported capacity type');
    if (!['low', 'medium', 'high'].includes(input.priceBand))
      fail(400, 'Price band must be low, medium or high');
    if (
      !input.location ||
      typeof input.location !== 'object' ||
      Object.keys(input.location).some((k) => !['name', 'latitude', 'longitude'].includes(k))
    )
      fail(400, 'Location requires name, latitude and longitude only');
    const startDate = date(input.startDate, 'Start date');
    const endDate = date(input.endDate, 'End date');
    if (endDate < startDate) fail(400, 'End date must follow start date');
    const row = {
      tenantId: ctx.tenantId,
      ID: randomUUID(),
      illustrative: true,
      capacityType: input.capacityType,
      location: text(input.location.name, 'Location'),
      latitude: number(input.location.latitude, 'Latitude', -90, 90),
      longitude: number(input.location.longitude, 'Longitude', -180, 180),
      startDate,
      endDate,
      priceBand: input.priceBand,
      providerName: ctx.actor,
      volumeDaily: 0,
      leadTimeDays: 0,
      capabilityFit: 0,
      exactUnitPrice: 0,
      qualification: 'Private provider qualification pending; not match eligible until configured',
      active: true,
    };
    await db.run(cds.ql.INSERT.into(repo.entity('CapacityListings')).entries(row));
    await audit(db, ctx, 'CAPACITY_PUBLISHED', 'CapacityListing', row.ID, null, publicListing(row));
    return JSON.stringify({ illustrative: true, listing: publicListing(row) });
  });
  this.on('findMatches', async (req) => {
    allow(req, 'Planner', 'Buyer');
    const ctx = context(req);
    const db = cds.tx(req);
    const input = payload(req);
    const company = await repo.one(db, 'Companies', ctx.tenantId, 'buyer');
    if (!company) fail(404, 'Buyer company was not found', 'NOT_FOUND');
    if (input.scenarioId && !(await repo.one(db, 'Scenarios', ctx.tenantId, input.scenarioId)))
      fail(404, 'Scenario was not found', 'NOT_FOUND');
    const listings = await db.run(
      cds.ql.SELECT.from(repo.entity('CapacityListings')).where({ active: true }),
    );
    const ranked = rankListings(listings, input, company);
    const matches = [];
    for (let i = 0; i < ranked.length; i += 1) {
      const match = ranked[i];
      const listing = listings.find((l) => l.ID === match.listingId);
      match.id = randomUUID();
      const fallback =
        i === 0
          ? 'This qualified demo option ranks first on the displayed capability, distance, volume, lead-time and price-band factors.'
          : 'This eligible demo option meets the requested capacity, date, distance and volume constraints.';
      const explanation = await explain(
        'capacity-match',
        { rank: i + 1, breakdown: match.breakdown, illustrative: true },
        fallback,
      );
      match.explanation = explanation.text;
      await db.run(
        cds.ql.INSERT.into(repo.entity('Matches')).entries({
          tenantId: ctx.tenantId,
          ID: match.id,
          illustrative: true,
          scenarioId: input.scenarioId || null,
          listingId: match.listingId,
          providerTenantId: listing.tenantId,
          request: JSON.stringify({ ...input, volume: input.volume ?? 100 }),
          result: JSON.stringify(match),
          score: match.score,
          eligible: true,
          createdAt: new Date().toISOString(),
        }),
      );
      matches.push(match);
    }
    await audit(db, ctx, 'CAPACITY_MATCHED', 'Scenario', input.scenarioId || 'ad-hoc', null, {
      totalEligible: matches.length,
    });
    return JSON.stringify({
      illustrative: true,
      matches,
      totalEligible: matches.length,
      scoringRule:
        'Capability .30 + distance .25 + volume .20 + lead time .15 + price band .10; design weights, not validated economics.',
    });
  });
});

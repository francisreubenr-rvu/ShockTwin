'use strict';
const { fail, number } = require('./common');
const WEIGHTS = { capability: 0.3, distance: 0.25, volume: 0.2, leadTime: 0.15, priceBand: 0.1 };
function haversine(lat1, lon1, lat2, lon2) {
  const rad = (n) => (n * Math.PI) / 180;
  const dlat = rad(lat2 - lat1);
  const dlon = rad(lon2 - lon1);
  const a =
    Math.sin(dlat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dlon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
function publicListing(row) {
  return {
    id: row.ID ?? row.id,
    capacityType: row.capacityType,
    location: { name: row.location, latitude: row.latitude, longitude: row.longitude },
    startDate: String(row.startDate).slice(0, 10),
    endDate: String(row.endDate).slice(0, 10),
    priceBand: row.priceBand,
  };
}
function date(value, label) {
  if (
    typeof value !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
    !Number.isFinite(new Date(value).getTime()) ||
    new Date(value).toISOString().slice(0, 10) !== value
  )
    fail(400, `${label} must be a valid ISO date`);
  return value;
}
function rankListings(listings, input = {}, buyer = { latitude: 12.9716, longitude: 77.5946 }) {
  const capacityType = input.capacityType ?? 'moulding';
  if (!['moulding', 'transport', 'warehouse', 'supplier'].includes(capacityType))
    fail(400, 'Unsupported capacity type');
  const radiusKm = number(input.radiusKm, 'Radius', 1, 1000, 150);
  const volume = number(input.volume, 'Requested volume', 0.01, 1000000, 100);
  const startDate = date(input.startDate ?? '2026-10-26', 'Start date');
  const endDate = date(input.endDate ?? '2026-11-22', 'End date');
  if (endDate < startDate) fail(400, 'End date must follow start date');
  const maxLeadTime = number(input.maxLeadTime, 'Maximum lead time', 0, 90, 3);
  return listings
    .flatMap((listing) => {
      const distanceKm = haversine(
        buyer.latitude,
        buyer.longitude,
        listing.latitude,
        listing.longitude,
      );
      if (
        listing.active === false ||
        listing.capacityType !== capacityType ||
        String(listing.startDate).slice(0, 10) > startDate ||
        String(listing.endDate).slice(0, 10) < endDate ||
        listing.volumeDaily < volume ||
        listing.leadTimeDays > maxLeadTime ||
        distanceKm > radiusKm
      )
        return [];
      const factors = {
        capability: Math.min(1, Math.max(0, listing.capabilityFit)),
        distance: Math.max(0, 1 - distanceKm / radiusKm),
        volume: Math.min(1, listing.volumeDaily / volume),
        leadTime: Math.max(0, 1 - listing.leadTimeDays / (maxLeadTime + 1)),
        priceBand: { low: 1, medium: 0.5, high: 0 }[listing.priceBand] ?? 0,
      };
      const breakdown = Object.fromEntries(
        Object.entries(WEIGHTS).map(([key, weight]) => [
          key,
          {
            score: +factors[key].toFixed(6),
            weight,
            contribution: +(factors[key] * weight).toFixed(6),
          },
        ]),
      );
      return [
        {
          listingId: listing.ID ?? listing.id,
          capacityType,
          location: listing.location,
          distanceKm: +distanceKm.toFixed(1),
          priceBand: listing.priceBand,
          score: +Object.values(breakdown)
            .reduce((sum, factor) => sum + factor.contribution, 0)
            .toFixed(6),
          eligible: true,
          breakdown,
          illustrative: true,
        },
      ];
    })
    .sort((a, b) => b.score - a.score || a.listingId.localeCompare(b.listingId));
}
module.exports = { rankListings, publicListing, haversine, date, WEIGHTS };

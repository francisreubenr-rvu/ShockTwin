sap.ui.define(
  [
    'sap/m/VBox',
    'sap/m/HBox',
    'sap/m/Select',
    'sap/ui/core/Item',
    'sap/m/StepInput',
    'sap/m/DatePicker',
    'sap/m/MessageStrip',
    'sap/m/Title',
    'sap/m/Table',
    'sap/m/Column',
    'sap/m/ColumnListItem',
    'sap/m/Text',
    'sap/m/Button',
    'shocktwin/lib/ui',
  ],
  function (
    VBox,
    HBox,
    Select,
    Item,
    StepInput,
    DatePicker,
    MessageStrip,
    Title,
    Table,
    Column,
    ColumnListItem,
    Text,
    Button,
    ui,
  ) {
    'use strict';
    const factorNames = {
      capability: 'Capability fit',
      distance: 'Distance',
      volume: 'Volume coverage',
      leadTime: 'Lead-time fit',
      priceBand: 'Price band',
    };
    function location(value) {
      return typeof value === 'object' && value
        ? value.name || 'Provider location'
        : value || 'Provider location';
    }
    function create(app) {
      const request = app.matchRequest || {
        capacityType: 'moulding',
        radiusKm: 150,
        volume: 100,
        startDate: '2026-10-26',
        endDate: '2026-11-22',
      };
      const type = new Select({
        selectedKey: request.capacityType,
        width: '190px',
        items: [
          new Item({ key: 'moulding', text: 'Moulding capacity' }),
          new Item({ key: 'transport', text: 'Transport capacity' }),
          new Item({ key: 'warehouse', text: 'Warehouse space' }),
          new Item({ key: 'supplier', text: 'Alternate supplier' }),
        ],
      });
      const radius = new StepInput({
        value: request.radiusKm,
        min: 1,
        max: 1000,
        step: 25,
        width: '135px',
      });
      const volume = new StepInput({
        value: request.volume,
        min: 1,
        max: 10000,
        step: 10,
        width: '145px',
      });
      const start = new DatePicker({
        value: request.startDate,
        valueFormat: 'yyyy-MM-dd',
        displayFormat: 'dd MMM yyyy',
        width: '165px',
      });
      const end = new DatePicker({
        value: request.endDate,
        valueFormat: 'yyyy-MM-dd',
        displayFormat: 'dd MMM yyyy',
        width: '165px',
      });
      const search = ui.button(
        'Find capacity',
        function () {
          app.findCapacity({
            capacityType: type.getSelectedKey(),
            radiusKm: radius.getValue(),
            volume: volume.getValue(),
            startDate: start.getValue(),
            endDate: end.getValue(),
            scenarioId: app.scenario && app.scenario.id,
          });
        },
        true,
        'sap-icon://search',
      );
      const header = ui.header(
        '03 / RESPOND · CAPACITYMESH',
        'Borrow the capacity to keep moving.',
        'Rank spare capacity against your scenario, then draft a response for human approval.',
      );
      const filters = new HBox({
        items: [
          ui.field('Capacity type', type),
          ui.field('Radius (km)', radius),
          ui.field('Required / day', volume),
          ui.field('Available from', start),
          ui.field('Available through', end),
          new VBox({ items: [search] }).addStyleClass('stSearchAction'),
        ],
        wrap: 'Wrap',
        alignItems: 'End',
      }).addStyleClass('stCapacityFilters');
      const items = [
        header,
        ui.section(
          'Find a qualified alternative',
          'Illustrative listings · provider-private volume and capabilities are evaluated by the matching adapter.',
          filters,
        ),
      ];
      if (!app.scenario)
        items.push(
          new MessageStrip({
            text: 'Run a shock scenario first to connect a capacity response to its inventory assumptions and draft a purchase order.',
            type: 'Information',
            showIcon: true,
          }),
        );
      const matches = app.matches || [];
      if (app.matchResult) {
        items.push(
          new HBox({
            items: [
              ui.stat(
                'ELIGIBLE MATCHES',
                String(matches.length),
                'Inside your selected constraints',
              ),
              ui.stat(
                'SEARCH RADIUS',
                ui.number(request.radiusKm) + ' km',
                'From the Illustrative buyer location',
              ),
              ui.stat(
                'REQUIRED CAPACITY',
                ui.number(request.volume) + ' / day',
                'Provider-private eligibility check',
              ),
              ui.stat('NEXT ACTION', 'Draft → approve', 'Human control at commitment'),
            ],
            wrap: 'Wrap',
          }).addStyleClass('stStatsRow'),
        );
        const cards = matches.map(function (match, index) {
          const listing =
            app.listings.find(function (entry) {
              return entry.id === match.listingId;
            }) || {};
          const breakdown = match.breakdown || {};
          const factors = Object.keys(factorNames)
            .map(function (key) {
              const factor = breakdown[key] || {};
              const score = Math.max(0, Math.min(1, Number(factor.score) || 0));
              const weight = Number(factor.weight) || 0;
              return (
                '<div class="stFactor"><div><span>' +
                factorNames[key] +
                '</span><strong>' +
                ui.percent(score) +
                '</strong></div><div class="stFactorTrack"><i style="width:' +
                (score * 100).toFixed(1) +
                '%"></i></div><small>' +
                ui.percent(weight) +
                ' weight</small></div>'
              );
            })
            .join('');
          const draft = ui.button(
            'Draft PO',
            function () {
              app.draftPO(match);
            },
            index === 0,
            'sap-icon://document',
          );
          draft.setEnabled(!!app.scenario && match.eligible !== false);
          return ui.grow(
            new VBox({
              items: [
                new HBox({
                  items: [
                    ui.html(
                      '<div class="stMatchIndex">' + String(index + 1).padStart(2, '0') + '</div>',
                    ),
                    ui.status(
                      index === 0 ? 'Highest ranked' : 'Eligible match',
                      index === 0 ? 'Warning' : 'Success',
                    ),
                    ui.grow(new VBox()),
                    new VBox({
                      items: [
                        ui.text('FIT SCORE', 'stStatLabel'),
                        ui.text(ui.percent(match.score), 'stMatchScore'),
                      ],
                    }),
                  ],
                  alignItems: 'Center',
                }).addStyleClass('stMatchTop'),
                new Title({
                  text:
                    (match.capacityType || request.capacityType).replace(/^./, function (char) {
                      return char.toUpperCase();
                    }) +
                    ' · ' +
                    location(match.location || listing.location),
                  level: 'H3',
                  wrapping: true,
                }).addStyleClass('stMatchTitle'),
                ui.html(
                  '<div class="stMatchMeta"><span>' +
                    ui.number(match.distanceKm, 1) +
                    ' km away</span><span>' +
                    ui.escape(match.priceBand || listing.priceBand || 'Price band available') +
                    '</span><span>' +
                    ui.escape(listing.startDate || request.startDate) +
                    ' → ' +
                    ui.escape(listing.endDate || request.endDate) +
                    '</span></div>',
                ),
                ui.text(
                  match.explanation ||
                    'Ranked using the displayed capability, distance, volume, lead-time and price-band factors.',
                  'stExplanation',
                ),
                ui.html('<div class="stFactorGrid">' + factors + '</div>'),
                new HBox({
                  items: [draft, ui.text('Human approval required', 'stSmallNote')],
                  alignItems: 'Center',
                  justifyContent: 'SpaceBetween',
                  wrap: 'Wrap',
                }).addStyleClass('stMatchActions'),
              ],
            }).addStyleClass('stMatchCard' + (index === 0 ? ' stTopMatch' : '')),
          );
        });
        items.push(
          new HBox({ items: cards, wrap: 'Wrap', alignItems: 'Stretch' }).addStyleClass(
            'stMatchesRow',
          ),
        );
        if (!matches.length)
          items.push(
            ui.empty(
              'No eligible capacity in this search.',
              'Try a wider radius or different dates. A missing match is an honest result; no capacity is fabricated.',
            ),
          );
        items.push(
          new MessageStrip({
            text: 'Ranking weights are product design choices, not validated economic outcomes. A match is a suggestion; tooling, quality, availability and commercial terms still require bilateral qualification.',
            type: 'Information',
            showIcon: true,
          }),
        );
      } else {
        items.push(
          ui.empty(
            'A response starts with a real constraint.',
            'Select capacity, distance, dates and volume. Find capacity evaluates the seeded provider adapters and explains the ranking.',
          ),
        );
      }
      if (app.listings.length) {
        const table = new Table({
          columns: [
            new Column({ header: new Text({ text: 'Capacity' }) }),
            new Column({ header: new Text({ text: 'Location' }) }),
            new Column({ header: new Text({ text: 'Dates' }) }),
            new Column({ header: new Text({ text: 'Price band' }) }),
          ],
          items: app.listings.map(function (entry) {
            return new ColumnListItem({
              cells: [
                new Text({ text: entry.capacityType }),
                new Text({ text: location(entry.location) }),
                new Text({ text: entry.startDate + ' → ' + entry.endDate }),
                new Text({ text: entry.priceBand }),
              ],
            });
          }),
        });
        items.push(
          ui.section(
            'The shared listing envelope',
            'Only capacity type, location, available dates and price band are public. Raw transactions stay private.',
            table,
          ),
        );
      }
      return new VBox({ items: items });
    }
    return { create: create };
  },
);

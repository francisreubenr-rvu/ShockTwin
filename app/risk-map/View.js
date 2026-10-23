sap.ui.define(
  [
    'sap/m/VBox',
    'sap/m/HBox',
    'sap/m/Title',
    'sap/m/Button',
    'sap/m/MessageStrip',
    'sap/m/Link',
    'shocktwin/lib/ui',
    'shocktwin/controls/SupplierGraph',
  ],
  function (VBox, HBox, Title, Button, MessageStrip, Link, ui, SupplierGraph) {
    'use strict';
    function create(app) {
      const state = app.state;
      const inferred = state.links.filter(function (link) {
        return link.inferred;
      });
      const active = inferred.filter(function (link) {
        return link.reviewStatus !== 'rejected';
      });
      const suppliers = state.nodes.filter(function (node) {
        return node.type === 'supplier' && Number(node.tier) === 1;
      });
      const inventory =
        state.inventory.find(function (item) {
          return item.materialId === 'resin' || item.id === 'resin';
        }) ||
        state.inventory[0] ||
        {};
      const stock = Number(inventory.onHand == null ? inventory.inventory : inventory.onHand) || 0;
      const burn =
        Number(inventory.dailyBurn == null ? inventory.dailyDemand : inventory.dailyBurn) || 0;
      const coverage = burn ? Math.round(stock / burn) : '—';
      const nodes = new Map(
        state.nodes.map(function (node) {
          return [node.id, node];
        }),
      );
      const header = ui.header(
        '01 / DETECT',
        'Know every dependency.',
        'Reveal the shared upstream links hiding behind an apparently diverse supplier base.',
        [ui.button('Detect hidden links', app.detect.bind(app), true, 'sap-icon://inspect')],
      );
      const metrics = new HBox({
        items: [
          ui.stat('TIER 1 SUPPLIERS', String(suppliers.length), 'Known immediate relationships'),
          ui.stat(
            'INFERRED LINKS',
            String(active.length),
            active.length ? 'Model hypotheses · review required' : 'Run Detect to explore upstream',
            !!active.length,
          ),
          ui.stat('RESIN COVERAGE', coverage + ' days', 'Current stock / daily demand'),
          ui.stat(
            'LATEST SIGNAL',
            state.signals.length ? 'Cyclone' : 'No signal',
            'Illustrative feed · upstream location',
            true,
          ),
        ],
        wrap: 'Wrap',
      }).addStyleClass('stStatsRow');
      const graph = new SupplierGraph({ graph: { nodes: state.nodes, links: state.links } });
      const graphLegend = ui.html(
        '<div class="stGraphLegend"><span><i class="stKnownLine"></i>Known relationship</span><span><i class="stInferredLine"></i>Inferred · human review</span><span class="stLegendHint">Upstream → your plant</span></div>',
      );
      const graphCard = ui.grow(
        ui.section(
          'Supplier dependency map',
          'Illustrative network · critical material: resin',
          new VBox({ items: [graphLegend, graph] }),
          [
            ui.status(
              active.length ? 'Shared dependency surfaced' : 'Known network',
              active.length ? 'Warning' : 'Information',
            ),
          ],
        ),
      );
      const signal = state.signals[0] || {};
      const signalCard = new VBox({
        items: [
          ui.text('EARLY WARNING', 'stEyebrow'),
          ui.status(state.signals.length ? 'Cyclone signal' : 'No active signal', 'Warning'),
          new Title({
            text: signal.title || 'A storm near a shared source.',
            level: 'H3',
            wrapping: true,
          }).addStyleClass('stSignalTitle'),
          ui.text(
            signal.summary ||
              signal.description ||
              'The Illustrative feed flags a cyclone near the upstream resin plant. Simulate its operational impact before taking action.',
            'stMuted',
          ),
          ui.html('<div class="stSignalDivider"></div>'),
          ui.text('Make the exposure actionable', 'stSignalSubhead'),
          ui.text(
            'Confirm or reject the inferred links, then test inventory survival under a capacity shock.',
            'stMuted',
          ),
          ui.button(
            'Open simulator',
            function () {
              app.navigate('simulator');
            },
            false,
            'sap-icon://navigation-right-arrow',
          ),
        ],
      }).addStyleClass('stSignalCard');
      const graphRow = new HBox({
        items: [graphCard, signalCard],
        wrap: 'Wrap',
        alignItems: 'Stretch',
      }).addStyleClass('stGraphRow');
      const cards = inferred.map(function (link) {
        const source = nodes.get(link.source) || {};
        const target = nodes.get(link.target) || {};
        const evidence = Array.isArray(link.evidence)
          ? link.evidence
          : typeof link.evidence === 'string'
            ? [link.evidence]
            : [];
        const reviewed = link.reviewStatus === 'confirmed' || link.reviewStatus === 'rejected';
        const buttons = reviewed
          ? [
              ui.status(
                link.reviewStatus === 'confirmed' ? 'Human confirmed' : 'Rejected · excluded',
                link.reviewStatus === 'confirmed' ? 'Success' : 'Error',
              ),
            ]
          : [
              ui.button(
                'Confirm link',
                function () {
                  app.decideLink(link.id, 'confirmed');
                },
                false,
              ),
              ui.button(
                'Reject link',
                function () {
                  app.decideLink(link.id, 'rejected');
                },
                false,
              ),
            ];
        return ui.grow(
          new VBox({
            items: [
              new HBox({
                items: [
                  ui.text('INFERRED RELATIONSHIP', 'stEyebrow'),
                  ui.status(
                    reviewed ? link.reviewStatus : 'Needs review',
                    reviewed ? 'None' : 'Warning',
                  ),
                ],
                justifyContent: 'SpaceBetween',
                wrap: 'Wrap',
              }),
              new Title({
                text: (source.name || link.source) + ' → ' + (target.name || link.target),
                level: 'H3',
                wrapping: true,
              }).addStyleClass('stLinkTitle'),
              ui.text('Model confidence', 'stStatLabel'),
              ui.text(ui.percent(link.confidence), 'stConfidence'),
              ui.text(
                link.explanation || 'A model-supported relationship is proposed for human review.',
                'stExplanation',
              ),
              ui.html(
                '<div class="stEvidence">' +
                  evidence
                    .slice(0, 3)
                    .map(function (item) {
                      return (
                        '<span>' +
                        ui.escape(
                          typeof item === 'string'
                            ? item
                            : item.feature || item.name || JSON.stringify(item),
                        ) +
                        '</span>'
                      );
                    })
                    .join('') +
                  '</div>',
              ),
              new HBox({ items: buttons, wrap: 'Wrap' }).addStyleClass('stLinkActions'),
            ],
          }).addStyleClass('stLinkCard'),
        );
      });
      const review = cards.length
        ? new HBox({ items: cards, wrap: 'Wrap' }).addStyleClass('stReviewRow')
        : ui.empty(
            'Your network is ready for a deeper look.',
            'Detect will call the trained GraphSAGE model. Proposed links appear here with their actual confidence and evidence.',
          );
      const items = [
        header,
        metrics,
        graphRow,
        ui.section(
          'Human review, built in',
          'Model confidence is an uncalibrated synthetic-data score, not proof of a commercial relationship.',
          review,
        ),
      ];
      if (inferred.length)
        items.push(
          new MessageStrip({
            text: 'Simulation can include proposed links as hypotheses. Rejected links stay excluded; confirmed links remain part of the reviewed network.',
            type: 'Information',
            showIcon: true,
          }),
        );
      const model = state.model || (state.meta || {}).model || (app.inference || {}).model;
      if (model)
        items.push(
          ui.text(
            'MODEL PROVENANCE · ' +
              (model.version || model.modelVersion || 'GraphSAGE') +
              ' · Synthetic training domain · Full evaluation and split caveats: ml/model/metrics.json',
            'stModelProvenance',
          ),
        );
      return new VBox({ items: items }).addStyleClass('stRiskPage');
    }
    return { create: create };
  },
);

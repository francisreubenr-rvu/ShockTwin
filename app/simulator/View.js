sap.ui.define(
  [
    'sap/m/VBox',
    'sap/m/HBox',
    'sap/m/Select',
    'sap/ui/core/Item',
    'sap/m/Slider',
    'sap/m/StepInput',
    'sap/m/CheckBox',
    'sap/m/MessageStrip',
    'sap/m/Table',
    'sap/m/Column',
    'sap/m/ColumnListItem',
    'sap/m/Text',
    'sap/m/Title',
    'shocktwin/lib/ui',
    'shocktwin/controls/InventoryChart',
  ],
  function (
    VBox,
    HBox,
    Select,
    Item,
    Slider,
    StepInput,
    CheckBox,
    MessageStrip,
    Table,
    Column,
    ColumnListItem,
    Text,
    Title,
    ui,
    InventoryChart,
  ) {
    'use strict';
    function create(app) {
      const defaults = app.simulatorInputs || {
        shockType: 'cyclone',
        duration: 28,
        severity: 1,
        switchDay: 3,
        replacementVolume: 100,
        horizon: 30,
        includeInferred: true,
      };
      const shock = new Select({
        selectedKey: defaults.shockType,
        width: '100%',
        items: [
          new Item({ key: 'cyclone', text: 'Cyclone' }),
          new Item({ key: 'portClosure', text: 'Port closure' }),
          new Item({ key: 'strike', text: 'Strike' }),
          new Item({ key: 'fire', text: 'Fire' }),
        ],
      });
      const durationValue = ui.text(defaults.duration + ' days', 'stSliderValue');
      const duration = new Slider({
        min: 1,
        max: 60,
        step: 1,
        value: defaults.duration,
        width: '100%',
        liveChange: function (event) {
          durationValue.setText(event.getParameter('value') + ' days');
        },
      });
      const severityValue = ui.text(
        Math.round(defaults.severity * 100) + '% capacity loss',
        'stSliderValue',
      );
      const severity = new Slider({
        min: 0,
        max: 100,
        step: 5,
        value: defaults.severity * 100,
        width: '100%',
        liveChange: function (event) {
          severityValue.setText(event.getParameter('value') + '% capacity loss');
        },
      });
      const switchDay = new StepInput({
        value: defaults.switchDay,
        min: 0,
        max: 90,
        step: 1,
        width: '100%',
      });
      const volume = new StepInput({
        value: defaults.replacementVolume,
        min: 0,
        max: 1000,
        step: 10,
        width: '100%',
      });
      const horizon = new StepInput({
        value: defaults.horizon,
        min: 1,
        max: 90,
        step: 1,
        width: '100%',
      });
      const include = new CheckBox({
        text: 'Include proposed links as hypotheses',
        selected: defaults.includeInferred,
      });
      function run() {
        app.simulatorInputs = {
          shockType: shock.getSelectedKey(),
          duration: duration.getValue(),
          severity: severity.getValue() / 100,
          switchDay: switchDay.getValue(),
          replacementVolume: volume.getValue(),
          horizon: horizon.getValue(),
          includeInferred: include.getSelected(),
        };
        app.simulate(app.simulatorInputs);
      }
      const controls = new VBox({
        items: [
          ui.text('SCENARIO INPUTS', 'stEyebrow'),
          ui.field('Shock type', shock),
          ui.field('Duration', new VBox({ items: [durationValue, duration] })),
          ui.field('Severity', new VBox({ items: [severityValue, severity] })),
          new HBox({
            items: [
              ui.grow(ui.field('Switch day', switchDay)),
              ui.grow(ui.field('Replacement / day', volume)),
            ],
          }).addStyleClass('stInputPair'),
          ui.field('Simulation horizon (days)', horizon),
          include,
          ui.text(
            'Confirmed links remain included. Rejected links are always excluded.',
            'stSmallNote',
          ),
          ui.button('Run scenario', run, true, 'sap-icon://media-play'),
          ui.text(
            "Replacement begins after the selected day's consumption. Full flow covers 100 units/day in the default fixture.",
            'stSmallNote',
          ),
        ],
      }).addStyleClass('stScenarioControls');
      const header = ui.header(
        '02 / SIMULATE',
        'Rehearse the shock. Keep the line moving.',
        'Compare inventory survival with and without a response, using explicit material and timing assumptions.',
      );
      const scenario = app.scenario;
      let results;
      if (!scenario || !Array.isArray(scenario.baselineSeries)) {
        results = ui.grow(
          ui.section(
            'Inventory survival',
            'Illustrative simulation · resin',
            ui.empty(
              'Turn a warning into a decision.',
              'Choose a shock and run the scenario. Detect and review upstream links first to include the shared resin exposure.',
            ),
          ),
        );
      } else {
        const assumptions = scenario.assumptions || {};
        const survival =
          scenario.daysToStockout == null ? 'Beyond horizon' : 'day ' + scenario.daysToStockout;
        const mitigated =
          scenario.mitigatedDaysToStockout == null
            ? 'Beyond horizon'
            : 'day ' + scenario.mitigatedDaysToStockout;
        const chart = new InventoryChart({ scenario: scenario });
        const metrics = new HBox({
          items: [
            ui.stat('WITHOUT ACTION', survival, 'First stock-exhaustion boundary', true),
            ui.stat(
              'WITH REPLACEMENT',
              mitigated,
              'Through the ' + (assumptions.horizon || defaults.horizon) + '-day simulation',
            ),
            ui.stat(
              'ORDERS AT RISK',
              String((scenario.ordersAtRisk || []).length),
              'Baseline exposure · Illustrative',
            ),
            ui.stat(
              'REVENUE AT RISK',
              ui.money(scenario.revenueAtRisk, scenario.currency),
              'Exposure, not realized loss',
            ),
          ],
          wrap: 'Wrap',
        }).addStyleClass('stStatsRow stCompactStats');
        results = ui.grow(
          new VBox({
            items: [
              metrics,
              ui.section(
                'Resin inventory, day by day',
                'Illustrative · baseline and mitigation calculated independently',
                new VBox({
                  items: [
                    chart,
                    ui.html(
                      '<div class="stChartCaption"><span>Default stock: ' +
                        ui.number(assumptions.initialStock || 1800) +
                        ' units</span><span>Daily demand: ' +
                        ui.number(assumptions.dailyDemand || 100) +
                        ' units</span><span>Assumed recovery: day ' +
                        ui.number(
                          scenario.timeToRecover == null
                            ? assumptions.duration
                            : scenario.timeToRecover,
                        ) +
                        '</span></div>',
                    ),
                  ],
                }),
                [ui.status('Illustrative', 'Warning')],
              ),
            ],
          }).addStyleClass('stSimulationResults'),
        );
      }
      const items = [
        header,
        new HBox({ items: [controls, results], wrap: 'Wrap', alignItems: 'Stretch' }).addStyleClass(
          'stSimulationRow',
        ),
      ];
      if (scenario) {
        const warnings = scenario.warnings || [];
        items.push(
          new MessageStrip({
            text:
              warnings.join(' · ') ||
              'Illustrative conditional result. The model simplifies BOMs, substitutions and restart behavior; qualification and sufficient replacement flow are assumed.',
            type: 'Information',
            showIcon: true,
          }),
        );
        const orders = scenario.ordersAtRisk || [];
        const table = new Table({
          columns: [
            new Column({ header: new Text({ text: 'Order' }) }),
            new Column({ header: new Text({ text: 'Due day' }) }),
            new Column({ header: new Text({ text: 'Material / quantity' }) }),
            new Column({ header: new Text({ text: 'Revenue exposure' }), hAlign: 'End' }),
          ],
          items: orders.map(function (order) {
            return new ColumnListItem({
              cells: [
                new Text({
                  text: order.name || order.orderNumber || order.id || order.ID || 'Order',
                }),
                new Text({ text: 'Day ' + (order.dueDay == null ? '—' : order.dueDay) }),
                new Text({
                  text:
                    (order.materialId || 'resin') +
                    ' · ' +
                    ui.number(order.quantity || order.requiredMaterialUnits) +
                    ' units',
                }),
                new Text({
                  text: ui.money(
                    order.value == null ? order.revenueAtRisk : order.value,
                    order.currency || scenario.currency,
                  ),
                }),
              ],
            });
          }),
          noDataText: 'No seeded orders are exposed under this scenario.',
        });
        items.push(
          ui.section(
            'Orders exposed without action',
            'Illustrative order values · finite horizon · no double counting',
            table,
          ),
        );
        items.push(
          new HBox({
            items: [
              ui.grow(
                new VBox({
                  items: [
                    new Title({ text: 'Make the scenario actionable.', level: 'H3' }),
                    ui.text(
                      'CapacityMesh ranks available alternatives. A match still needs operational qualification and human approval.',
                      'stMuted',
                    ),
                  ],
                }),
              ),
              ui.button(
                'Find a response',
                function () {
                  app.navigate('capacitymesh');
                },
                true,
                'sap-icon://navigation-right-arrow',
              ),
            ],
            alignItems: 'Center',
            wrap: 'Wrap',
          }).addStyleClass('stNextAction'),
        );
      }
      return new VBox({ items: items });
    }
    return { create: create };
  },
);

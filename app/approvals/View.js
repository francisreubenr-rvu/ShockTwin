sap.ui.define(
  [
    'sap/m/VBox',
    'sap/m/HBox',
    'sap/m/Title',
    'sap/m/Dialog',
    'sap/m/TextArea',
    'sap/m/Button',
    'sap/m/MessageBox',
    'sap/m/MessageStrip',
    'shocktwin/lib/ui',
  ],
  function (VBox, HBox, Title, Dialog, TextArea, Button, MessageBox, MessageStrip, ui) {
    'use strict';
    function auditValue(value) {
      if (value == null || value === '') return '—';
      if (typeof value !== 'object') return String(value);
      if (value.status || value.reviewStatus)
        return (
          String(value.status || value.reviewStatus) +
          (value.reason ? ' (' + value.reason + ')' : '')
        );
      if (value.confidence != null) return 'Model score ' + ui.percent(value.confidence);
      if (value.count != null) return String(value.count) + ' relationships';
      const summary = JSON.stringify(value);
      return summary.length > 160 ? summary.substring(0, 157) + '…' : summary;
    }
    function reject(app, draft) {
      const reason = new TextArea({
        width: '100%',
        rows: 3,
        placeholder: 'Why is this response not ready?',
        maxLength: 1000,
      });
      const dialog = new Dialog({
        title: 'Reject draft PO',
        contentWidth: '420px',
        content: [
          new VBox({
            items: [
              ui.text('Record the reason. No purchase will be committed.', 'stMuted'),
              reason,
            ],
          }).addStyleClass('stDialogContent'),
        ],
        beginButton: new Button({
          text: 'Reject',
          type: 'Reject',
          press: function () {
            const value = reason.getValue().trim();
            if (!value) {
              reason.setValueState('Error');
              reason.setValueStateText('Enter a reason for rejection.');
              return;
            }
            dialog.close();
            app.decidePO(draft.id, 'rejected', value);
          },
        }),
        endButton: new Button({
          text: 'Cancel',
          press: function () {
            dialog.close();
          },
        }),
        afterClose: function () {
          dialog.destroy();
        },
      });
      dialog.open();
    }
    function create(app) {
      const drafts = app.state.draftPOs || [];
      const audit = app.state.audit || [];
      const pending = drafts.filter(function (draft) {
        return draft.status === 'pending';
      });
      const approved = drafts.filter(function (draft) {
        return draft.status === 'approved';
      });
      const rejected = drafts.filter(function (draft) {
        return draft.status === 'rejected';
      });
      const items = [
        ui.header(
          '04 / APPROVE',
          'A response, with accountability.',
          'Review the draft, authorize the decision, and preserve who changed what and when.',
          [
            ui.button(
              'Refresh inbox',
              function () {
                app.run(async function () {
                  await app.refresh();
                  app.render();
                });
              },
              false,
              'sap-icon://refresh',
            ),
          ],
        ),
        new HBox({
          items: [
            ui.stat(
              'PENDING APPROVAL',
              String(pending.length),
              'Buyer authorization required',
              !!pending.length,
            ),
            ui.stat('APPROVED', String(approved.length), 'Mock adapter outcomes recorded'),
            ui.stat('REJECTED', String(rejected.length), 'No purchase committed'),
            ui.stat('AUDIT EVENTS', String(audit.length), 'Tenant-scoped decision history'),
          ],
          wrap: 'Wrap',
        }).addStyleClass('stStatsRow'),
      ];
      if (!drafts.length) {
        items.push(
          ui.section(
            'Purchase order inbox',
            'Illustrative workflow · no live purchasing commitment',
            ui.empty(
              'Your inbox is clear.',
              'Draft a PO from a ranked CapacityMesh match. It will appear here for an authorized human decision.',
              ui.button(
                'Open CapacityMesh',
                function () {
                  app.navigate('capacitymesh');
                },
                true,
              ),
            ),
          ),
        );
      } else {
        const cards = drafts
          .slice()
          .reverse()
          .map(function (draft) {
            const isPending = draft.status === 'pending';
            const state =
              draft.status === 'approved'
                ? 'Success'
                : draft.status === 'rejected' || draft.status === 'integrationError'
                  ? 'Error'
                  : 'Warning';
            const actions = [];
            if (isPending) {
              actions.push(
                ui.button(
                  'Approve',
                  function () {
                    app.decidePO(draft.id, 'approved');
                  },
                  true,
                  'sap-icon://accept',
                ),
              );
              actions.push(
                ui.button(
                  'Reject',
                  function () {
                    reject(app, draft);
                  },
                  false,
                  'sap-icon://decline',
                ),
              );
            }
            const facts = [
              ['CAPACITY RESPONSE', draft.capacityType || 'Moulding'],
              [
                'QUANTITY',
                draft.quantity == null
                  ? 'See matched requirement'
                  : ui.number(draft.quantity) + ' units',
              ],
              ['MODE', draft.mode || 'mock'],
              ['SOURCE SCENARIO', draft.scenarioId || '—'],
              ['EXTERNAL REFERENCE', draft.externalId || 'Pending adapter reference'],
              ['CREATED BY', draft.createdBy || 'Priya'],
            ];
            const when = draft.decidedAt || draft.createdAt;
            return new VBox({
              items: [
                new HBox({
                  items: [
                    ui.grow(
                      new VBox({
                        items: [
                          ui.text('DRAFT PURCHASE ORDER', 'stEyebrow'),
                          new Title({
                            text: draft.externalId || draft.id,
                            level: 'H3',
                            wrapping: true,
                          }).addStyleClass('stDraftTitle'),
                        ],
                      }),
                    ),
                    ui.status(draft.status.charAt(0).toUpperCase() + draft.status.slice(1), state),
                  ],
                  alignItems: 'Center',
                  wrap: 'Wrap',
                }),
                ui.html(
                  '<div class="stDraftFacts">' +
                    facts
                      .map(function (entry) {
                        return (
                          '<div><small>' +
                          ui.escape(entry[0]) +
                          '</small><strong>' +
                          ui.escape(entry[1]) +
                          '</strong></div>'
                        );
                      })
                      .join('') +
                    '</div>',
                ),
                ui.text(
                  isPending
                    ? 'This draft has not been committed. Verify qualification and scenario assumptions before approval.'
                    : draft.status === 'approved'
                      ? 'Approved in the local mock workflow. This is an Illustrative decision, not a live SAP purchase.'
                      : draft.status === 'rejected'
                        ? 'Rejected. No purchase was committed.'
                        : 'The downstream integration needs attention. No successful outcome is assumed.',
                  'stExplanation',
                ),
                new HBox({
                  items: [
                    new HBox({ items: actions, wrap: 'Wrap' }).addStyleClass('stDraftActions'),
                    ui.text(
                      when
                        ? 'UTC · ' +
                            new Date(when).toISOString().replace('T', ' ').replace('.000Z', 'Z')
                        : '',
                      'stSmallNote',
                    ),
                  ],
                  justifyContent: 'SpaceBetween',
                  alignItems: 'Center',
                  wrap: 'Wrap',
                }),
              ],
            }).addStyleClass('stDraftCard');
          });
        items.push(
          ui.section(
            'Purchase order inbox',
            'An agent drafts. An authorized human decides.',
            new VBox({ items: cards }),
          ),
        );
      }
      const events = audit.slice().sort(function (a, b) {
        return String(b.timestamp || b.createdAt || '').localeCompare(
          String(a.timestamp || a.createdAt || ''),
        );
      });
      const timeline = events.length
        ? new VBox({
            items: events.map(function (event) {
              const timestamp = event.timestamp || event.createdAt;
              const label = String(event.action || 'EVENT').replace(/_/g, ' ');
              return new HBox({
                items: [
                  ui.html('<span class="stAuditDot" aria-hidden="true"></span>'),
                  ui.grow(
                    new VBox({
                      items: [
                        ui.text(label, 'stAuditAction'),
                        ui.text(
                          (event.actor || 'User') +
                            ' · ' +
                            (event.entityId || '') +
                            (event.before || event.after
                              ? ' · ' + auditValue(event.before) + ' → ' + auditValue(event.after)
                              : ''),
                          'stMuted',
                        ),
                        ui.text(
                          event.correlationId ? 'Reference: ' + event.correlationId : '',
                          'stAuditReference',
                        ),
                      ],
                    }),
                  ),
                  ui.text(
                    timestamp
                      ? new Date(timestamp).toLocaleString('en-GB', {
                          timeZone: 'UTC',
                          hour12: false,
                        }) + ' UTC'
                      : '',
                    'stAuditTime',
                  ),
                ],
                alignItems: 'Start',
                wrap: 'Wrap',
              }).addStyleClass('stAuditRow');
            }),
          })
        : ui.empty(
            'Decisions leave a trace.',
            'Link reviews, draft creation and approval transitions will appear here with actor, time and correlation reference.',
          );
      items.push(
        ui.section(
          'Audit trail',
          'Append-only through the application API · Illustrative tenant',
          timeline,
        ),
      );
      items.push(
        new MessageStrip({
          text: 'Local development identity and mock ERP workflow. Production uses XSUAA authorization and configured SAP approval/ERP bindings; live integration remains [VERIFY].',
          type: 'Information',
          showIcon: true,
        }),
      );
      return new VBox({ items: items });
    }
    return { create: create };
  },
);

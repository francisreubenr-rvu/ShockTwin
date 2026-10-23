sap.ui.define(
  [
    'sap/m/VBox',
    'sap/m/HBox',
    'sap/m/OverflowToolbar',
    'sap/m/ToolbarSpacer',
    'sap/m/Button',
    'sap/m/Text',
    'sap/m/Avatar',
    'sap/m/ObjectStatus',
    'sap/m/ScrollContainer',
    'sap/m/MessageStrip',
    'sap/m/MessageBox',
    'sap/m/MessageToast',
    'sap/ui/core/HTML',
    'sap/m/FlexItemData',
    'shocktwin/lib/api',
    'shocktwin/lib/ui',
    'shocktwin/risk-map/View',
    'shocktwin/simulator/View',
    'shocktwin/capacitymesh/View',
    'shocktwin/approvals/View',
  ],
  function (
    VBox,
    HBox,
    OverflowToolbar,
    ToolbarSpacer,
    Button,
    Text,
    Avatar,
    ObjectStatus,
    ScrollContainer,
    MessageStrip,
    MessageBox,
    MessageToast,
    HTML,
    FlexItemData,
    api,
    ui,
    RiskMap,
    Simulator,
    CapacityMesh,
    Approvals,
  ) {
    'use strict';
    const pages = {
      'risk-map': RiskMap,
      simulator: Simulator,
      capacitymesh: CapacityMesh,
      approvals: Approvals,
    };
    const nav = [
      { id: 'risk-map', label: 'Risk map', icon: 'sap-icon://chain-link', step: '01' },
      { id: 'simulator', label: 'Simulator', icon: 'sap-icon://line-chart', step: '02' },
      { id: 'capacitymesh', label: 'CapacityMesh', icon: 'sap-icon://connected', step: '03' },
      { id: 'approvals', label: 'Approvals', icon: 'sap-icon://approvals', step: '04' },
    ];
    function Workspace() {
      this.state = {
        meta: {},
        nodes: [],
        links: [],
        signals: [],
        inventory: [],
        orders: [],
        scenarios: [],
        draftPOs: [],
        audit: [],
      };
      this.matches = [];
      this.scenario = null;
      this.listings = [];
      this.route = this.getRoute();
      this.api = api;
      this.ui = ui;
      this.toast = MessageToast.show;
      this.buttons = {};
      this.sidebar = this.createSidebar();
      this.content = new VBox({ width: '100%' }).addStyleClass('stPageContent');
      this.scroll = new ScrollContainer({
        width: '100%',
        height: '100%',
        vertical: true,
        horizontal: false,
        content: [this.content],
      }).addStyleClass('stScroll');
      this.scroll.setLayoutData(
        new FlexItemData({ growFactor: 1, shrinkFactor: 1, baseSize: '0%', minWidth: '0px' }),
      );
      this.userLabel = new Text({ text: 'Priya · Procurement head' }).addStyleClass(
        'stPersonaName',
      );
      this.modeLabel = new Text({ text: 'LOCAL WORKSPACE' }).addStyleClass('stPersonaRole');
      this.header = new OverflowToolbar({
        content: [
          new Button({
            icon: 'sap-icon://menu2',
            tooltip: 'Toggle workspace navigation',
            type: 'Transparent',
            press: this.toggleSidebar.bind(this),
          }).addStyleClass('stMenuButton'),
          new HTML({
            content:
              '<div class="stBrand"><span class="stBrandMark" aria-hidden="true"></span><span>SHOCKTWIN</span><span class="stBrandDivider"></span><span class="stBrandSub">Resilience workspace</span></div>',
          }),
          new ToolbarSpacer(),
          new ObjectStatus({
            text: 'Illustrative',
            state: 'Warning',
            icon: 'sap-icon://information',
          }).addStyleClass('stIllustrativeBadge'),
          new VBox({ items: [this.userLabel, this.modeLabel] }).addStyleClass('stPersona'),
          new Avatar({
            initials: 'PR',
            displaySize: 'XS',
            tooltip: 'Priya, procurement head — development identity',
          }).addStyleClass('stAvatar'),
        ],
      }).addStyleClass('stTopBar');
      this.main = new HBox({
        height: '100%',
        width: '100%',
        items: [this.sidebar, this.scroll],
      }).addStyleClass('stWorkspaceBody');
      this.main.setLayoutData(new FlexItemData({ growFactor: 1, shrinkFactor: 1, baseSize: '0%' }));
      this.control = new VBox({
        height: '100%',
        fitContainer: true,
        items: [this.header, this.main],
      }).addStyleClass('stApplication');
      this.hashHandler = function () {
        this.route = this.getRoute();
        this.render();
      }.bind(this);
      window.addEventListener('hashchange', this.hashHandler);
      this.renderLoading();
      this.run(
        async function () {
          await this.refresh();
          this.render();
        }.bind(this),
      );
    }
    Workspace.prototype.getRoute = function () {
      const route = window.location.hash.replace(/^#\/?/, '').split('?')[0];
      return pages[route] ? route : 'risk-map';
    };
    Workspace.prototype.createSidebar = function () {
      const sidebar = new VBox({ width: '232px', height: '100%' }).addStyleClass('stSidebar');
      sidebar.addItem(ui.text('SUPPLY RESILIENCE', 'stNavEyebrow'));
      nav.forEach(
        function (item) {
          const button = new Button({
            text: item.label,
            icon: item.icon,
            type: 'Transparent',
            width: '100%',
            press: function () {
              this.navigate(item.id);
            }.bind(this),
          }).addStyleClass('stNavButton');
          this.buttons[item.id] = button;
          sidebar.addItem(button);
        }.bind(this),
      );
      sidebar.addItem(
        new VBox({
          items: [
            ui.text('YOUR RESPONSE LOOP', 'stNavEyebrow'),
            ui.html(
              '<div class="stLoop"><div><span>01</span><strong>Detect</strong><small>Reveal upstream exposure</small></div><div><span>02</span><strong>Simulate</strong><small>Rehearse the disruption</small></div><div><span>03</span><strong>Respond</strong><small>Approve an alternative</small></div></div>',
            ),
          ],
        }).addStyleClass('stSidebarLoop'),
      );
      const spacer = new VBox();
      spacer.setLayoutData(new FlexItemData({ growFactor: 1 }));
      sidebar.addItem(spacer);
      sidebar.addItem(
        new VBox({
          items: [
            ui.status('Illustrative demo', 'Warning'),
            ui.text('SAP HackFest 2026', 'stSidebarEvent'),
            ui.text('Resilient Supply Chains', 'stSidebarTrack'),
            ui.text('RV University · Bengaluru', 'stSidebarTrack'),
          ],
        }).addStyleClass('stSidebarFooter'),
      );
      return sidebar;
    };
    Workspace.prototype.toggleSidebar = function () {
      if (window.innerWidth <= 650) this.sidebar.toggleStyleClass('stMobileNavOpen');
      else this.sidebar.setVisible(!this.sidebar.getVisible());
    };
    Workspace.prototype.navigate = function (route) {
      this.sidebar.removeStyleClass('stMobileNavOpen');
      if (window.location.hash === '#' + route) {
        this.route = route;
        this.render();
      } else window.location.hash = route;
      this.scroll.scrollTo(0, 0, 0);
    };
    Workspace.prototype.renderLoading = function () {
      this.content.removeAllItems().forEach(function (item) {
        item.destroy();
      });
      this.content.addItem(
        ui.empty(
          'Connecting your workspace',
          'Loading the Illustrative supplier network and workflow state.',
        ),
      );
    };
    Workspace.prototype.refresh = async function () {
      this.state = await api.get('/api/state');
      this.state.nodes = this.state.nodes || [];
      this.state.links = this.state.links || [];
      this.state.inventory = this.state.inventory || [];
      this.state.scenarios = this.state.scenarios || [];
      this.state.draftPOs = this.state.draftPOs || [];
      this.state.audit = this.state.audit || [];
      this.state.signals = this.state.signals || [];
      const user = (this.state.meta || {}).user || {};
      const name = user.name || user.id || 'Authenticated user';
      this.userLabel.setText(name === 'Priya' ? 'Priya · Procurement head' : name);
      const roles = Array.isArray(user.roles) ? user.roles.join(' / ') : '';
      this.modeLabel.setText(
        (this.state.meta.mode || 'local').toUpperCase() +
          (roles ? ' · ' + roles.toUpperCase() : ''),
      );
      const saved = this.state.scenarios[this.state.scenarios.length - 1];
      if (!this.scenario && saved) this.scenario = saved;
      return this.state;
    };
    Workspace.prototype.render = function () {
      Object.keys(this.buttons).forEach(
        function (id) {
          this.buttons[id].toggleStyleClass('stNavActive', id === this.route);
        }.bind(this),
      );
      this.content.removeAllItems().forEach(function (item) {
        item.destroy();
      });
      this.content.addItem(pages[this.route].create(this));
      this.content.addItem(
        ui.text(
          'Illustrative company, supplier, inventory, capacity and scenario data. The GNN is trained on synthetic data; confidence is an uncalibrated model score.',
          'stDisclosure',
        ),
      );
    };
    Workspace.prototype.run = async function (operation) {
      this.content.setBusyIndicatorDelay(0);
      this.content.setBusy(true);
      try {
        return await operation();
      } catch (error) {
        const detail = error.correlationId ? ' Reference: ' + error.correlationId : '';
        MessageBox.error(error.message + detail, {
          title: 'Action could not be completed',
          details: 'Your last saved workspace is retained. Check /health and retry the action.',
        });
        if (!this.state.company) {
          this.content.removeAllItems().forEach(function (item) {
            item.destroy();
          });
          this.content.addItem(
            new MessageStrip({
              text: 'The workspace service is unavailable. Start all local services and retry.',
              type: 'Error',
              showIcon: true,
            }),
          );
          this.content.addItem(
            ui.button(
              'Retry connection',
              function () {
                this.run(
                  async function () {
                    await this.refresh();
                    this.render();
                  }.bind(this),
                );
              }.bind(this),
              true,
            ),
          );
        }
        return null;
      } finally {
        this.content.setBusy(false);
      }
    };
    Workspace.prototype.detect = function () {
      return this.run(
        async function () {
          const result = await api.post('/api/risk/infer', {});
          this.inference = result;
          await this.refresh();
          this.render();
          MessageToast.show(
            (result.links || []).length + ' inferred relationships returned for human review.',
          );
        }.bind(this),
      );
    };
    Workspace.prototype.decideLink = function (id, decision) {
      return this.run(
        async function () {
          await api.post('/api/risk/links/' + encodeURIComponent(id) + '/decision', {
            decision: decision,
          });
          await this.refresh();
          this.render();
          MessageToast.show(
            decision === 'confirmed'
              ? 'Link confirmed. Review recorded in the audit trail.'
              : 'Link rejected. It is excluded from simulation.',
          );
        }.bind(this),
      );
    };
    Workspace.prototype.simulate = function (input) {
      return this.run(
        async function () {
          this.scenario = await api.post('/api/simulations', input);
          await this.refresh();
          this.render();
          MessageToast.show('Illustrative scenario calculated and saved.');
        }.bind(this),
      );
    };
    Workspace.prototype.findCapacity = function (input) {
      return this.run(
        async function () {
          const result = await api.post('/api/mesh/matches', input);
          this.matches = result.matches || [];
          this.matchResult = result;
          this.matchRequest = input;
          const listingResult = await api.get('/api/mesh/listings');
          this.listings = listingResult.listings || [];
          this.render();
          MessageToast.show(this.matches.length + ' eligible capacity matches.');
        }.bind(this),
      );
    };
    Workspace.prototype.draftPO = function (match) {
      return this.run(
        async function () {
          const scenarioId = this.scenario && this.scenario.id;
          if (!scenarioId) throw new Error('Run a scenario before drafting a response.');
          const result = await api.post('/api/pos', {
            matchId: match.id,
            scenarioId: scenarioId,
            idempotencyKey: 'ui-' + scenarioId + '-' + match.id,
          });
          this.lastDraft = result.draft || result.draftPO || result;
          await this.refresh();
          this.navigate('approvals');
          if (this.lastDraft.status === 'integrationError')
            throw new Error(
              'The draft adapter needs attention. Review its integration error before retrying; no successful purchase is assumed.',
            );
          MessageToast.show('Draft PO created. An authorized human must approve it.');
        }.bind(this),
      );
    };
    Workspace.prototype.decidePO = function (id, decision, reason) {
      return this.run(
        async function () {
          const result = await api.post('/api/pos/' + encodeURIComponent(id) + '/decision', {
            decision: decision,
            reason: reason || '',
          });
          await this.refresh();
          this.render();
          const outcome = result.draft || result.draftPO || result;
          if (outcome.status && outcome.status !== decision)
            throw new Error(
              (outcome.error && outcome.error.message) ||
                outcome.integrationError ||
                'The downstream integration did not confirm the requested decision. Review the recorded error and reconcile before retrying.',
            );
          MessageToast.show(
            decision === 'approved'
              ? 'Mock PO approved. Decision and adapter outcome recorded.'
              : 'Draft rejected. No purchase committed.',
          );
        }.bind(this),
      );
    };
    Workspace.prototype.destroy = function () {
      window.removeEventListener('hashchange', this.hashHandler);
    };
    return Workspace;
  },
);

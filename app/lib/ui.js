sap.ui.define(
  [
    'sap/m/VBox',
    'sap/m/HBox',
    'sap/m/Text',
    'sap/m/Title',
    'sap/m/Button',
    'sap/m/ObjectStatus',
    'sap/ui/core/HTML',
    'sap/m/FlexItemData',
    'sap/m/Label',
  ],
  function (VBox, HBox, Text, Title, Button, ObjectStatus, HTML, FlexItemData, Label) {
    'use strict';
    function text(value, className) {
      const control = new Text({ text: String(value == null ? '' : value), wrapping: true });
      if (className) control.addStyleClass(className);
      return control;
    }
    function html(value, className) {
      const control = new HTML({ content: value, sanitizeContent: false });
      if (className) control.addStyleClass(className);
      return control;
    }
    function escape(value) {
      return String(value == null ? '' : value).replace(/[&<>"']/g, function (char) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char];
      });
    }
    function grow(control, factor) {
      control.setLayoutData(
        new FlexItemData({ growFactor: factor || 1, shrinkFactor: 1, baseSize: '0%' }),
      );
      return control;
    }
    function stat(label, value, detail, accent) {
      return grow(
        new VBox({
          items: [
            text(label, 'stStatLabel'),
            text(value, 'stStatValue' + (accent ? ' stAmberText' : '')),
            text(detail, 'stStatDetail'),
          ],
        }).addStyleClass('stStat'),
      );
    }
    function header(eyebrow, title, subtitle, actions) {
      const copy = grow(
        new VBox({
          items: [
            text(eyebrow, 'stEyebrow'),
            new Title({ text: title, level: 'H1', wrapping: true }).addStyleClass('stPageTitle'),
            text(subtitle, 'stPageSubtitle'),
          ],
        }),
      );
      const items = [copy];
      if (actions)
        items.push(
          new HBox({ items: actions, alignItems: 'Center', wrap: 'Wrap' }).addStyleClass(
            'stHeaderActions',
          ),
        );
      return new HBox({
        items: items,
        alignItems: 'Center',
        justifyContent: 'SpaceBetween',
        wrap: 'Wrap',
      }).addStyleClass('stPageHeader');
    }
    function section(title, subtitle, content, toolbar) {
      const heading = new HBox({
        items: [
          grow(
            new VBox({
              items: [
                new Title({ text: title, level: 'H2', wrapping: true }).addStyleClass(
                  'stSectionTitle',
                ),
                text(subtitle || '', 'stMuted'),
              ],
            }),
          ),
          ...(toolbar || []),
        ],
        alignItems: 'Center',
        justifyContent: 'SpaceBetween',
        wrap: 'Wrap',
      }).addStyleClass('stSectionHeading');
      return new VBox({ items: [heading, content] }).addStyleClass('stCard');
    }
    function status(label, state) {
      return new ObjectStatus({ text: label, state: state || 'None' }).addStyleClass('stStatus');
    }
    function button(label, handler, emphasized, icon) {
      return new Button({
        text: label,
        type: emphasized ? 'Emphasized' : 'Default',
        icon: icon || undefined,
        press: handler,
      });
    }
    function field(label, control) {
      return new VBox({
        items: [new Label({ text: label, labelFor: control }), control],
      }).addStyleClass('stField');
    }
    function number(value, maximumFractionDigits) {
      return new Intl.NumberFormat('en-IN', {
        maximumFractionDigits: maximumFractionDigits == null ? 0 : maximumFractionDigits,
      }).format(Number(value) || 0);
    }
    function money(value, currency) {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: currency || 'INR',
        maximumFractionDigits: 0,
      }).format(Number(value) || 0);
    }
    function percent(value) {
      const n = Number(value) || 0;
      return number(n <= 1 ? n * 100 : n, 1) + '%';
    }
    function empty(title, detail, action) {
      return new VBox({
        alignItems: 'Center',
        items: [text(title, 'stEmptyTitle'), text(detail, 'stMuted'), ...(action ? [action] : [])],
      }).addStyleClass('stEmpty');
    }
    return {
      text: text,
      html: html,
      escape: escape,
      grow: grow,
      stat: stat,
      header: header,
      section: section,
      status: status,
      button: button,
      field: field,
      number: number,
      money: money,
      percent: percent,
      empty: empty,
    };
  },
);

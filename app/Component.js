sap.ui.define(['sap/ui/core/UIComponent', 'shocktwin/App'], function (UIComponent, Workspace) {
  'use strict';
  return UIComponent.extend('shocktwin.Component', {
    metadata: { manifest: 'json' },
    createContent: function () {
      this.workspace = new Workspace();
      return this.workspace.control;
    },
    destroy: function () {
      if (this.workspace) this.workspace.destroy();
      UIComponent.prototype.destroy.apply(this, arguments);
    },
  });
});

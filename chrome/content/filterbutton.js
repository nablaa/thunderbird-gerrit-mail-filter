var GerritFilter = {
  onLoad: function() {
    this.consoleService = Components.classes["@mozilla.org/consoleservice;1"]
                          .getService(Components.interfaces.nsIConsoleService);

    this.consoleService.logStringMessage("GerritFilter addon loaded");
  },

  onToolbarButtonCommand: function(e) {
    this.consoleService.logStringMessage("Button clicked: " + e);
  }
};

window.addEventListener("load", function(e) { GerritFilter.onLoad(e); }, false);

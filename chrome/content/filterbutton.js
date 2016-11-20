var Cc = Components.classes;
var Ci = Components.interfaces;

var GerritFilter = {
  onLoad: function() {
    this.consoleService = Cc["@mozilla.org/consoleservice;1"]
                          .getService(Ci.nsIConsoleService);

    this.prefs = Cc['@mozilla.org/preferences-service;1']
                 .getService(Ci.nsIPrefService).getBranch("extensions.gerritfilter.");

    this.consoleService.logStringMessage("GerritFilter addon loaded");
  },

  onToolbarButtonCommand: function() {
    var folders = this.getFoldersToFilter();
    this.consoleService.logStringMessage("Folders to filter: " + folders);
  },

  getPreferencesFolderList: function() {
    var folders_comma_separated = this.prefs.getCharPref("folders");
    return folders_comma_separated.split(",");
  },

  getFoldersToFilter: function() {
    var acctMgr = Cc["@mozilla.org/messenger/account-manager;1"]
                  .getService(Ci.nsIMsgAccountManager);
    var accounts = acctMgr.accounts;
    var preferences_folders = this.getPreferencesFolderList();
    var folders = [];

    for (var i = 0; i < accounts.length; i++) {
      var account = accounts.queryElementAt(i, Ci.nsIMsgAccount);
      var rootFolder = account.incomingServer.rootFolder; // nsIMsgFolder
      //this.consoleService.logStringMessage("root folder: " + rootFolder.prettiestName);
      if (rootFolder.hasSubFolders) {
        var subFolders = rootFolder.subFolders; // nsIMsgFolder
        while(subFolders.hasMoreElements()) {
          var folder = subFolders.getNext().QueryInterface(Ci.nsIMsgFolder);
          //this.consoleService.logStringMessage("subfolder: " + folder.prettiestName);
          if (preferences_folders.indexOf(folder.prettiestName) >= 0) {
            folders.push(folder);
          }
        }
      }
    }

    return folders;
  }
};

window.addEventListener("load", function(e) { GerritFilter.onLoad(e); }, false);

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

    for (var index in folders) {
      this.filterFolderMessages(folders[index]);
    }
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
  },

  filterFolderMessages: function(folder) {
    this.consoleService.logStringMessage("Filtering folder: " + folder.prettiestName);

    var message_iterator = folder.messages;
    while (message_iterator.hasMoreElements()) {
      var message = message_iterator.getNext().QueryInterface(Ci.nsIMsgDBHdr);
      if (message.isRead) {
        continue;
      }

      this.consoleService.logStringMessage("iterating message: " + message.subject);
      var body = this.getMessageBodyText(message);
      this.consoleService.logStringMessage("body: " + body);
    }

  },

  getMessageBodyText: function(message) {
    var messenger = Cc["@mozilla.org/messenger;1"].createInstance(Ci.nsIMessenger);
    var listener = Cc["@mozilla.org/network/sync-stream-listener;1"].createInstance(Ci.nsISyncStreamListener);
    var folder = message.folder;
    var uri = folder.getUriForMsg(message);
    messenger.messageServiceFromURI(uri).streamMessage(uri, listener, null, null, false, "");
    return folder.getMsgTextFromStream(listener.inputStream, message.Charset, 65536, 32768, false, false, {});
  }
};

window.addEventListener("load", function(e) { GerritFilter.onLoad(e); }, false);

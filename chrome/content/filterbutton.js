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
    this.expected_author = this.prefs.getCharPref("from_address");
    this.labels = this.getPreferencesLabelList();
    this.users = this.getPreferencesUserList();
    var folders = this.getFoldersToFilter();

    for (var index in folders) {
      this.filterFolderMessages(folders[index]);
    }
  },

  getPreferencesFolderList: function() {
    var folders_comma_separated = this.prefs.getCharPref("folders");
    return folders_comma_separated.split(",");
  },

  getPreferencesLabelList: function() {
    var labels_comma_separated = this.prefs.getCharPref("labels");
    return labels_comma_separated.split(",");
  },

  getPreferencesUserList: function() {
    var users_comma_separated = this.prefs.getCharPref("gerrit_users");
    return users_comma_separated.split(",");
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
    var messages_to_delete = Cc["@mozilla.org/array;1"].createInstance(Ci.nsIMutableArray);

    var message_iterator = folder.messages;
    while (message_iterator.hasMoreElements()) {
      var message = message_iterator.getNext().QueryInterface(Ci.nsIMsgDBHdr);
      if (message.isRead) {
        // consider only unread messages
        continue;
      }

      this.consoleService.logStringMessage("iterating message: " + message.subject);
      var body = this.getMessageBodyText(message);
      this.consoleService.logStringMessage("body: " + body);

      if (this.shouldMessageBeDeleted(message, body)) {
        this.consoleService.logStringMessage("Message will be removed: " + message.subject);
        messages_to_delete.appendElement(message, false);
        message.markRead(true);
      }
    }

    if (messages_to_delete.length) {
      this.consoleService.logStringMessage("Deleting " + messages_to_delete.length + " messages");
      folder.deleteMessages(messages_to_delete, msgWindow, false, false, null, true);
    } else {
      this.consoleService.logStringMessage("Not deleting messages");
    }
  },

  getMessageBodyText: function(message) {
    var messenger = Cc["@mozilla.org/messenger;1"].createInstance(Ci.nsIMessenger);
    var listener = Cc["@mozilla.org/network/sync-stream-listener;1"].createInstance(Ci.nsISyncStreamListener);
    var folder = message.folder;
    var uri = folder.getUriForMsg(message);
    messenger.messageServiceFromURI(uri).streamMessage(uri, listener, null, null, false, "");
    return folder.getMsgTextFromStream(listener.inputStream, message.Charset, 65536, 32768, false, false, {});
  },

  shouldMessageBeDeleted: function(message, body) {
    return this.messageHasMatchingAuthor(message) && this.messageHasMatchingBodyText(body);
  },

  messageHasMatchingAuthor: function(message) {
    return message.author.indexOf(this.expected_author) != -1;
  },

  messageHasMatchingBodyText: function(body) {
    if (!this.userInBody(body)) {
      return false;
    }

    if (!this.patchSetLabelLineInBody(body)) {
      return false;
    }

    return true;
  },

  userInBody: function(body) {
    for (var index in this.users) {
      var user = this.users[index];

      if (body.indexOf("From " + user) != -1 &&
          body.indexOf(user + " has posted comments on this change.") != -1) {
        return true;
      }
    }

    return false;
  },

  patchSetLabelLineInBody: function(body) {
    var escape_pattern = function(str) {
      return str.replace(/([.?*+^$[\]\\(){}|-])/g, "\\$1");
    };

    for (var index in this.labels) {
      var label = this.labels[index];
      var re = new RegExp("Patch Set \\d+: " + escape_pattern(label), "g");
      if (body.match(re)) {
        return true;
      }
    }

    return false;
  }

};

window.addEventListener("load", function(e) { GerritFilter.onLoad(e); }, false);

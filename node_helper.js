var NodeHelper = require("node_helper");
var request = require("request");

module.exports = NodeHelper.create({
  device_code: undefined,
  secret: undefined,
  oauth: undefined,

  start: function () {
    console.log("MMM-GoogleFit helper started...");
  },

  getAuthCode: function() {
    var self = this;

    var url = "https://accounts.google.com/o/oauth2/device/code";
    var clientId = "846766038767-8fs63le8h45dhjpf0umhc1ai07q4rhn7.apps.googleusercontent.com";
    var scopes = "email profile";

    request.post(url, { form: { client_id: clientId, scope: scopes } }, function(error, response, body) {
      if (!error && response.statusCode == 200) {
        var data = JSON.parse(body);
        self.device_code = data.device_code;
        self.secret = data.client_secret;

        self.sendSocketNotification("AUTH_BODY", data);
        return;
      } else {
        self.sendSocketNotification("AUTH_ERROR", error);
      }
    });
  },

  getOAuth: function () {
    var self = this;

    self.oauth = true;

    var url = "https://www.googleapis.com/oauth2/v4/token";
    var clientId = "846766038767-8fs63le8h45dhjpf0umhc1ai07q4rhn7.apps.googleusercontent.com";
    var clientSecret = "kbJlTr7uQPCiClb5JSrGE-Ve";
    var grantType = "http://oauth.net/grant_type/device/1.0";

    request.post(url, { form: { client_id: clientId, client_secret: clientSecret, code: self.device_code, grant_type: grantType } }, function (error, response, body) {
      if (!error && response.statusCode == 200) {
        self.sendSocketNotification("OAUTH_BODY", JSON.parse(body));
      } else {
        self.sendSocketNotification("OAUTH_ERROR", error);
        self.sendSocketNotification("OAUTH_ERROR", response);
        self.sendSocketNotification("OAUTH_ERROR", body);

        setTimeout(function() { self.getOAuth() }, 10000);
      }
    });
  },

  getStats: function (url) {
    var self = this;

    request({ url: url, method: "GET" }, function (error, response, body) {
      if (!error && response.statusCode == 200) {
        var result = JSON.parse(body);
        self.sendSocketNotification("STATS_RESULT", result);
      }
    });

  },

  //Subclass socketNotificationReceived received.
  socketNotificationReceived: function(notification, payload) {
    if (notification === "GET_STATS") {
      this.getStats(payload);
    } else if (notification === "GET_AUTH") {
      if (!this.oauth) {
        if (this.device_code) {
          this.getOAuth();
        } else {
          this.getAuthCode();
        }
      }
    }
  }

});

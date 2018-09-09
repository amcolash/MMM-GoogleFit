const NodeHelper = require("node_helper");
const request = require("request");
const jsonfile = require("./lib/jsonfile.js");
const path = require("path");
const dataFile = path.resolve(__dirname, "data.json");
const debugData = require("./debug_data.js");

module.exports = NodeHelper.create({

  client_id: "846766038767-8fs63le8h45dhjpf0umhc1ai07q4rhn7.apps.googleusercontent.com",
  client_secret: "kbJlTr7uQPCiClb5JSrGE-Ve",
  config: {
    //refresh_token
  },

  debug: false,
  useDebugData: false,

  tmpAuthData: undefined,
  tmpAccessToken: undefined,

  start: function () {
    console.log("MMM-GoogleFit helper started...");

    if (this.debug) {
      console.log(process.versions);
    }

    try {
      var c = jsonfile.readFileSync(dataFile);
      if (c.refresh_token) {
        this.config = c;
      }
    } catch (error) {
      // Probably have not yet written the file, no worries
    }
  },

  getAuthCode: function() {
    var self = this;

    var url = "https://accounts.google.com/o/oauth2/device/code";
    var scopes = "email profile https://www.googleapis.com/auth/fitness.activity.read https://www.googleapis.com/auth/fitness.body.read";

    request.post(url, { form: { client_id: self.client_id, scope: scopes } }, function(error, response, body) {
      if (!error && response.statusCode == 200) {
        var data = JSON.parse(body);
        self.tmpAuthData = data;

        self.sendSocketNotification("AUTH_CODE_BODY", data);
        self.getRefreshToken();
      } else {
        self.sendSocketNotification("AUTH_CODE_ERROR", response);
      }

      self.logRequest("getAuthCode", error, response, body);
    });
  },

  getRefreshToken: function () {
    var self = this;
    var url = "https://www.googleapis.com/oauth2/v4/token";
    var grant = "http://oauth.net/grant_type/device/1.0";

    request.post(url, { form: { client_id: self.client_id, client_secret: self.client_secret, code: self.tmpAuthData.device_code, grant_type: grant } }, function (error, response, body) {
      if (!error && response.statusCode == 200) {
        var data = JSON.parse(body);
        self.sendSocketNotification("REFRESH_TOKEN_BODY", data);

        self.config.refresh_token = data.refresh_token;
        self.writeConfig();

        self.getAccessToken();
      } else {
        if (self.debug) {
          console.error(response)
        }
        
        self.sendSocketNotification("REFRESH_TOKEN_ERROR", response);
        setTimeout(function() { self.getRefreshToken() }, 10000);
      }

      self.logRequest("getRefreshToken", error, response, body);
    });
  },

  getAccessToken: function(clientConfig) {
    var self = this;
    var url = "https://www.googleapis.com/oauth2/v4/token";
    var grant = "refresh_token";

    request.post(url, { form: { client_id: self.client_id, client_secret: self.client_secret, refresh_token: self.config.refresh_token, grant_type: grant } }, function (error, response, body) {
      if (!error && response.statusCode == 200) {
        var data = JSON.parse(body);
        self.sendSocketNotification("ACCESS_TOKEN_BODY", data);
        self.tmpAccessToken = data;

        self.getStats(clientConfig);
      } else {
        self.sendSocketNotification("ACCESS_TOKEN_ERROR", response);
      }

      self.logRequest("getAccessToken", error, response, body);
    });
  },

  logRequest: function(title, error, response, body) {
    if (this.debug) {
      console.log(title);
      console.log("---------------------------------------------------------------------------------------------");
      console.log("error");
      console.log(error);
      console.log("response");
      console.log(response);
      console.log("body");
      console.log(body);
    }
  },

  getStats: function (clientConfig) {
    var self = this;

    if (this.useDebugData) {
      self.sendSocketNotification("STATS", debugData);
      return;
    }

    var url = "https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate";

    var startTime = new Date();
    startTime.setDate(startTime.getDate() - startTime.getDay()); // get last sunday
    startTime.setHours(0, 0, 0, 0);

    if (clientConfig.startOnMonday) { // start on monday instead
      startTime.setDate(startTime.getDate() + 1);
    }

    if (clientConfig.lastSevenDays) {
      startTime.setDate(new Date().getDate() - 6);
    }

    var endTime = new Date(startTime); // end sets month of start (Issue #9)
    endTime.setDate(startTime.getDate() + 6);
    endTime.setHours(23, 59, 59, 999);

    var rotate = 0;
    if (clientConfig.lastSevenDays) {
      rotate = new Date().getDay() + 1;
    } else if (clientConfig.startOnMonday) {
      rotate = 1;
    }

    var days = ["S", "M", "T", "W", "T", "F", "S"];
    if (rotate != 0) {
      rotate %= days.length;
      days = days.slice(rotate, days.length).concat(days.slice(0, rotate));
    }

    var req = {
      "aggregateBy": [{
        "dataSourceId": "derived:com.google.step_count.delta:com.google.android.gms:estimated_steps"
      }],
      "bucketByTime": { "durationMillis": 86400000 }, // 1 day per bucket
      "startTimeMillis": startTime.getTime(),
      "endTimeMillis": endTime.getTime()
    };

    if (clientConfig.displayWeight) {
      req.aggregateBy.push({
        "dataSourceId": "derived:com.google.weight:com.google.android.gms:merge_weight"
      });
    }

    var options = {
      url: url,
      json: req,
      headers: {
        Authorization: "Bearer " + self.tmpAccessToken.access_token
      }
    }

    request.post(options, function (error, response, body) {
      if (!error && response.statusCode == 200) {
        // body is already json at this point
        body.days = days;
        self.sendSocketNotification("STATS", body);
      } else {
        self.sendSocketNotification("STATS_ERROR", error);
        self.sendSocketNotification("STATS_ERROR", response);
        self.sendSocketNotification("STATS_ERROR", body);
      }

      self.logRequest("getStats", error, response, body);
    });
  },

  writeConfig: function() {
    jsonfile.writeFileSync(dataFile, this.config, { spaces: 2 });
  },

  //Subclass socketNotificationReceived received.
  socketNotificationReceived: function(notification, payload) {
    if (notification === "UPDATE") {
      if (this.config.refresh_token) {
        this.sendSocketNotification("REFRESH_TOKEN_BODY", this.config.refresh_token);
        this.getAccessToken(payload); // This will get an access token and then get stats afterwards if successful (payload is if we want last monday/sunday)
      } else if (this.tmpAuthData) {
        // Just in case refreshing the page before auth complete
        this.sendSocketNotification("AUTH_CODE_BODY", this.tmpAuthData);

        this.getRefreshToken();
      } else {
        this.getAuthCode();
      }
    }
  }
});
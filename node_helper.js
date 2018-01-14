const NodeHelper = require("node_helper");
const request = require("request");
const jsonfile = require("jsonfile");
const path = require("path");
const dataFile = path.resolve(__dirname, "data.json");

module.exports = NodeHelper.create({

  client_id: "846766038767-8fs63le8h45dhjpf0umhc1ai07q4rhn7.apps.googleusercontent.com",
  client_secret: "kbJlTr7uQPCiClb5JSrGE-Ve",
  config: {
    //device_code,
    //refresh_token
  },

  tmpAuthData: undefined,
  tmpAccessToken: undefined,

  start: function () {
    console.log("MMM-GoogleFit helper started...");

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
        self.config.device_code = data.device_code;
        self.writeConfig();

        self.tmpAuthData = data;

        self.sendSocketNotification("AUTH_CODE_BODY", data);
        self.getRefreshToken();
      } else {
        self.sendSocketNotification("AUTH_CODE_ERROR", response);
      }
    });
  },

  getRefreshToken: function () {
    var self = this;
    var url = "https://www.googleapis.com/oauth2/v4/token";
    var grant = "http://oauth.net/grant_type/device/1.0";

    request.post(url, { form: { client_id: self.client_id, client_secret: self.client_secret, code: self.config.device_code, grant_type: grant } }, function (error, response, body) {
      if (!error && response.statusCode == 200) {
        var data = JSON.parse(body);
        self.sendSocketNotification("REFRESH_TOKEN_BODY", data);

        self.config.refresh_token = data.refresh_token;
        self.writeConfig();

        self.getAccessToken();
      } else {
        self.sendSocketNotification("REFRESH_TOKEN_ERROR", response);
        setTimeout(function() { self.getRefreshToken() }, 10000);
      }
    });
  },

  getAccessToken: function() {
    var self = this;
    var url = "https://www.googleapis.com/oauth2/v4/token";
    var grant = "refresh_token";

    request.post(url, { form: { client_id: self.client_id, client_secret: self.client_secret, refresh_token: self.config.refresh_token, grant_type: grant } }, function (error, response, body) {
      if (!error && response.statusCode == 200) {
        var data = JSON.parse(body);
        self.sendSocketNotification("ACCESS_TOKEN_BODY", data);
        self.tmpAccessToken = data;

        self.getStats();
      } else {
        self.sendSocketNotification("ACCESS_TOKEN_ERROR", response);
      }
    });
  },

  getStats: function (url) {
    var self = this;

    var url = "https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate";

    var startTime = new Date();
    startTime.setDate(startTime.getDate() - startTime.getDay()); // get last sunday
    startTime.setHours(0, 0, 0, 0);

    var endTime = new Date();
    endTime.setDate(startTime.getDate() + 6);
    endTime.setHours(23, 59, 59, 999);

    var req = {
      "aggregateBy": [
        {
          "dataTypeName": "com.google.step_count.delta",
          "dataSourceId": "derived:com.google.step_count.delta:com.google.android.gms:estimated_steps"
        },
        {
          "dataTypeName": "com.google.weight",
          "dataSourceId": "derived:com.google.weight:com.google.android.gms:merge_weight"
        }
      ],
      "bucketByTime": { "durationMillis": 86400000 }, // 1 day per bucket
      "startTimeMillis": startTime.getTime(),
      "endTimeMillis": endTime.getTime()
    };

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
        self.sendSocketNotification("STATS", body);
      } else {
        self.sendSocketNotification("STATS_ERROR", error);
        self.sendSocketNotification("STATS_ERROR", response);
        self.sendSocketNotification("STATS_ERROR", body);
      }
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
        this.getAccessToken(); // This will get an access token and then get stats afterwards if successful
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

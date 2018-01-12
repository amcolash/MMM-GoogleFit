"use strict";

Module.register("MMM-GoogleFit", {

  result: undefined,
  code: undefined,
  defaults: {
    updateInterval: 1200000 // 20 minutes
  },

  clientId: "846766038767-8fs63le8h45dhjpf0umhc1ai07q4rhn7.apps.googleusercontent.com",

  start: function() {
    this.getStats();
    this.scheduleUpdate();
  },

  getDom: function() {
    var wrapper = document.createElement("stats");
    wrapper.className = "dimmed small";

    var title =  document.createElement("header");
    title.innerHTML = "Google Fit";
    wrapper.appendChild(title);

    if (this.code) {
      var elem = document.createElement("span");
      elem.innerHTML = "Please Visit: " + this.code.verification_url + "<br>" + "Code: " + this.code.user_code;
      wrapper.appendChild(elem);
    } else if (this.result) {
      var elem = document.createElement("span");
      elem.innerHTML = "You are all authenticated";
      wrapper.appendChild(elem);
    } else {
      var error = document.createElement("span");
      error.innerHTML = "Error Getting Auth";
      wrapper.appendChild(error);
    }

    return wrapper;
  },

  scheduleUpdate: function(delay) {
    var nextLoad = this.config.updateInterval;
    if (typeof delay !== "undefined" && delay >= 0) {
      nextLoad = delay;
    }

    var self = this;
    setInterval(function() {
      self.getStats();
    }, nextLoad);
  },

  getStats: function () {
    // this.sendSocketNotification("GET_STATS", this.config.url);
    this.sendSocketNotification("GET_AUTH");
  },

  socketNotificationReceived: function(notification, result) {
    this.code = undefined;
    this.result = undefined;

    if (notification === "AUTH_BODY") {
      this.code = result;
      // this.scheduleUpdate(5000);
      this.getStats();
    } else if (notification === "OAUTH_BODY") {
      this.result = result;
    }

    console.log(notification);
    console.log(result);
    this.updateDom(500);
  },

});

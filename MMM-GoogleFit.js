"use strict";

Module.register("MMM-GoogleFit", {

  auth: undefined,
  code: undefined,
  defaults: {
    updateInterval: 1800000, // 30 minutes
    imperial: true
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

    if (this.stats) {
      for (var i = 0; i < this.stats.bucket.length; i++) {
        var bucket = this.stats.bucket[i];
        var elem = document.createElement("span");

        for (var j = 0; j < bucket.dataset.length; j++) {
          var data = bucket.dataset[j];

          var start = new Date(Number.parseFloat(bucket.startTimeMillis)).toLocaleDateString();
          var value = start;

          var weight = false;
          var steps = false;

          if (data.dataSourceId.indexOf("weight") != -1) {
            value += ", weight: ";
            weight = true;
          } else if (data.dataSourceId.indexOf("step_count") != -1) {
            value += ", steps: ";
            steps = true;
          }

          var total = 0;
          for (var k = 0; k < data.point.length; k++) {
            var point = data.point[k];

            var tmp = 0;
            for (var l = 0; l < point.value.length; l++) {
              if (point.value[l].intVal) {
                tmp += point.value[l].intVal;
              } else if (point.value[l].fpVal) {
                tmp += point.value[l].fpVal;
              }
            }

            if (weight && point.value.length > 0) {
              // Average weights
              tmp /= point.value.length;
            }

            total += tmp;
          }

          if (weight) {
            if (data.point.length > 0) {
              total /= data.point.length;

              if (this.config.imperial) {
                total *= 2.20462;
                total = total.toFixed(2);
                total += " lbs";
              } else {
                total = total.toFixed(2);
                total += " kg";
              }
            } else {
              total = undefined;
            }
          }

          value += total;

          elem.innerHTML += value + ((j < bucket.dataset.length - 1) ? ", " : "");
        }

        elem.innerHTML += "<br>";
        wrapper.appendChild(elem);
      }
    } else if (this.code && !this.auth) {
      var elem = document.createElement("span");
      elem.innerHTML = "Please Visit: " + this.code.verification_url + "<br>" + "Code: " + this.code.user_code;
      wrapper.appendChild(elem);
    } else if (this.auth) {
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
    this.sendSocketNotification("UPDATE");
  },

  socketNotificationReceived: function(notification, result) {
    // this.code = undefined;
    // this.result = undefined;

    if (notification === "AUTH_CODE_BODY") {
      this.code = result;
      console.log("code: " + result.user_code)
    } else if (notification === "REFRESH_TOKEN_BODY") {
      this.auth = result;
    } else if (notification === "STATS") {
      this.stats = result;
    }

    console.log(notification);
    console.log(result);
    this.updateDom(500);
  },

});

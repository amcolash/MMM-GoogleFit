"use strict";

Module.register("MMM-GoogleFit", {

  auth: undefined,
  code: undefined,
  defaults: {
    updateInterval: 1800000, // 30 minutes
    imperial: true,
    stepGoal: 10000,
    colors: [
      "#EEEEEE",
      "#1E88E5",
      "#9CCC65",
      "#5E35B1",
      "#FFB300",
      "#F4511E"
    ],
    width: 300,
    fontSize: 18
  },

  clientId: "846766038767-8fs63le8h45dhjpf0umhc1ai07q4rhn7.apps.googleusercontent.com",

  getScripts: function() {
    return [
      this.file("highcharts.js")
    ];
  },

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
      var weights = [];
      var steps = [];
      var dates = [];

      for (var i = 0; i < this.stats.bucket.length; i++) {
        var bucket = this.stats.bucket[i];
        var elem = document.createElement("span");

        dates.push(new Date(Number.parseFloat(bucket.startTimeMillis)).toLocaleDateString());

        for (var j = 0; j < bucket.dataset.length; j++) {
          var data = bucket.dataset[j];

          var weight = false;
          var step = false;

          if (data.dataSourceId.indexOf("weight") != -1) {
            weight = true;
          } else if (data.dataSourceId.indexOf("step_count") != -1) {
            step = true;
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
              }

              total = total.toFixed(0);
            } else {
              total = undefined;
            }

            weights.push(total);
          } else if (step) {
            steps.push(total);
          }
        }
      }

      console.log(weights);
      console.log(steps);
      console.log(dates);

      var totalSize = this.config.width / 7;
      var chartSize = totalSize * 0.6;
      var colors = this.config.colors;

      var series = [];
      for (var i = 0; i < steps.length; i++) {
        var percent = steps[i] / this.config.stepGoal;
        var colorOffset = Math.floor(percent) % colors.length;

        // 5x more than the desired step count is the last color (red) and will stay that way
        if (percent > colors.length - 1) {
          var data = [{
            color: colors[colors.length - 1],
            y: 1,
          }];
        } else {
          percent -= Math.floor(percent);

          var data = [{
            color: colors[colorOffset + 1],
            y: percent,
          },
          {
            color: colors[colorOffset],
            y: 1 - percent
          }];
        }

        series.push({
          type: "pie",
          innerSize: "80%",
          data: data,
          size: chartSize,
          center: [i * totalSize - (totalSize - chartSize) / 2, -(totalSize - chartSize) / 2],
          borderColor: null,
        });
      }
        
      // Create chart canvas
      var chart = document.createElement("div");
      
      Highcharts.chart(chart, {
        title: {
          text: null
        },
        chart: {
          width: this.config.width,
          height: this.config.width / 7,
          backgroundColor: null,
          plotShadow: false,
        },
        plotOptions: {
          pie: {
            dataLabels: {
              enabled: false
            }
          }
        },
        series: series,
        credits: {
          enabled: false
        },
      });
        
      // Append chart
      wrapper.appendChild(chart);

      var labels = document.createElement("div");
      for (var i = 0; i < 7; i++) {
        var label = document.createElement("div");
        var style = "float: left; width: " + (this.config.width / 7) + "px; font-size: " + this.config.fontSize + "px; text-align: center;";
        label.style = style;
        // label.innerHTML = (steps[i] / this.config.stepGoal * 100).toFixed(0) + "%";
        var days = ["S", "M", "T", "W", "T", "F", "S"];
        label.innerHTML = days[i];

        if (weights[i]) {
          label.innerHTML += "<br>" + weights[i]
        }

        labels.appendChild(label);
      }

      wrapper.appendChild(labels);
          
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

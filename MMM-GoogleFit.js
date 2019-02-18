"use strict";

Module.register("MMM-GoogleFit", {

  auth: undefined,
  code: undefined,
  error: undefined,
  defaults: {
    updateInterval: 30, // minutes
    stepGoal: 10000,
    startOnMonday: false,
    lastSevenDays: false,
    reverseOrder: false,
    chartWidth: 300, // px
    chartPadding: 0.2, // percent between 0-1, clamped in code
    innerThickness: 0.8, // how much like a pie chart / doughnut, clamped in code
    fontSize: 18,
    stepCountLabel: false,
    useIcons: true,
    displayWeight: true,
    colors: [
      "#EEEEEE",
      "#1E88E5",
      "#9CCC65",
      "#5E35B1",
      "#FFB300",
      "#F4511E"
    ],
    debug: false
  },

  getScripts: function() {
    return [
      this.file("lib/highcharts.js")
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
      var days = this.stats.days;
      var hasWeights = false;


      if (this.stats.bucket.length !== 7) {
        console.error("Google Fit data fetched does not match 7 days, layout might be incorrect. Data was trimmed.");
        this.stats.bucket = this.stats.bucket.slice(0, 7);
      }

      var numDays = this.stats.bucket.length; // should be 7?

      for (var i = 0; i < this.stats.bucket.length; i++) {
        var bucket = this.stats.bucket[i];

        dates.push(new Date(parseFloat(bucket.startTimeMillis)).toLocaleDateString());

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

              if (config.units === "imperial") {
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

      if (this.config.reverseOrder) {
        weights = weights.reverse();
        steps = steps.reverse();
        dates = dates.reverse();
        days = days.reverse();
      }

      if (this.config.debug) {
        console.log(weights);
        console.log(steps);
        console.log(dates);
        console.log(days);
      }

      var min = 0.1;
      var max = 0.9;
      var t = Math.min(Math.max(this.config.chartPadding, 0), 1);
      var padding = min * (1 - t) + max * t;
      var thickness = Math.min(Math.max(this.config.innerThickness, 0), 1) * 100;

      var totalSize = this.config.chartWidth / numDays;
      var chartSize = totalSize * (1 - padding);
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
          innerSize: thickness + "%",
          data: data,
          size: chartSize,
          center: [i * totalSize + 1, "50%"],
          borderColor: null,
        });
      }

      var chartWrapper = document.createElement("div");
      chartWrapper.style.cssText = "float: right;";

      // Add in walking icon
      if (this.config.useIcons) {
        var label = document.createElement("div");
        label.style.cssText = "float: left; width: " + totalSize + "px; text-align: center; line-height: 0px; padding-top: " + (totalSize / 2 - 10) + "px"; // 10 is 1/2 of 20px tall icon

        var img = document.createElement("img");
        img.src = this.file("icons/icons8-walking-20.png");

        label.appendChild(img);
        chartWrapper.appendChild(label);
      }

      // Create chart canvas
      var chart = document.createElement("div");
      chart.id = "google-fit-chart";
      chart.style.cssText = "float: right;";

      Highcharts.chart(chart, {
        title: {
          text: null
        },
        chart: {
          width: this.config.chartWidth,
          height: totalSize,
          backgroundColor: null,
          plotShadow: false,
          margin: 0
        },
        plotOptions: {
          pie: {
            dataLabels: {
              enabled: false
            },
            states: {
              hover: {
                enabled: false
              }
            }
          }
        },
        series: series,
        credits: {
          enabled: false
        },
        tooltip: {
          enabled: false
        }
      });

      // Append chart
      chartWrapper.appendChild(chart);
      wrapper.appendChild(chartWrapper);

      var clear1 = document.createElement("div");
      clear1.style.cssText = "clear: both;";
      wrapper.appendChild(clear1);

      var labels = document.createElement("div");
      labels.style.cssText = "float: right;";

      for (var i = 0; i < weights.length; i++) {
        hasWeights |= weights[i];
      }

      // Only show the scale icon if there are weights to be shown
      if (hasWeights && this.config.useIcons) {
        var label = document.createElement("div");
        label.style.cssText = "float: left; width: " + totalSize + "px; font-size: " + this.config.fontSize + "px; text-align: center; padding-top: 4px";

        var br = document.createElement("span");
        br.innerHTML = "<br>" + (this.config.stepCountLabel ? "<br>" : "");

        var img = document.createElement("img");
        img.src = this.file("icons/icons8-scale-20.png");

        label.appendChild(br);
        label.appendChild(img);
        labels.appendChild(label);
      }

      for (var i = 0; i < numDays; i++) {
        var label = document.createElement("div");
        label.style.cssText = "float: left; width: " + totalSize + "px; font-size: " + this.config.fontSize + "px; text-align: center;";
        label.innerHTML = days[i];

        if (this.config.stepCountLabel && steps[i] > 0) {
          var s = steps[i] / 1000;
          s = Number(s).toFixed(s < 10 ? 1 : 0);

          label.innerHTML += "<br>" + s + "k";
        }

        if (weights[i]) {
          label.innerHTML += "<br>" + weights[i];
        }

        labels.appendChild(label);
      }

      wrapper.appendChild(labels);

      var clear2 = document.createElement("div");
      clear2.style.cssText = "clear: both;";
      wrapper.appendChild(clear2);

    } else if (this.code && !this.auth) {
      var elem = document.createElement("span");
      elem.innerHTML = "Please Visit: " + this.code.verification_url + "<br>" + "Code: " + this.code.user_code;
      wrapper.appendChild(elem);
    } else if (this.auth) {
      var elem = document.createElement("span");
      elem.innerHTML = "Authenticated, Loading Data...";
      wrapper.appendChild(elem);
    } else {
      var error = document.createElement("span");
      error.innerHTML = "Error Getting Auth<br>" + this.error;
      wrapper.appendChild(error);
    }

    return wrapper;
  },

  scheduleUpdate: function(delay) {
    var nextLoad = this.config.updateInterval * 60 * 1000;
    if (typeof delay !== "undefined" && delay >= 0) {
      nextLoad = delay;
    }

    var self = this;
    setInterval(function() {
      self.getStats();
    }, nextLoad);
  },

  getStats: function () {
    this.sendSocketNotification("UPDATE", this.config);
  },

  capitalize: function (s) {
    s = s.replace(/_/g, " ");
    return s.toLowerCase().replace(/\b./g, function (a) { return a.toUpperCase(); });
  },

  socketNotificationReceived: function(notification, result) {
    if (notification === "AUTH_CODE_BODY") {
      this.code = result;
      if (this.config.debug) {
        console.log("user code: " + result.user_code);
      }
    } else if (notification === "REFRESH_TOKEN_BODY") {
      this.auth = result;
    } else if (notification === "STATS") {
      this.stats = result;
    }

    if (notification.toLowerCase().indexOf("error") !== -1) {
      this.auth = undefined;
      this.stats = undefined;

      this.error = this.capitalize(notification);
    }

    if (this.config.debug) {
      console.log(notification);
      console.log(result);
    }

    this.updateDom(500);
  },

});

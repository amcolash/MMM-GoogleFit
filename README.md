# MMM-GoogleFit
A magic mirror module to grab google fit daily step count and daily weights.

## What it Looks Like
Normal Usage:<br>
![Normal use screenshot](https://raw.githubusercontent.com/amcolash/MMM-GoogleFit/master/screenshots/normal.png)

<br>Colored Rings (each new color means 1x base step count):<br>
![Colored rings screenshot](https://raw.githubusercontent.com/amcolash/MMM-GoogleFit/master/screenshots/colors.png)

<br>NEW - Optional Icons (Now enabled by default)</br>
![Icons screenshot](https://raw.githubusercontent.com/amcolash/MMM-GoogleFit/master/screenshots/icons.png)

<br>Authentication Flow:<br>
![Authentication screenshot](https://raw.githubusercontent.com/amcolash/MMM-GoogleFit/master/screenshots/auth.png)

## Installing
This module is pretty simple to set up. You simply need to clone the module into your modules folder (like other modules).

```
$ cd MagicMirror/modules
$ git clone https://github.com/amcolash/MMM-GoogleFit.git
```

 Then add the following to `MagicMirror/config/config.js` and optionally configure any options [below](#configuration-options).
```
{
    module: 'MMM-GoogleFit',
    position: 'position',
    config: {
        // If desired
    }
},
```

Finally, restart your magic mirror.

You will need to authenticate with google fit for this module to work. Follow the onscreen instructions which should tell you to visit [https://google.com/device](https://google.com/device) and input the code displayed. Simply enter the code and allow the module to access your google fit data. That's it!

## Configuration Options
Below are listed all possible configuration options for this module.

*SOME VALUES HAVE CHANGED SINCE THIS MODULE WAS FIRST PUBLISHED. CHECK YOUR CONFIG.*

Note; If you want to use metric/imperial units for weights (or if they are not what you expect), please set the according units inside of your base `config/config.js` file as listed in the magic mirror instructions [here](https://github.com/MichMich/MagicMirror#configuration).

| Option         | Description                                                                                                                                                                                           |
|----------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| updateInterval | How often to update (in minutes) <br> <b>Possible values</b>: <code>number</code> <br> <b>Default value</b>: 30                                                                                          |
| stepGoal       | How many steps you want to take each day (to fill pie chart) <br> <b>Possible values</b>: <code>number</code><br>Default value</b>: 10000                                                          |
| startOnMonday  | If the calendar view should start on Sunday (default) or Monday. <br> <b>Possible values</b>: <code>boolean</code><br>Default value</b>: `false`                                                          |
| lastSevenDays  | If the calendar view should show the last 7 days or if it should show the current week (default). Note: This setting takes priority over `startOnMonday`. <br> <b>Possible values</b>: <code>boolean</code><br>Default value</b>: `false`                                                          |
| reverseOrder   | Reverses the calendar view ordering - so the last day is on the left instead of the right. <br> <b>Possible values</b>: <code>boolean</code><br>Default value</b>: `false`                                                          |
| displayWeight  | If the module should show weight data. <br> <b>Possible values</b>: <code>boolean</code><br>Default value</b>: `true`                                                          |
| chartWidth     | How wide the chart portion of the module should be (in pixels), excludes icons <br> <b>Possible values</b>: <code>number</code> <br> <b>Default value</b>: 300                                                                               |
| chartPadding   | Percent of available chart width dedicated to padding. If each ring takes 50px and there is 0.2 (percent) padding, then 10px are used for padding, making the chart 40px. <br> <b>Possible values</b>: <code>number (between 0 - 1)</code> <br> <b>Default value</b>: 0.2                                                                               |
| innerThickness | How thick inside gap of the chart rings should be (percent), where 0 = no innner gap and 1 = only gap, no visible chart. <br> <b>Possible values</b>: <code>number (between 0 - 1)</code> <br> <b>Default value</b>: 0.8                                                                               | 
| fontSize       | Font size <br> <b>Possible values</b>: <code>number</code> <br> <b>Default value</b>: 18                                                                                                                 |
| stepCountLabel | Enable step count to be listed below the step rings <br> <b>Possible values</b>: <code>boolean</code> <br> <b>Default value</b>: <code>false</code>                                                                                   |
| useIcons       | Enable icons on the side of the module <br> <b>Possible values</b>: <code>boolean</code> <br> <b>Default value</b>: <code>true</code>                                                                                   |
| colors         | Array of colors for the step counter <br> <b>Possible values</b>: <code>Array[#hexColor]</code> <br> <b>Default value</b>: <code>["#EEEEEE", "#1E88E5", "#9CCC65", "#5E35B1", "#FFB300", "#F4511E"]</code> |
| debug          | Turn on debug mode? <br> <b>Possible values</b>: <code>boolean</code> <br> <b>Default value</b>: <code>false</code>                                                                                   |

## Multiple Instances of the Module
This module _can_ be used multiple times on the mirror (for different users) with some work, however this is not fully supported out of the box. Check out this [github issue](https://github.com/amcolash/MMM-GoogleFit/issues/3) for instructions.

## Libraries Used
This module (like most open source) has some help from others, shoutout to the authors and contributors! Cheers
- Beautiful and responsive charts from [HighCharts](https://www.highcharts.com)
- Icons from the lovely people at [icons8](https://icons8.com)
- Saving a json file (because it is easier) with [jsonfile](https://github.com/jprichardson/node-jsonfile)

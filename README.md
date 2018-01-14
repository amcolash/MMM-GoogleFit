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
| Option         | Description                                                                                                                                                                                           |
|----------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| updateInterval | How often to update (in minutes) <br> <b>Possible values</b>: <code>int</code> <br> <b>Default value</b>: 30                                                                                          |
| imperial       | If weights should be displayed in imperial (lbs) or metric (kg) <br> <b>Possible values</b>: <code>true/false</code> <br>Default value</b>:<code>true</code>                                     |
| stepGoal       | How many steps you want to take each day (to fill pie chart) <br> <b>Possible values</b>: <code>int</code><br>Default value</b>: 10000                                                          |
| chartWidth     | How wide the chart module should be (in pixels), excludes icons <br> <b>Possible values</b>: <code>int</code> <br> <b>Default value</b>: 300                                                                               |
| fontSize       | Font size <br> <b>Possible values</b>: <code>int</code> <br> <b>Default value</b>: 18                                                                                                                 |
| useIcons       | Enable icons on the side of the module <br> <b>Possible values</b>: <code>boolean</code> <br> <b>Default value</b>: <code>true</code>                                                                                   |
| colors         | Array of colors for the step counter <br> <b>Possible values</b>: <code>Array[#hexColor]</code> <br> <b>Default value</b>: <code>["#EEEEEE", "#1E88E5", "#9CCC65", "#5E35B1", "#FFB300", "#F4511E"]</code> |
| debug          | Turn on debug mode? <br> <b>Possible values</b>: <code>boolean</code> <br> <b>Default value</b>: <code>false</code>                                                                                   |

## Libraries Used
This module (like most open source) has some help from others, shoutout to the authors and contributors! Cheers
- Beautiful and responsive charts from [HighCharts](https://www.highcharts.com)
- Saving a simple json file (because it is easier) by [jsonfile](https://github.com/jprichardson/node-jsonfile)
- Icons from the lovely people at [icons8](https://icons8.com)

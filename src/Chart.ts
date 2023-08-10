import am4core, {RoundedRectangle} from "@amcharts/amcharts4/core";
import am4charts, {Series} from "@amcharts/amcharts4/charts";
import am4themes_animated from "@amcharts/amcharts4/themes/animated";
import am4themes_material from "@amcharts/amcharts4/themes/material";

import $ from "jquery";
import {ConfigurationManager} from "./storage/ConfigurationManager";
import {YttDay} from "./storage/YttDay";
import {YttDuration} from "./storage/YttDuration";

const WEIRD_DATA_THRESHOLD = 48 * 60 * 60 * 1000;

const configurationManager = new ConfigurationManager();

function convertDateToObject(date: string): { year: number, day: number } {
    let year;
    let day = 0;
    if (date.length > 4) {
        year = parseFloat(date.toString().substring(date.toString().length - 4));
        day = parseFloat(date.toString().substring(0, date.toString().length - 4));
    } else {
        year = parseFloat(date.toString());
    }
    return {year: year, day: day};
}

function compareConfigDate(day1: string, day2: string) {
    const day1Obj = convertDateToObject(day1);
    const day2Obj = convertDateToObject(day2);
    return day2Obj.year !== day1Obj.year ? (day2Obj.year - day1Obj.year) * 365 : day2Obj.day - day1Obj.day;

}

function dayFromDate(str: string): Date {
    const year = parseFloat(str.substring(str.length - 4));
    const day = parseFloat(str.substring(0, str.length - 4));
    const date = new Date(year, 0);
    date.setDate(day);
    return date;
}

$(async function () {
    am4core.useTheme(am4themes_animated);
    am4core.useTheme(am4themes_material);

    const chartDiv = document.getElementById('chartDiv');
    if (!chartDiv) {
        return;
    }

    const config = await configurationManager.getValues(null);
    const weirdData = [];

    const data = Object.keys(config)
        .filter(configKey => configKey.startsWith('day'))
        .map(configKey => configKey.replace('day', ''))
        .sort(compareConfigDate)
        .map(day => {
            const dayConfig = new YttDay();
            dayConfig.load(config[`day${day}`]);

            const dayData = {
                day: day,
                date: dayFromDate(day),
                watched: dayConfig.real.getAsMilliseconds(),
                opened: dayConfig.total.getAsMilliseconds(),
                count: dayConfig.count,
                ratio: dayConfig.real.getAsMilliseconds() / Math.max(1, Math.max(dayConfig.real.getAsMilliseconds(), dayConfig.total.getAsMilliseconds()))
            };

            if (dayData.watched > WEIRD_DATA_THRESHOLD || dayData.opened > WEIRD_DATA_THRESHOLD) {
                weirdData.push(dayData);
            }
            return dayData;
        });

    function getTotals(list: any[]) {
        let totalWatched = 0;
        let totalOpened = 0;
        let totalCount = 0;
        let totalRatio = 0;
        for (let key in list) {
            if (list.hasOwnProperty(key)) {
                totalWatched += list[key]['watched'];
                totalOpened += list[key]['opened'];
                totalCount += list[key]['count'];
                totalRatio += list[key]['ratio'];
            }
        }
        return {
            watched: totalWatched,
            opened: totalOpened,
            ratio: totalRatio,
            count: totalCount
        };
    }

    function getAverages(data: any[], total: any) {
        const size = Math.max(data.length, 1);
        return {
            watched: total['watched'] / size,
            opened: total['opened'] / size,
            ratio: total['ratio'] / size,
            count: total['count'] / size
        };
    }

    const totals = getTotals(data);
    const average = getAverages(data, totals);

    let chart = am4core.create(chartDiv, am4charts.XYChart);
    chart.colors.step = 2;
    chart.data = data;
    chart.dateFormatter.dateFormat = 'yyyy-MM-dd';
    chart.numberFormatter.numberFormat = '#.###';
    chart.durationFormatter.durationFormat = 'hh\':\'mm\':\'ss';

    chart.exporting.menu = new am4core.ExportMenu();

    let xDateAxis = chart.xAxes.push(new am4charts.DateAxis());
    xDateAxis.showOnInit = false;
    xDateAxis.title.text = 'Date';
    xDateAxis.skipEmptyPeriods = true;
    xDateAxis.dateFormats.setKey('year', 'yyyy');
    xDateAxis.dateFormats.setKey('month', 'MMM yyyy');
    xDateAxis.dateFormats.setKey('week', 'dd MMM yyyy');
    xDateAxis.dateFormats.setKey('day', 'dd MMM');
    xDateAxis.dateFormats.setKey('hour', 'HH:00');
    xDateAxis.dateFormats.setKey('minute', 'HH:mm');
    xDateAxis.dateFormats.setKey('second', 'HH:mm:ss');
    xDateAxis.baseInterval = {
        'timeUnit': 'day',
        'count': 1
    };
    xDateAxis.renderer.axisFills.template.disabled = false;
    xDateAxis.renderer.axisFills.template.fillOpacity = 0.1;
    xDateAxis.renderer.axisFills.template.fill = am4core.color('gray');

    let yDurationAxis = chart.yAxes.push(new am4charts.DurationAxis());
    yDurationAxis.baseUnit = 'millisecond';
    yDurationAxis.title.text = 'Duration';
    yDurationAxis.min = 0;
    yDurationAxis.strictMinMax = true;

    let yCountAxis = chart.yAxes.push(new am4charts.ValueAxis());
    yCountAxis.title.text = 'Count';
    yCountAxis.renderer.opposite = true;
    yCountAxis.renderer.grid.template.disabled = true;
    yCountAxis.maxPrecision = 0;
    yCountAxis.min = 0;
    yCountAxis.strictMinMax = true;

    chart.legend = new am4charts.Legend();
    chart.legend.useDefaultMarker = true;

    const legendContainer = am4core.create('legendDiv', am4core.Container);
    legendContainer.width = am4core.percent(100);
    legendContainer.height = am4core.percent(100);
    chart.legend.parent = legendContainer;

    function resizeLegend() {
        const legendDiv = document.getElementById('legendDiv');
        if (legendDiv) {
            legendDiv.style.height = chart.legend.contentHeight + 'px';
        }
    }

    chart.events.on('datavalidated', resizeLegend);
    chart.events.on('maxsizechanged', resizeLegend);

    let marker = chart.legend.markers.template.children.getIndex(0);
    if (marker) {
        marker.strokeWidth = 2;
        marker.strokeOpacity = 1;
        marker.stroke = am4core.color('#CCCCCC');

        const roundedRectangleMarker = marker as RoundedRectangle;
        if (roundedRectangleMarker) {
            roundedRectangleMarker.cornerRadius(12, 12, 12, 12);
        }
    }

    chart.cursor = new am4charts.XYCursor();
    chart.cursor.xAxis = xDateAxis;

    let seriesWatched = chart.series.push(new am4charts.LineSeries());
    seriesWatched.dataFields.valueY = 'watched';
    seriesWatched.dataFields.dateX = 'date';
    seriesWatched.yAxis = yDurationAxis;
    seriesWatched.minBulletDistance = 20;
    seriesWatched.showOnInit = false;
    seriesWatched.tooltipText = '[bold]{date.formatDate("yyyy-MM-dd")}[/]\nWatched: {watched.formatDuration("hh\'h\' mm\'m\' ss\'s\'")}';

    seriesWatched.name = 'Watched';
    seriesWatched.strokeWidth = 2;
    seriesWatched.stroke = am4core.color('green');
    seriesWatched.fill = am4core.color('green');

    let bulletWatched = seriesWatched.bullets.push(new am4core.Circle());
    bulletWatched.radius = 5;

    let seriesOpened = chart.series.push(new am4charts.LineSeries());
    seriesOpened.dataFields.valueY = 'opened';
    seriesOpened.dataFields.dateX = 'date';
    seriesOpened.yAxis = yDurationAxis;
    seriesOpened.minBulletDistance = 20;
    seriesOpened.showOnInit = false;
    seriesOpened.tooltipText = '[bold]{date.formatDate("yyyy-MM-dd")}[/]\nOpened: {opened.formatDuration("hh\'h\' mm\'m\' ss\'s\'")}';

    seriesOpened.name = 'Opened';
    seriesOpened.strokeWidth = 2;
    seriesOpened.stroke = am4core.color('red');
    seriesOpened.fill = am4core.color('red');

    let bulletOpened = seriesOpened.bullets.push(new am4core.Circle());
    bulletOpened.radius = 5;

    let seriesCount = chart.series.push(new am4charts.LineSeries());
    seriesCount.dataFields.valueY = 'count';
    seriesCount.dataFields.dateX = 'date';
    seriesCount.yAxis = yCountAxis;
    seriesCount.minBulletDistance = 20;
    seriesCount.showOnInit = false;
    seriesCount.tooltipText = '[bold]{date.formatDate("yyyy-MM-dd")}[/]\nCount: {count}';

    seriesCount.name = 'Count';
    seriesCount.strokeWidth = 2;
    seriesCount.stroke = am4core.color('blue');
    seriesCount.fill = am4core.color('blue');

    let bulletCount = seriesCount.bullets.push(new am4core.Circle());
    bulletCount.radius = 5;

    function toggleAxes(ev: any) {
        let axis = ev.target.yAxis;
        let disabled = true;
        axis.series.each(function (series: Series) {
            if (!series.isHiding && !series.isHidden) {
                disabled = false;
            }
        });
        axis.disabled = disabled;
    }

    seriesWatched.events.on('hidden', toggleAxes);
    seriesWatched.events.on('shown', toggleAxes);
    seriesOpened.events.on('hidden', toggleAxes);
    seriesOpened.events.on('shown', toggleAxes);
    seriesCount.events.on('hidden', toggleAxes);
    seriesCount.events.on('shown', toggleAxes);

    chart.scrollbarX = new am4core.Scrollbar();
    chart.scrollbarY = new am4core.Scrollbar();

    xDateAxis.events.on('startchanged', dateAxisChanged);
    xDateAxis.events.on('endchanged', dateAxisChanged);

    function dateAxisChanged(ev: any) {
        const startDate = new Date(ev.target.minZoomed);
        const endDate = new Date(ev.target.maxZoomed);
        const periodData = data.filter(d => {
            return d['date'] >= startDate && d['date'] <= endDate;
        });
        updatePeriodData(periodData);
    }

    chart.events.on('ready', () => {
        let oneWeekAgo = new Date();
        oneWeekAgo.setHours(0);
        oneWeekAgo.setMinutes(0);
        oneWeekAgo.setSeconds(0);
        oneWeekAgo.setMilliseconds(0);
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        xDateAxis.zoomToDates(
            oneWeekAgo,
            new Date(),
            false,
            true
        );
    });

    const todayKey = configurationManager.getTodayKey();
    const configDay = config[todayKey];

    if (configDay) {
        const todayDay = new YttDay();
        todayDay.load(configDay);

        $('#todayWatched').text(todayDay.real.getAsString());
        $('#todayOpened').text(todayDay.total.getAsString());
        $('#todayCount').text(todayDay.count);
    } else {
        $('#todayWatched').text('No data');
        $('#todayOpened').text('No data');
        $('#todayCount').text('No data');
    }

    $('#totalWatched').text(YttDuration.getWatched({milliseconds: totals['watched']}).getAsString());
    $('#totalOpened').text(YttDuration.getOpened({milliseconds: totals['opened']}).getAsString());
    $('#totalCount').text(totals['count']);

    $('#totalAverageWatched').text(YttDuration.getWatched({milliseconds: average['watched']}).getAsString());
    $('#totalAverageOpened').text(YttDuration.getOpened({milliseconds: average['opened']}).getAsString());
    $('#totalAverageCount').text(average['count'].toFixed(2));
    $('#totalAverageRatio').text((100 * average['ratio']).toFixed(2) + '%');

    function updatePeriodData(periodData: any[]) {
        const periodTotal = getTotals(periodData);
        const periodAverage = getAverages(periodData, periodTotal);

        $('#periodWatched').text(YttDuration.getWatched({milliseconds: periodTotal['watched']}).getAsString());
        $('#periodOpened').text(YttDuration.getOpened({milliseconds: periodTotal['opened']}).getAsString());
        $('#periodCount').text(periodTotal['count']);

        $('#periodDays').text(periodData.length);
        $('#periodAverageWatched').text(YttDuration.getWatched({milliseconds: periodAverage['watched']}).getAsString());
        $('#periodAverageOpened').text(YttDuration.getOpened({milliseconds: periodAverage['opened']}).getAsString());
        $('#periodAverageCount').text(periodAverage['count'].toFixed(2));
        $('#periodAverageRatio').text((100 * periodAverage['ratio']).toFixed(2) + '%');
    }

    if (weirdData.length > 0) {
        $('#weird-day-counter').text(weirdData.length);
        $('#weridValueAlert').removeClass('d-none');
    }
});

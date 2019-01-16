$(document).ready(function () {
	//Resize chart to fit height
	const chartHolder = document.getElementById('chartHolder');
	const chartdiv = document.getElementById('chartdiv');
	new ResizeSensor(chartHolder, function () {
		chartdiv.style.height = '' + chartHolder.clientHeight + 'px';
	});

	function getChartColors(theme, handwritten) {
		switch (theme) {
			case 'light':
				return {
					theme: 'light',
					selectedBackgroundColor: '#EFEFEF',
					gridColor: '#FFFFFF',
					color: '#FFFFFF',
					scrollBarBackgroundColor: '#D4D4D4',
					labelColor: '#222222',
					handDrawn: handwritten,
					backgroundColor: '#BBBBBB',
					ratioLineColor: '#196E1F',
					countLineColor: '#DE6231'
				};
			case 'dark':
			default:
				return {
					theme: 'dark',
					selectedBackgroundColor: '#444444',
					gridColor: '#999999',
					color: '#111111',
					scrollBarBackgroundColor: '#666666',
					labelColor: '#000000',
					handDrawn: handwritten,
					backgroundColor: '#777777',
					ratioLineColor: '#196E1F',
					countLineColor: '#214DD1'
				};
		}
	}

	let makeChart = function(){
		YTTGetConfig(null, function (config) {
			YTTApplyThemeCSS(config[YTT_CONFIG_THEME]);
			const chartColors = getChartColors(config[YTT_CONFIG_THEME], config[YTT_CONFIG_HANDDRAWN] === 'true');

			//Get days from config
			const parsedConfig = {};
			let minDate = '19999';
			let maxDate = '0';
			for (const key in config)
				if (config.hasOwnProperty(key) && key.substring(0, 3) === 'day') {
					const day = key.substring(3);
					config[key] = new YTTDay(config[key]);
					if (!parsedConfig[day])
						parsedConfig[day] = {
							R: config[key].getRealDuration(),
							T: config[key].getTotalDuration(),
							C: config[key].getCount()
						};
					if (YTTCompareConfigDate(minDate, day) < 0)
						minDate = day;
					if (YTTCompareConfigDate(maxDate, day) > 0)
						maxDate = day;
				}
			if (YTTCompareConfigDate(maxDate, YTTGetDayConfigKey(new Date()).substr(3)) > 0) {
				maxDate = YTTGetDayConfigKey(new Date()).substr(3);
			}
			//Add missing dates
			let current = minDate;
			let i = 0;
			const getNextConfigDate = function (date) {
				const year = parseFloat(date.substring(date.length - 4));
				const days = parseFloat(date.substring(0, date.length - 4));
				const dateObj = new Date(year, 0);
				dateObj.setDate(days + 1);
				return YTTGetDayConfigKey(dateObj).substr(3);
			};
			while (YTTCompareConfigDate(maxDate, current) < 0 && i < 365 * 10) {
				i++;
				current = getNextConfigDate(current);
				if (!parsedConfig.hasOwnProperty(current))
					parsedConfig[current] = {R: new YTTDuration(YTT_DATA_REAL), T: new YTTDuration(YTT_DATA_TOTAL), C: 0};
			}
			//Reorder dates
			const parsedConfigOrdered = [];
			Object.keys(parsedConfig).sort(function (a, b) {
				return YTTCompareConfigDate(b, a);
			}).forEach(function (key) {
				const conf = parsedConfig[key];
				conf['day'] = key;
				parsedConfigOrdered.push(conf);
			});

			const datas = buildData(parsedConfigOrdered);

			//Build Chart
			function getAverages(list) {
				let totalR = 0;
				let totalT = 0;
				let totalC = 0;
				let totalRatio = 0;
				for (let key in list) {
					if (list.hasOwnProperty(key)) {
						totalR += new YTTDuration('', 0, 0, 0, list[key]['real']).getAsMilliseconds();
						totalT += new YTTDuration('', 0, 0, 0, list[key]['total']).getAsMilliseconds();
						totalC += list[key]['count'];
						totalRatio += list[key]['ratio'];
					}
				}
				return {
					real: totalR / list.length,
					total: totalT / list.length,
					ratio: totalRatio / list.length,
					count: totalC / list.length
				};
			}

			const avgs = getAverages(datas);
			const average = {
				real: new YTTDuration('', avgs['real']),
				total: new YTTDuration('', avgs['total']),
				ratio: avgs['ratio'],
				count: avgs['count']
			};

			const chart = AmCharts.makeChart(chartdiv, {
				type: 'serial',
				theme: chartColors['theme'],
				backgroundAlpha: 1,
				backgroundColor: chartColors['backgroundColor'],
				fillColors: chartColors['backgroundColor'],
				startDuration: 0.6,
				handDrawn: chartColors['handDrawn'],
				legend: {
					equalWidths: false,
					useGraphSettings: true,
					valueAlign: 'left',
					valueWidth: 60,
					backgroundAlpha: 1,
					backgroundColor: chartColors['backgroundColor'],
					fillColors: chartColors['backgroundColor'],
					valueFunction: function (graphDataItem) {
						return graphDataItem && graphDataItem.graph && graphDataItem.graph.valueField && graphDataItem.values && (graphDataItem.values.value || graphDataItem.values.value === 0) ? (
							graphDataItem.graph.valueField === 'ratio' ? (100 * graphDataItem.values.value).toFixed(2) + '%' :
								graphDataItem.graph.valueField === 'count' ? graphDataItem.values.value :
									new YTTDuration('', graphDataItem.values.value).getAsString()
						) : '';
					}
				},
				dataProvider: datas,
				valueAxes: [{
					id: 'durationAxis',
					duration: 'hh',
					durationUnits: {
						DD: 'd',
						hh: 'h ',
						mm: 'min',
						ss: 's'
					},
					guides: [{
						value: average['total'].getAsHours(),
						dashLength: 5,
						above: false,
						label: 'Opened avg.',
						position: 'left',
						lineThickness: 2,
						inside: true
					}, {
						value: average['real'].getAsHours(),
						dashLength: 5,
						above: false,
						label: 'Watched avg.',
						position: 'left',
						lineThickness: 2,
						inside: true
					}],
					axisAlpha: 0.5,
					gridAlpha: 0.2,
					inside: true,
					color: chartColors['labelColor'],
					position: 'right',
					title: 'Duration',
					labelFrequency: 2,
					labelFunction: function (value) {
						return new YTTDuration('', 0, 0, 0, value).getAsString();
					}
				}, {
					id: 'ratioAxis',
					minimum: 0,
					//maximum: 1,
					axisAlpha: 0,
					gridAlpha: 0,
					labelsEnabled: false,
					inside: false,
					position: 'left',
					title: '',
					labelFrequency: 2,
					labelFunction: function (value) {
						return (100 * value).toFixed(2) + '%';
					}
				}, {
					id: 'countAxis',
					minimum: 0,
					axisAlpha: 0,
					gridAlpha: 0,
					labelsEnabled: false,
					inside: false,
					position: 'left',
					title: '',
					labelFrequency: 2,
					labelFunction: function (value) {
						return value;
					}
				}],
				graphs: [{
					bullet: 'circle',
					bulletBorderAlpha: 1,
					bulletBorderThickness: 1,
					dashLengthField: 'dashLength',
					legendValueText: '[[value]]',
					title: 'Opened time',
					fillAlphas: 0.2,
					valueField: 'total',
					valueAxis: 'durationAxis',
					type: 'smoothedLine',
					lineThickness: 2,
					bulletSize: 8,
					balloonFunction: function (graphDataItem) {
						return 'Opened<br>' + YTTGetDateString(graphDataItem.category.getTime()) + '<br><b><span style="font-size:14px;">' + new YTTDuration('', 0, 0, 0, graphDataItem.values.value).getAsString() + '</span></b>';
					}
				}, {
					bullet: 'circle',
					bulletBorderAlpha: 1,
					bulletBorderThickness: 1,
					dashLengthField: 'dashLength',
					legendValueText: '[[value]]',
					title: 'Watched time',
					fillAlphas: 0.2,
					valueField: 'real',
					valueAxis: 'durationAxis',
					type: 'smoothedLine',
					lineThickness: 2,
					bulletSize: 8,
					balloonFunction: function (graphDataItem) {
						return 'Watched<br>' + YTTGetDateString(graphDataItem.category.getTime()) + '<br><b><span style="font-size:14px;">' + new YTTDuration('', 0, 0, 0, graphDataItem.values.value).getAsString() + '</span></b>';
					}
				}, {
					bullet: 'circle',
					bulletAlpha: 0.5,
					bulletBorderAlpha: 0.75,
					bulletBorderThickness: 1,
					dashLengthField: 'dashLength',
					legendValueText: '[[value]]',
					title: 'Ratio',
					fillAlphas: 0,
					valueField: 'ratio',
					valueAxis: 'ratioAxis',
					type: 'smoothedLine',
					lineColor: chartColors['ratioLineColor'],
					lineThickness: 1.5,
					lineAlpha: 0.5,
					bulletSize: 2,
					balloonFunction: function (graphDataItem) {
						return 'Ratio<br>' + YTTGetDateString(graphDataItem.category.getTime()) + '<br><b><span style="font-size:14px;">' + (100 * graphDataItem.values.value).toFixed(2) + '%' + '</span></b>';
					}
				}, {
					bullet: 'circle',
					bulletAlpha: 1,
					bulletBorderAlpha: 1,
					bulletBorderThickness: 1,
					dashLengthField: 'dashLength',
					legendValueText: '[[value]]',
					title: 'Count',
					fillAlphas: 0,
					valueField: 'count',
					valueAxis: 'countAxis',
					type: 'smoothedLine',
					lineColor: chartColors['countLineColor'],
					lineThickness: 2,
					lineAlpha: 0.6,
					bulletSize: 2,
					balloonFunction: function (graphDataItem) {
						return 'Count<br>' + YTTGetDateString(graphDataItem.category.getTime()) + '<br><b><span style="font-size:14px;">' + graphDataItem.values.value + '</span></b>';
					}
				}],
				chartScrollbar: {
					autoGridCount: true,
					scrollbarHeight: 40,
					listeners: [{
						event: 'zoomed',
						method: onChartZoomed
					}],
					selectedBackgroundColor: chartColors['selectedBackgroundColor'],
					gridColor: chartColors['gridColor'],
					color: chartColors['color'],
					backgroundColor: chartColors['scrollBarBackgroundColor']
				},
				chartCursor: {
					categoryBalloonDateFormat: 'YYYY-MM-DD',
					cursorAlpha: 0.1,
					cursorColor: '#000000',
					fullWidth: true,
					valueBalloonsEnabled: true,
					zoomable: true
				},
				dataDateFormat: 'YYYY-MM-DD',
				categoryField: 'date',
				categoryAxis: {
					dateFormats: [{
						period: 'DD',
						format: 'DD'
					}, {
						period: 'WW',
						format: 'MMM DD'
					}, {
						period: 'MM',
						format: 'MMM'
					}, {
						period: 'YYYY',
						format: 'YYYY'
					}],
					minPeriod: 'DD',
					parseDates: true,
					autoGridCount: true,
					axisColor: '#555555',
					gridAlpha: 0.1,
					gridColor: '#FFFFFF'
				},
				export: {
					backgroundColor: chartColors['backgroundColor'],
					enabled: true,
					drawing: {
						enabled: false
					},
					menu: []
				},
				responsive: {
					enabled: true
				}
			});

			zoomChart();

			function updateCurrentInfos(datas) {
				let days = 0;
				let totalRatio = 0;
				let totalOpened = 0;
				let totalWatched = 0;
				let countTotal = 0;
				for (const key in datas) {
					if (datas.hasOwnProperty(key)) {
						const data = datas[key];
						days += 1;
						totalRatio += data['ratio'] || 0;
						totalWatched += data['real'] || 0;
						totalOpened += data['total'] || 0;
						countTotal += data['count'] || 0;
					}
				}
				$('#daysHolderSelect').text(days);
				$('#averageRatioHolderSelect').text((100 * (totalRatio / datas.length)).toFixed(2) + '%');
				$('#averageWatchedHolderSelect').text(new YTTDuration('', 0, 0, 0, totalWatched / datas.length).getAsString());
				$('#averageOpenedHolderSelect').text(new YTTDuration('', 0, 0, 0, totalOpened / datas.length).getAsString());
				$('#averageCountHolderSelect').text((countTotal / datas.length).toFixed(2));
				$('#totalWatchedHolderSelect').text(new YTTDuration('', 0, 0, 0, totalWatched).getAsString());
				$('#totalOpenedHolderSelect').text(new YTTDuration('', 0, 0, 0, totalOpened).getAsString());
				$('#totalCountHolderSelect').text(countTotal);
			}

			function onChartZoomed(event) {
				const datas = [];
				for (const i in event.chart.dataProvider) {
					if (event.chart.dataProvider.hasOwnProperty(i)) {
						const data = event.chart.dataProvider[i];
						const parts = data['date'].split('-');
						const date = new Date(parts[0], parts[1] - 1, parts[2]);
						if (date.getTime() >= event.start && date.getTime() <= event.end) {
							datas.push(data);
						}
					}
				}
				updateCurrentInfos(datas);
			}

			function zoomChart(range) {
				if (!range) {
					range = 7;
				}
				chart.zoomToIndexes(parsedConfigOrdered.length - range, parsedConfigOrdered.length - 1);
				const datas = [];
				const raw = parsedConfigOrdered.slice(parsedConfigOrdered.length - 7, parsedConfigOrdered.length);
				for (const rawItem of raw) {
					const data = {};
					if (rawItem['T'].getAsMilliseconds() === 0) {
						data['ratio'] = 1;
					}
					else {
						data['ratio'] = rawItem['R'].getAsMilliseconds() / rawItem['T'].getAsMilliseconds();
					}
					data['real'] = rawItem['R'].getAsHours();
					data['total'] = rawItem['T'].getAsHours();
					data['count'] = rawItem['C'];
					datas.push(data);
				}
				updateCurrentInfos(datas);
			}

			function dateFromDay(str) {
				const year = parseFloat(str.substring(str.length - 4));
				const day = parseFloat(str.substring(0, str.length - 4));
				const date = new Date(year, 0);
				date.setDate(day);
				return YTTGetDateString(date.getTime());
			}

			function buildData(config) {
				const data = [];
				for (const key in config) {
					if (config.hasOwnProperty(key)) {
						data.push({
							date: dateFromDay(config[key]['day']),
							real: config[key]['R'].getAsHours(),
							total: config[key]['T'].getAsHours(),
							ratio: config[key]['T'].getAsMilliseconds() === 0 ? 1 : config[key]['R'].getAsMilliseconds() / config[key]['T'].getAsMilliseconds(),
							count: config[key]['C']
						});
					}
				}
				return data;
			}

			//Add interactions
			$('#exportJPGButton').click(function () {
				chart.export.capture({}, function () {
					this.toJPG({}, function (base64) {
						YTTDownload(base64, 'YTTExport.png');
					});
				});
			});
			$('#exportPNGButton').click(function () {
				chart.export.capture({}, function () {
					this.toPNG({}, function (base64) {
						YTTDownload(base64, 'YTTExport.png');
					});
				});
			});
			$('#zoomWeekButton').click(function () {
				zoomChart();
			});
			$('#openSharedStats').click(function () {
				window.open('http://yttracker.mrcraftcod.fr/', '_blank');
			});

			const dayKey = YTTGetDayConfigKey();

			$('#averageRatioHolder').text((100 * average['ratio']).toFixed(2) + '%');
			$('#averageWatchedHolder').text(new YTTDuration('', average['real']).getAsString());
			$('#averageOpenedHolder').text(new YTTDuration('', average['total']).getAsString());
			$('#watchedHolder').text(config[dayKey].getRealDuration().getAsString());
			$('#countHolder').text(config[dayKey].getCount());
			$('#versionNumber').text(config[YTT_CONFIG_VERSION] ? config[YTT_CONFIG_VERSION] : 'Unknown');
		});
	};

	if (AmCharts.isReady) {
		makeChart();
	} else {
		AmCharts.ready(makeChart);
	}
});

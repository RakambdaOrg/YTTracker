$(function () {
	$('#backButton').on('click', function () {
		document.location.href = 'chart.html';
	});

	YTTGetConfig(null, function (config) {
		const WEIRD_DATA_THRESHOLD = config[YTT_CONFIG_WEIRD_DATA_THRESHOLD];
		const editDiv = $('#editButtonsDiv');
		let editingVar;
		let editingKind;
		let editingDomElement;

		let startEdit = function(domElement, obj, kind){
			editingDomElement = domElement;
			editingVar = obj;
			editingKind = kind;

			$("#seconds-edit-input").val(obj.conf[kind].seconds);
			$('#minutes-edit-input').val(obj.conf[kind].minutes);
			$('#hours-edit-input').val(obj.conf[kind].hours);
			$('#days-edit-input').val(obj.conf[kind].days);
		};

		$('#edit-form').on("submit", function (e) {
			e.preventDefault();
			const newDur = new YTTDuration(editingKind, 0, parseInt($("#seconds-edit-input").val() || "0, 10"), parseInt($('#minutes-edit-input').val() || "0", 10), parseInt($('#hours-edit-input').val() || "0", 10), parseInt($('#days-edit-input').val() || "0", 10));
			console.log("OK", newDur, editingKind, editingVar.dayStr);

			const newDay = config['day' + editingVar.dayStr] || new YTTDay();
			newDay[editingKind] = newDur;

			const newConf = {};
			newConf['day' + editingVar.dayStr] = newDay;
			console.log(newDay);

			YTTSetConfig(newConf, function () {
				editingDomElement.remove();

				editingDomElement = null;
				editingVar = null;
				editingKind = null;

				$('#modal-time').modal('hide');
			});
		});

		Object.keys(config).filter(k => k.startsWith('day')).map(k => k.replace('day', '')).sort(function (a, b) {
			return YTTCompareConfigDate(b, a);
		}).map(day => {
			return {
				day: YTTGetDateFromDay(day),
				dayStr: day,
				conf: new YTTDay(config['day' + day])
			};
		}).filter(c => c.conf.getWatchedDuration().getAsMilliseconds() > WEIRD_DATA_THRESHOLD || c.conf.getOpenedDuration().getAsMilliseconds() > WEIRD_DATA_THRESHOLD).forEach(obj => {
			let button;
			if(obj.conf.getWatchedDuration().getAsMilliseconds() > WEIRD_DATA_THRESHOLD){
				button = $('<button type="button" class="btn btn-primary btn-block edit-conf-value" data-toggle="modal" data-target="#modal-time">')
					.text("Edit watched time of the " + YTTGetDateString(obj.day.getTime()) + ' (' + obj.conf.getWatchedDuration().getAsString() + ')');
				button.on("click", function (e) {
					startEdit($(this), obj, YTT_DATA_WATCHED);
				});
			}
			if(obj.conf.getOpenedDuration().getAsMilliseconds() > WEIRD_DATA_THRESHOLD){
				button = $('<button type="button" class="btn btn-primary btn-block edit-conf-value" data-toggle="modal" data-target="#modal-time">')
					.text("Edit opened time of the " + YTTGetDateString(obj.day.getTime()) + ' (' + obj.conf.getOpenedDuration().getAsString() + ')');
				button.on("click", function (e) {
					startEdit($(this), obj, YTT_DATA_OPENED);
				});
			}
			$('<div class="row mt-1">').append(button).appendTo(editDiv);
		});
	});


});
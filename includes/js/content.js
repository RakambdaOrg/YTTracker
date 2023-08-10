/**
 * Called when the DOM of the state of the player changes.
 * @param {MutationRecord} mutation The mutation that occured.
 */
function YTTGetChangeState(mutation) {
	const values = mutation.target.textContent.split(YTT_DOM_SPLITTER);
	const event = {};
	event[YTT_STATE_EVENT_STATE_KEY] = values[0];
	event[YTT_STATE_EVENT_TIME_KEY] = values[1];
	event[YTT_STATE_EVENT_VID_KEY] = $(`#${YTT_DOM_PLAYER_INFOS}`).text().split(YTT_DOM_SPLITTER)[0];
	YTTMessage(YTT_STATE_EVENT, event);

	//if (event[YTT_STATE_EVENT_STATE_KEY] === YTT_STATE_EVENT_STATE_KEY_PLAYING) {
	// 		onVideoPlay(event);
	// 	} else if (event[YTT_STATE_EVENT_STATE_KEY] === YTT_STATE_EVENT_STATE_KEY_WATCHED) {
	// 		onVideoStop(event);
	// 	}
}

/**
 * Called when the infos of the video changes.
 * @param {MutationRecord} mutation The mutation that occured.
 */
function YTTGetChangeInfos(mutation) {
	const values = mutation.target.textContent.split(YTT_DOM_SPLITTER);
	const event = {};
	event[YTT_DURATION_EVENT_ID_KEY] = values[0];
	event[YTT_DURATION_EVENT_DURATION_KEY] = values[1];
	YTTMessage(YTT_DURATION_EVENT, event);
}

/**
 * Generates a div to be injected in the DOM.
 * @param {string} id The id of the div element.
 * @param {string} content The content of the div.
 * @return {string} The div element as a string.
 */
function YTTGetInjectDiv(id, content) {
	return `<div id="${id}" style="display: none;">${content}</div>`;
}

/**
 * Inject required elements to track video ID, video duration, player state and current time in the video.
 */
function injectCode() {
	const body = $('body');
	body.append(YTTGetInjectDiv(YTT_DOM_PLAYER_STATE, '0'));
	body.append(YTTGetInjectDiv(YTT_DOM_PLAYER_INFOS, ''));
	body.append(YTTGetInjectDiv(YTT_DOM_PLAYER_TIME_1, '0'));
	body.append(YTTGetInjectDiv(YTT_DOM_PLAYER_TIME_2, '0'));

	$(window).on('beforeunload', () => {
		const event = {};
		event[YTT_STATE_EVENT_STATE_KEY] = YTT_STATE_EVENT_STATE_KEY_WATCHED;
		event[YTT_STATE_EVENT_TIME_KEY] = $(`#${YTT_DOM_PLAYER_TIME_2}`).text();
		event[YTT_STATE_EVENT_VID_KEY] = $(`#${YTT_DOM_PLAYER_INFOS}`).text().split(YTT_DOM_SPLITTER)[0];
		YTTMessage(YTT_STATE_EVENT, event);
		return undefined;
	});

	const yttUtilsInj = document.createElement('script');
	const hookerUtilsInj = document.createElement('script');
	const hookerInj = document.createElement('script');
	const docFrag = document.createDocumentFragment();

	yttUtilsInj.type = 'text/javascript';
	yttUtilsInj.src = YTTGetRuntimeURL('js/YTTUtils.js');

	hookerUtilsInj.type = 'text/javascript';
	hookerUtilsInj.src = YTTGetRuntimeURL('js/hookerUtils.js');

	hookerInj.type = 'text/javascript';
	hookerInj.src = YTTGetRuntimeURL('js/hooker.js');

	docFrag.appendChild(yttUtilsInj);
	docFrag.appendChild(hookerUtilsInj);
	docFrag.appendChild(hookerInj);
	(document.head || document.documentElement).appendChild(docFrag);

	/**
	 *
	 * @param {string} id
	 * @param {function} callback
	 */
	function observeElement(id, callback) {
		const observer = new MutationObserver(mutations => {
			mutations.forEach(callback);
		});
		observer.observe(document.getElementById(id), {
			attributes: false, childList: true, characterData: true, subtree: true
		});
	}

	observeElement(YTT_DOM_PLAYER_STATE, YTTGetChangeState);
	observeElement(YTT_DOM_PLAYER_INFOS, YTTGetChangeInfos);

	YTTLog('Injected player dom');
}

$(() => {
	injectCode();
});
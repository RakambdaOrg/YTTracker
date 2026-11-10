import '@/assets/common.css';
import './popup.css';
import {browser} from 'wxt/browser';
import {byId, showStats} from '@/lib/dom';
import {formatDate} from '@/lib/format';
import {dayKey} from '@/lib/stats';
import {findDay, items} from '@/lib/storage';

byId('openOptions').addEventListener('click', () => {
	void browser.runtime.openOptionsPage();
});

showStats('today', await findDay(dayKey(Date.now())));
showStats('total', await items.total.getValue());
byId('startDate').textContent = formatDate(await items.startTime.getValue());

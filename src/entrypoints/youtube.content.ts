import {defineContentScript} from 'wxt/utils/define-content-script';
import {YOUTUBE_MATCHES} from '@/lib/youtube';

export default defineContentScript({
	matches: YOUTUBE_MATCHES,
	runAt: 'document_start',
	allFrames: true,
	main() {
		// Filled in step 3.
	},
});

import {YttPlayer} from "./hook/YttPlayer";
import {ContentScriptConstants} from "./hook/ContentScriptConstants";
import {TrustedHTML} from "trusted-types/lib";

export class Hooker {
    private RETRY_DELAY = 250;
    private MAX_ATTEMPT = 500;

    private policy: { createHTML: (to_escape: string) => string | TrustedHTML };
    private player?: YttPlayer;

    public constructor() {
        const policyOptions = {createHTML: (to_escape: string) => to_escape};

        if (window.trustedTypes) {
            this.policy = policyOptions;
        } else {
            this.policy = window.trustedTypes.createPolicy('ytTrackerPolicy', policyOptions);
        }
    }

    public hook(attempt: number): void {
        let hooked = false;
        try {
            console.debug('Trying to hook to player');
            let YTTPlayerTemp = document.getElementById('movie_player');
            if (YTTPlayerTemp) {
                hooked = this.setupPlayer(YTTPlayerTemp);
            }
        } catch (ignored) {
        }

        if (hooked) {
            this.updateDom();
        } else if (attempt < this.MAX_ATTEMPT) {
            setTimeout(() => this.hook(attempt + 1), this.RETRY_DELAY);
        }
    }

    private setupPlayer(player: any) {
        if (typeof player !== 'object' || !player.getCurrentTime || !player.getVideoData || !player.getDuration || !player.getPlayerState || !player.addEventListener || !player.removeEventListener) {
            return false;
        }

        console.log('Player hooked');
        this.player = player;

        const player1 = document.getElementById(ContentScriptConstants.PLAYER_TIME_1);
        const player2 = document.getElementById(ContentScriptConstants.PLAYER_TIME_2);
        if (!player1 || !player2) {
            return false;
        }

        player1.innerHTML = this.policy.createHTML(this.player?.getCurrentTime());
        player2.innerHTML = this.policy.createHTML(this.player?.getCurrentTime());

        this.setVideoInfo();
        this.setTimeInfo(player.getPlayerState());

        this.player?.removeEventListener('onStateChange', this.setTimeInfo);
        this.player?.removeEventListener('onApiChange', this.onApiChange);
        this.player?.addEventListener('onStateChange', this.setTimeInfo);
        this.player?.addEventListener('onApiChange', this.onApiChange);
        return true;
    }

    private updateDom(): void {
        setInterval(() => {
            if (this.player && this.player?.getCurrentTime()) {
                const player1 = document.getElementById(ContentScriptConstants.PLAYER_TIME_1);
                const player2 = document.getElementById(ContentScriptConstants.PLAYER_TIME_2);
                if (!player1 || !player2) {
                    return;
                }

                const temp1 = player1.innerHTML;
                const now = this.player.getCurrentTime();

                player2.innerHTML = this.policy.createHTML(temp1);
                player1.innerHTML = this.policy.createHTML(now);
            }
        }, 75);
    }

    private onApiChange() {
        const videoData = this.player?.getVideoData();
        const playerInfo = document.getElementById(ContentScriptConstants.PLAYER_INFO);
        if (!videoData || !playerInfo) {
            return;
        }

        const videoId = videoData['video_id'];
        const previousVideoId = playerInfo.innerHTML.split(ContentScriptConstants.SPLITTER)[0] || '';
        if (videoId !== previousVideoId) {
            this.setTimeInfo(-5);
            this.setVideoInfo();
        }
    }

    private setVideoInfo() {
        const playerInfo = document.getElementById(ContentScriptConstants.PLAYER_INFO);
        if (!this.player || !playerInfo) {
            return;
        }
        playerInfo.innerHTML = this.policy.createHTML(this.player.getVideoData()['video_id'] + ContentScriptConstants.SPLITTER + this.player.getDuration());
    }

    private setTimeInfo(playerStateValue: number) {
        const playerState = document.getElementById(ContentScriptConstants.PLAYER_STATE);
        const player2 = document.getElementById(ContentScriptConstants.PLAYER_TIME_2);
        if (!this.player || !playerState || !player2) {
            return;

        }
        let value: string;
        if (playerStateValue === 1) {
            value = ContentScriptConstants.STATE_KEY_PLAYING + ContentScriptConstants.SPLITTER + this.player.getCurrentTime();
        } else if (playerStateValue === 2 || playerStateValue === 0 || playerStateValue === -5 || playerStateValue === 3) {
            value = ContentScriptConstants.STATE_KEY_WATCHED + ContentScriptConstants.SPLITTER + player2.innerHTML;
        } else {
            value = 'unknown(' + playerState + ')' + ContentScriptConstants.SPLITTER + player2.innerHTML;
        }

        playerState.innerHTML = this.policy.createHTML(value);
    }
}

new Hooker().hook(0);

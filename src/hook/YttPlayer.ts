export interface YttPlayer {
    getCurrentTime: () => any;
    getVideoData: () => any;
    getDuration: () => any;
    getPlayerState: () => any;
    addEventListener: (event: string, callback: any) => void;
    removeEventListener: (event: string, callback: any) => void;
}
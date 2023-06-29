export interface Playlist {
    id: string;
    name: string;
    playbackUrl: string;
    videos: Playlist.Video[];
}

export namespace Playlist {
    export interface List {
        featuredPlaylist?: Playlist;
        playlists: Playlist[];
    }
    export interface Video {
        id: string;
        title: string;
        /**
         * Added Rev 7.53
         */
        ownerFullName: string;
        ownerProfileImageUri: string;
    }

    export interface UpdateAction {
        /**
         * Video Ids to edit in the playlist
         */
        videoId: string;
        /**
         * Action to be taken - Add or Remove.
         */
        action: "Add" | "Remove";
    }
}

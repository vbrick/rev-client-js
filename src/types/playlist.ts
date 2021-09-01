export interface Playlist {
    id: string;
    name: string;
    playbackUrl: string;
    videos: Array<{ id: string; title: string; }>;
}

export namespace Playlist {
    export interface List {
        featuredPlaylist?: Playlist;
        playlists: Playlist[];
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

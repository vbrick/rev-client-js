import { LiteralString } from './rev';
import {Video} from './video';

export interface Playlist {
    id: string;
    name: string;
    playbackUrl: string;
    playlistType?: Playlist.PlaylistTypeEnum;
    videos?: Playlist.Video[];
    playlistDetails?: Video.SearchOptions;
}

export namespace Playlist {
    export type PlaylistTypeEnum = LiteralString<'Static' | 'Dynamic'>

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
    export interface DetailsResponse {
        playlistId: string;
        playlistType: PlaylistTypeEnum;
        playlistDetails: Playlist;
        videos: Video.Details[];
        scrollId?: string;
        totalVideos?: string;
    }
}

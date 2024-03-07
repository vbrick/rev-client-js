import RevClient from "..";
import { Playlist, Rev, Video } from "../types";
import { RateLimitEnum } from "../utils";
import { SearchRequest } from "../utils/request-utils";

function getSummaryFromResponse<T extends Record<string, any>>(response: T, hitsKey: string) {
    const ignoreKeys = ['scrollId', 'statusCode', 'statusDescription'];

    const summary = Object.fromEntries(Object.entries(response)
        .filter(([key, value]) => {
            // don't include arrays or scroll type keys
            return !(key === hitsKey || ignoreKeys.includes(key) || Array.isArray(value));
        }));
    return summary;
}

export class PlaylistDetailsRequest extends SearchRequest<Video.Details> {
    playlist: Playlist = {} as any;
    get playlistName() {
        return this.playlist.name || this.playlist.playlistDetails?.name;
    }
    get dynamicSearchCriteria() {
        return this.playlist?.playlistType === 'Dynamic'
            ? (this.playlist.playlistDetails?.playlistDetails || this.playlist.playlistDetails)
            : undefined;
    }
    constructor(rev: RevClient, playlistId: string, query: { count?: number } = {}, options: Rev.SearchOptions<Video.Details> = {}) {
        const searchDefinition: Rev.SearchDefinition<Video.Details> = {
            endpoint: `/api/v2/playlists/${playlistId}`,
            totalKey: 'totalVideos',
            hitsKey: 'videos',
            // get summary from initial response
            request: async (endpoint, query, options) => {
                await rev.session.queueRequest(RateLimitEnum.SearchVideos);
                const response = await rev.get<Playlist.DetailsResponse>(endpoint, query, options);
                // checking for playlist for possible future compatibility
                Object.assign(this.playlist, getSummaryFromResponse(response, 'videos'));
                return response;
            }
        };
        super(rev, searchDefinition, query, options);
    }
    async getPlaylistInfo() {
        // set maxResults to 0 to mark request as done, since first page of sessions will be lost
        this.options.maxResults = 0;
        // must get first page of results to load summary data
        const {items: videos} = await this.nextPage();

        return {
            ...this.playlist,
            videos,
            playlistName: this.playlistName,
            dynamicSearchCriteria: this.dynamicSearchCriteria
        };
    }
}


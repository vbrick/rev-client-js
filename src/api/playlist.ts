import type { RevClient } from '../rev-client';
import { Rev, Video } from '../types/index';
import type { Playlist } from '../types/playlist';
import { isPlainObject } from '../utils';
import { PlaylistDetailsRequest } from './playlist-details-request';

/** @ignore */
export type API = ReturnType<typeof playlistAPIFactory>;
/**
 * Playlist API methods
 * @category Playlists
 * @group API
 * @see [Playlist API Docs](https://revdocs.vbrick.com/reference/getplaylists)
 */
export interface PlaylistAPI extends API {}

/** @ignore */
export default function playlistAPIFactory(rev: RevClient) {
    const playlistAPI = {
        async create(name: string, videos: string[] | Video.SearchOptions): Promise<string> {
            const isStatic = Array.isArray(videos);
            const payload = isStatic
                ? { name, playlistType: 'Static', videoIds: videos }
                : { name, playlistType: 'Dynamic', playlistDetails: videos };

            const { playlistId } = await rev.post('/api/v2/playlists', payload, { responseType: 'json' });
            return playlistId;
        },
        async details(playlistId: string, query: { count?: number }): Promise<Playlist.DetailsResponse> {
            return rev.get(`/api/v2/playlists/${playlistId}`, query, { responseType: 'json' });
        },
        listVideos(playlistId: string, query: { count?: number }, options?: Rev.SearchOptions<Video.Details>)  {
            return new PlaylistDetailsRequest(rev, playlistId, query, options);
        },
        async update(playlistId: string, actions: Playlist.UpdateAction[] | Video.SearchOptions): Promise<void> {
            const isStatic = Array.isArray(actions);
            const payload = isStatic
                ? { playlistVideoDetails: actions }
                : { playlistDetails: actions };

            return rev.put(`/api/v2/playlists/${playlistId}`, payload);
        },
        async updateFeatured(actions: Playlist.UpdateAction[]): Promise<void> {
            const payload = {
                playlistVideoDetails: actions
            };
            return rev.put(`/api/v2/playlists/featured-playlist`, payload);
        },
        async delete(playlistId: string): Promise<void> {
            return rev.delete(`/api/v2/playlists/${playlistId}`);
        },
        /**
         * get list of playlists in system.
         * NOTE: return type is slightly different than API documentation
         * @see {@link https://revdocs.vbrick.com/reference#getplaylists}
         */
        async list(): Promise<Playlist.List> {
            // ensure raw response is in consistent format
            function parsePlaylist(entry: Record<string, string> & { videos: any; }): Playlist {
                const {
                    id,
                    playlistId,
                    featurePlaylistId,
                    featuredPlaylist,
                    name,
                    playlistName,
                    ...extra
                } = entry;
                return {
                    ...(extra as any),
                    id: id ?? playlistId ?? featurePlaylistId ?? featuredPlaylist,
                    name: name ?? playlistName,
                    videos: entry.videos ?? entry.Videos as any,
                };
            }

            const rawResult = await rev.get('/api/v2/playlists', undefined, { responseType: 'json' });
            // rawResult may return in strange format, so cleanup and return consistent output

            const hasFeatured = !Array.isArray(rawResult);

            const rawPlaylists = hasFeatured
                ? rawResult.playlists
                : rawResult;


            const output: Playlist.List = {
                playlists: rawPlaylists.map(parsePlaylist)
            };

            if (hasFeatured) {
                if (isPlainObject(rawResult.featuredPlaylist)) {
                    output.featuredPlaylist = parsePlaylist(rawResult.featuredPlaylist);
                } else if (Array.isArray(rawResult.videos)) {
                    output.featuredPlaylist = parsePlaylist(rawResult);
                }
            }
            return output;
        }
    };
    return playlistAPI;
}

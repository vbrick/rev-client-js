import type { RevClient } from '../rev-client';
import { Rev, Video } from '../types';
import type { Playlist } from '../types/playlist';
import { isPlainObject } from '../utils';
import { SearchRequest } from '../utils/request-utils';
import { PlaylistDetailsRequest } from './playlist-details-request';

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
            return rev.get(`/api/v2/playlists/${playlistId}`, query);
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
                return {
                    id: entry.id ?? entry.playlistId ?? entry.featurePlaylistId ?? entry.featuredPlaylist,
                    name: entry.name ?? entry.playlistName,
                    playbackUrl: entry.playbackUrl,
                    videos: entry.videos ?? entry.Videos as any
                };
            }

            const rawResult = await rev.get('/api/v2/playlists', { responseType: 'json' });
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

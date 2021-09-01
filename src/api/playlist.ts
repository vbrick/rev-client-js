import type { RevClient } from '../rev-client';
import type { Playlist } from '../types/playlist';
import { isPlainObject } from '../utils';

export default function playlistAPIFactory(rev: RevClient) {
    const playlistAPI = {
        async create(name: string, videoIds: string[]): Promise<string> {
            const payload = {
                name,
                videoIds
            };
            const { playlistId } = await rev.post('/api/v2/playlists', payload, { responseType: 'json' });
            return playlistId;
        },
        async update(playlistId: string, actions: Playlist.UpdateAction[]): Promise<void> {
            const payload = {
                playlistVideoDetails: actions
            };
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

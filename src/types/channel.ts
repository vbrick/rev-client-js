import type { LiteralString } from './rev';

/**
 * @category Channels
 */
export namespace Channel {
    export interface Member {
        id: string;
        type: LiteralString<'User' | 'Group'>;
        roleTypes: LiteralString<'Admin' | 'Contributor' | 'Uploader' | 'Member'>[];
    }
    export interface CreateRequest {
        name: string;
        description?: string;
        members?: Member[]
    }

    export interface SearchHit {
        id: string,
        name: string,
        description: string,
        members: Member[]
    }

    export interface SearchOptions {
        maxResults?: number;
        pageSize?: number;
        start?: number;
        onProgress?: (items: SearchHit[], current: number, total: number) => void;
    }
    export interface  UserListItem {
        channelId: string;
        name: string;
        logoKey: string;
        logoUri: string;
        headerKey: string;
        headerUri: string;
        videoCount: number;
        canEdit: boolean;
        canAssign: boolean;
        defaultSortOrder: LiteralString<'whenUploaded' | 'recommended' | 'title.sort' | 'viewCount'>;
    }
}

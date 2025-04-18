import type { LiteralString } from './rev';


/**
 * @category Channels
*/
export namespace Channel {
    export type SortOrder = LiteralString<'whenUploaded' | 'recommended' | 'title' | 'viewCount'>
    export interface Member {
        id: string;
        type: LiteralString<'User' | 'Group'>;
        roleTypes: LiteralString<'Admin' | 'Contributor' | 'Uploader' | 'Member'>[];
    }
    export interface CreateRequest {
        name: string;
        description?: string;
        members?: Member[];
        /**
         * @default "whenUploaded"
         */
        defaultSortOrder?: Channel.SortOrder;
    }

    export interface SearchHit {
        id: string
        name: string
        description: string | null
        members: Member[]
        defaultSortOrder: Channel.SortOrder
        headerKey: string | null
        headerUri: string | null
        logoKey: string | null
        logoUri: string | null
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
        defaultSortOrder: Channel.SortOrder;
    }
}

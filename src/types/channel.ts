import { LiteralString } from './rev';

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
}

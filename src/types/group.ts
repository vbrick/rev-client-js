import { Role } from './index';

/** @category Users & Groups */
export namespace Group {
    export interface Details {
        groupName: string;
        groupId: string;
        roles: Role[];
    }
    export interface SearchHit {
        name: string;
        id: string;
        entityType: 'Group';
    }

    export interface RawSearchHit {
        Name: string;
        Id: string;
        EntityType: 'Group';
    }

    export interface CreateRequest {
        name: string;
        userIds: string[];
        roleIds: string[];
    }

}

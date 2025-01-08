/**
 * @category Users & Groups
 */
export namespace AccessControl {
    export type EntityType = 'User' | 'Group' | 'Role' | 'Channel';

    export interface Entity {
        id: string;
        name: string;
        type: EntityType;
        canEdit: boolean;
    }

    export type EntitySearchType = Exclude<AccessControl.EntityType, 'Role'>

    export interface SearchHit {
        EntityType: EntitySearchType;
        Id: string;
        Name?: string;
        UserName?: string;
        FirstName?: string;
        LastName?: string;
        Email?: string;
        ProfileImageUri?: string;
    }
}

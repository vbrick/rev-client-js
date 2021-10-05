export namespace AccessControl {
    export type EntityType = 'User' | 'Group' | 'Role' | 'Channel';

    export interface Entity {
        id: string;
        name: string;
        type: EntityType;
        canEdit: boolean;
    }

}

export namespace Group {

    export interface SearchHit {
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

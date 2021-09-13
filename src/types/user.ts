
export interface User {
    userId: string;
    username: string;
    email: string;
    firstname: string;
    lastname: string;
    language: string | null;
    title: string | null;
    phone: string | null;
    groups: { id: string, name: string; }[];
    roles: { id: string, name: string; }[];
    channels: { id: string, name: string; }[];
    profileImageUri: string | null;
}

export namespace User {

    export interface SearchHit {
        userId: string;
        email: string | null;
        entityType: 'User';
        firstname: string;
        lastname: string;
        username: string;
    }

    export interface RawSearchHit {
        Id: string;
        Email: string | null;
        EntityType: 'User';
        FirstName: string;
        LastName: string;
        UserName: string;
    }

    export interface Request {
        username: string;
        email?: string;
        firstname?: string;
        lastname: string;
        title?: string;
        phoneNumber?: string;
        language?: string;
        groupIds?: string[];
        roleIds?: string[];
    }

}

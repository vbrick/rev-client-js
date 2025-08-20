/** @category Administration */
export interface Category {
    categoryId: string;
    name: string;
    fullPath: string;
    parentCategoryId?: string | null;
    restricted?: boolean;
}

/**
 * @category Administration
 */
export namespace Category {
    export type ListItem = Omit<Category, "parentCategoryId">;

    /**
     * @ignore
     * @inline
     */
    interface BaseCategory {
        categoryId: string;
        name: string;
    }

    export interface PolicyItem {
        /**
         * Id of access control entity to give access to
         */
        id: string;
        /**
         * Type of entity (user/group)
         */
        type: "User" | "Group";
        /**
         * Category role. Only managers can edit the category itself, along with its content.
         */
        itemType: "CategoryContributor" | "CategoryManager";
    }

    export interface Details {
        categoryId: string;
        name: string;
        categoryPolicyItems: PolicyItem[] | null;
        parentCategoryId: string | null;
        restricted: boolean;
    }

    export interface EditRequest {
        /**
         * Name of category to add
         */
        name: string;
        /**
         * When true, the category is restricted and only the users/groups in categoryPolicyItems may add or edit content in the category or modify the category itself.
         */
        restricted?: boolean;
        /* Used to add or update the users/groups that may manage restricted categories. */
        categoryPolicyItems?: PolicyItem[];
        /**
         * Id of parent category to add the category as a child category. If specified, the Id needs to exist in Rev.
         */
        parentCategoryId?: string;
    }

    export interface CreateRequest extends EditRequest {}

    /** @inline */
    type Parent = BaseCategory & { parentCategory: null | Parent; };

    export interface CreateResponse extends BaseCategory {
        parentCategory?: null | Parent;
    }

    export interface Assignable {
        id: string;
        name: string;
        fullPath: string;
    }

}

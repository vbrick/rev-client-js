import type { RevClient } from '../rev-client';
import type { Category } from '../types/index';

/** @ignore */
export type API = ReturnType<typeof categoryAPIFactory>;
/**
 * Category API methods
 * @category Administration
 * @group API
 * @see [Category API Docs](https://revdocs.vbrick.com/reference/getcategories)
 */
export interface CategoryAPI extends API {}

/** @ignore */
export default function categoryAPIFactory(rev: RevClient) {
    const categoryAPI = {
        async create(category: Category.CreateRequest): Promise<Category.CreateResponse> {
            return rev.post('/api/v2/categories', category, { responseType: 'json' });
        },
        async details(categoryId: string): Promise<Category.Details> {
            return rev.get(`/api/v2/categories/${categoryId}`, undefined, { responseType: 'json' });
        },
        async update(categoryId: string, category: Category.EditRequest): Promise<void> {
            return rev.put(`/api/v2/categories/${categoryId}`, category);
        },
        async delete(categoryId: string): Promise<void> {
            return rev.delete(`/api/v2/categories/${categoryId}`);
        },
        /**
         * get list of categories in system
         * @see {@link https://revdocs.vbrick.com/reference#getcategories}
         */
        async list(parentCategoryId?: string, includeAllDescendants?: boolean): Promise<Category[]> {
            // only pass parameters if defined
            const payload: Record<string, any> = Object.assign(
                { },
                parentCategoryId && { parentCategoryId },
                includeAllDescendants != undefined && { includeAllDescendants }
            );
            const { categories } = await rev.get('/api/v2/categories', payload, { responseType: 'json' });
            return categories;
        },
        /**
         * get list of categories that current user has ability to add videos to
         */
        async listAssignable(): Promise<Category.Assignable[]> {
            return rev.get('/api/v2/assignable-categories');
        }
    };
    return categoryAPI;
}

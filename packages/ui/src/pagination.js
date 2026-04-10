export const DEFAULT_PAGE_SIZE_OPTIONS = [10, 20, 50];
export function getPaginationConfig(config) {
    return {
        showSizeChanger: true,
        pageSizeOptions: config?.pageSizeOptions ?? [...DEFAULT_PAGE_SIZE_OPTIONS],
    };
}

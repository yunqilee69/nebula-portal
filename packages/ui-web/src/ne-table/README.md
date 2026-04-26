# NeTable

Unified table workspace container for list pages.

- Places toolbar actions above the table body
- Keeps summary and pagination in one shared footer
- Intended for standard search -> action toolbar -> table -> pagination list pages
- Injects default pagination size options `[10, 20, 50]` when the footer uses an antd `Pagination`
- Supports overriding page size candidates through the `pageSizeOptions` prop
- Supports table multi-select through the `rowSelection` prop; default is off, `true` enables checkboxes, and an object enables custom selection behavior

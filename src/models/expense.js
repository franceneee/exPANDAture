/**
 * @typedef {Object} Expense
 *
 * @property {string} id             - UUID
 * @property {string} date           - YYYY-MM-DD (local date)
 * @property {string} monthKey      - YYYY-MM (to facilitate monthly queries)
 * @property {string} description
 * @property {number} amount         - Integer, in cents (2dp)
 * @property {string} currency       - (Default) "SGD", ISO 4217 code
 * @property {string|null} categoryId
 * @property {string} mealType     - "breakfast" | "lunch" | "dinner" | "snack" | "dessert" | "other"
 * @property {string} createdAt      - ISO timestamp
 * @property {string} updatedAt      - ISO timestamp
 */

import Dexie from 'dexie';

export const db = new Dexie('TruckSalesDB');

// Define database schema
db.version(1).stores({
    products: '++id, name, quantity, unit_price, purchase_price',
    clients: '++id, name, address',
    sales: '++id, client_id, total_amount, amount_paid, created_at',
    sale_items: '++id, sale_id, product_id, quantity, price_at_sale, purchase_price_at_sale'
});

// Helper to check if DB is ready (replacing isConfigured)
export const isReady = true;

import dotenv from 'dotenv';
dotenv.config();
const { DATABASE_URL: supabaseUrl = '', DB_API_KEY: supabaseKey = '', } = process.env;
export { supabaseUrl, supabaseKey };
//# sourceMappingURL=config.js.map
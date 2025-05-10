// import { createClient } from '@supabase/supabase-js';

// // Supabase configuration
// const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
// const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// // Supabase configuration validation
// if (!supabaseUrl || !supabaseAnonKey) {
//   console.error('VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set in .env or .env.local');
//   throw new Error('Missing Supabase environment variables');
// }

// // Initialize Supabase client
// const supabase = createClient(supabaseUrl, supabaseAnonKey, {
//   auth: {
//     autoRefreshToken: true,
//     persistSession: true
//   },
//   global: {
//     headers: {
//       'x-application-name': 'stockcount-frontend',
//     },
//   },
// });

// // Test connection in development
// if (import.meta.env.DEV) {
//   (async () => {
//     try {
//       const { error } = await supabase.auth.getSession();
//       if (error) {
//         console.warn('Supabase connection warning:', error.message);
//       } else {
//         console.log('Supabase connection successful');
//       }
//     } catch (err) {
//       console.error('Supabase connection error:', err);
//     }
//   })();
// }

// export default supabase;

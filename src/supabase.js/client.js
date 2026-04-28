import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://hfuyujocsrkgfezknlao.supabase.co'
const supabaseKey = 'sb_publishable_12TE-9AWZ1nig-DeLSxT8g_tOnuDjO9'

export const supabase = createClient(supabaseUrl, supabaseKey)
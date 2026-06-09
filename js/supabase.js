import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

const SUPABASE_URL ="https://txhcyiwmyzllfzeghfxc.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR4aGN5aXdteXpsbGZ6ZWdoZnhjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA5Njg4NDYsImV4cCI6MjA5NjU0NDg0Nn0.N5iahQOBawRZUVOZZWrbHaKBCINOpEvRvrraGiemRGU";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

if (supabase.auth) {
    console.log("Холбогдсон байна!")
    console.log(supabase.auth)
} 
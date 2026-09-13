import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config({ path: ".env" });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY!
);

async function run() {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: "kanishk.y@bitsaa.org",
    password: "kyad10",
  });
  
  if (error) {
    console.error("Error logging in:", error.message);
  } else {
    console.log("SUCCESS! User ID is:", data.user.id);
  }
}
run();

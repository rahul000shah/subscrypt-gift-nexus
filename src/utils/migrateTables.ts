
import { supabase } from "@/integrations/supabase/client";

export const createUserSettingsTable = async (): Promise<void> => {
  try {
    // Check if the table already exists
    const { data: existingTables, error: checkError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'user_settings');

    if (checkError) {
      console.error('Error checking for user_settings table:', checkError);
      return;
    }

    // If the table already exists, no need to create it
    if (existingTables && existingTables.length > 0) {
      console.log('User settings table already exists');
      return;
    }

    // Create the user_settings table using raw SQL
    const { error: createError } = await supabase.rpc('create_user_settings_table');
    
    if (createError) {
      console.error('Error creating user_settings table:', createError);
      return;
    }

    console.log('User settings table created successfully');
  } catch (error) {
    console.error('Failed to create user_settings table:', error);
  }
};

// Run this function when the application initializes to ensure the table exists
createUserSettingsTable();

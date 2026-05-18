import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const { identifier } = await request.json();
    
    if (!identifier) {
      return NextResponse.json({ error: 'Identifier is required' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !serviceRoleKey) {
      return NextResponse.json({ error: 'Server misconfigured: SUPABASE_SERVICE_ROLE_KEY is required to resolve usernames.' }, { status: 500 });
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // We fetch users (admin API lists them, max 1000 per page typically, but this is a simple approach)
    // For large apps, an Edge Function or RPC is strictly better. 
    // Here we query the users via Admin API
    const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers();
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const user = users.find(u => 
      u.user_metadata?.username === identifier || 
      u.user_metadata?.phone === identifier
    );

    if (!user || !user.email) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ email: user.email });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

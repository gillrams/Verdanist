-- Create the push_subscriptions table
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    endpoint TEXT UNIQUE NOT NULL,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Allow users to insert/update their own subscriptions
CREATE POLICY "Users can insert their own subscriptions"
ON public.push_subscriptions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscriptions"
ON public.push_subscriptions FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read their own subscriptions"
ON public.push_subscriptions FOR SELECT
USING (auth.uid() = user_id);

-- Optional: Database Webhook triggers using pg_net (ensure pg_net is enabled on your Supabase project)
-- NOTE: If you are setting up webhooks via the Supabase Dashboard UI, you can skip the below trigger code.
-- It's often easier to configure Webhooks via Dashboard -> Database -> Webhooks -> Add Webhook.

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import webpush from 'npm:web-push'

const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY') || 'BGvyI-g9Fca9_9i3iEy56U5YbHT7unGIRpO1Rj3ZzLEtPKH6uWW9Ppv7uPs-HRJr2EDhZekqNycV6skTP8UMD2w';
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY') || 'Rq7y6mTUCBqMMajDmZ_f7desniDHgieNdTTwR74ag7g';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

webpush.setVapidDetails(
  'mailto:admin@verdanist.id',
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

serve(async (req) => {
  try {
    const body = await req.json();
    console.log('Received webhook payload:', body);

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // We notify ALL users for now, or you can filter by who owns this device
    // Here we just fetch all subscriptions (since this is a single-tenant or demo app)
    const { data: subs, error } = await supabase
      .from('push_subscriptions')
      .select('*');

    if (error) {
      throw new Error(`DB error: ${error.message}`);
    }

    // Determine notification content based on the table that triggered it
    let title = 'Verdanist Alert';
    let message = 'Terjadi perubahan pada sistem Anda.';

    if (body.table === 'device_settings' && body.type === 'UPDATE') {
      const oldTemp = body.old_record.temperature || 0;
      const newTemp = body.record.temperature || 0;
      const thresh = body.record.temp_threshold || 32;

      if (newTemp > thresh && newTemp > oldTemp) {
         title = '🌡️ Suhu Ekstrem';
         message = `Suhu mencapai ${newTemp.toFixed(1)}°C (Batas: ${thresh}°C)`;
      } else {
         // Not an alert condition
         return new Response(JSON.stringify({ status: 'ok', msg: 'No alert needed' }), { status: 200 });
      }
    } else if (body.table === 'device_status' && body.type === 'UPDATE') {
      const oldActive = body.old_record.pump_active || false;
      const newActive = body.record.pump_active || false;
      
      if (oldActive !== newActive) {
         title = newActive ? '💦 Pompa Aktif' : '⏹️ Pompa Mati';
         message = newActive ? 'Sistem misting sedang beroperasi.' : 'Sistem misting telah dimatikan.';
      } else {
         return new Response(JSON.stringify({ status: 'ok', msg: 'No state change' }), { status: 200 });
      }
    }

    console.log(`Sending Push: ${title}`);
    const notificationPayload = JSON.stringify({
      title,
      body: message
    });

    const sendPromises = subs.map(sub => {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth
        }
      };
      return webpush.sendNotification(pushSubscription, notificationPayload)
        .catch(err => {
          console.error('Failed to send push to endpoint:', sub.endpoint, err);
          // Optional: Delete invalid subscription
          if (err.statusCode === 410) {
             supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint).then();
          }
        });
    });

    await Promise.all(sendPromises);

    return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } })
  } catch (error) {
    console.error('Error handling push:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }
})

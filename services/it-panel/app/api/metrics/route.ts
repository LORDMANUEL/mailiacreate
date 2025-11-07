import { NextResponse } from 'next/server';
import { queryPrometheus, rangePrometheus } from '../../../lib/clients';

export async function GET() {
  const smtpQueue = await queryPrometheus('stalwart_smtp_queue_length');
  const jmapLatency = await rangePrometheus(
    'rate(stalwart_jmap_request_duration_seconds_sum[5m]) / rate(stalwart_jmap_request_duration_seconds_count[5m])',
    120
  );
  return NextResponse.json({ smtpQueue, jmapLatency });
}

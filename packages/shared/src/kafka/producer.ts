import { Kafka, Producer } from 'kafkajs';

let producer: Producer | null = null;

export async function getProducer(brokers: string[] = ['kafka:9092']): Promise<Producer> {
  if (producer) return producer;
  const kafka = new Kafka({ clientId: 'microservices-app', brokers });
  producer = kafka.producer();
  await producer.connect();
  console.log('[Kafka] Producer connected');
  return producer;
}

export async function publishEvent(topic: string, event: Record<string, unknown>): Promise<void> {
  const p = await getProducer();
  await p.send({ topic, messages: [{ value: JSON.stringify(event) }] });
  console.log(`[Kafka] Published event to "${topic}"`);
}

export async function disconnectProducer(): Promise<void> {
  if (producer) {
    await producer.disconnect();
    producer = null;
  }
}

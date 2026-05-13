import { Kafka, Consumer, EachMessageHandler } from 'kafkajs';

export async function createConsumer(
  groupId: string,
  topics: string[],
  eachMessage: EachMessageHandler,
  brokers: string[] = ['kafka:9092'],
): Promise<Consumer> {
  const kafka = new Kafka({ clientId: 'microservices-app', brokers });
  const consumer = kafka.consumer({ groupId });
  await consumer.connect();
  for (const topic of topics) {
    await consumer.subscribe({ topic, fromBeginning: true });
  }
  await consumer.run({ eachMessage });
  console.log(`[Kafka] Consumer (${groupId}) listening on: ${topics.join(', ')}`);
  return consumer;
}

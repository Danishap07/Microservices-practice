import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('orders')
export class Order {
  @PrimaryColumn()
  id!: string;

  @Column()
  productId!: string;

  @Column()
  quantity!: number;

  @Column()
  userId!: string;

  @Column('decimal', { precision: 10, scale: 2 })
  totalPrice!: number;

  @Column()
  status!: string;

  @Column()
  createdAt!: string;
}

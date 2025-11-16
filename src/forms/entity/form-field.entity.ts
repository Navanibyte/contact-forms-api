/* eslint-disable prettier/prettier */
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Form } from './form.entity';

@Entity('form_fields')
export class FormField {
    @PrimaryGeneratedColumn()
    field_id: number;

    @ManyToOne(() => Form, (form) => form.fields, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'form_id' })  // this creates form_id automatically
    form: Form;

    @Column()
    userId: number;   // store user ID here

    @Column()
    label: string;

    @Column({ type: 'int', default: 0 })
    field_order: number;

    @Column({ nullable: true })
    placeholder: string;

    @Column({ length: 50 })
    type: string;

    @Column({ type: 'boolean', default: false })
    required: boolean;

    @Column({ type: 'json', nullable: true })
    options: string[];

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    created_at: Date;

    @Column({
        type: 'timestamp',
        default: () => 'CURRENT_TIMESTAMP',
        onUpdate: 'CURRENT_TIMESTAMP',
    })
    updated_at: Date;

    @Column({ type: 'tinyint', default: 1 })
    status: number;
}

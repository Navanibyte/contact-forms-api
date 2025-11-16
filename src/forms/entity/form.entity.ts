/* eslint-disable prettier/prettier */
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { FormField } from './form-field.entity';

@Entity('forms')
export class Form {
    @PrimaryGeneratedColumn()
    form_id: number;

    @Column({ length: 255 })
    title: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({ type: 'text', nullable: true })
    embedded_code: string;

    @Column({ type: 'json', nullable: true })
    styles: Record<string, any>;

    @OneToMany(() => FormField, (field) => field.form, { cascade: true })
    fields: FormField[];

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

    @Column({ type: 'int' })
    userId: number;
}

/* eslint-disable prettier/prettier */
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('form_submissions')
export class FormSubmission {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    form_id: string;

    @Column()
    user_id: number;

    @Column({ type: 'json' })
    submission_json: any;

    @Column({ type: 'longtext', nullable: true })
    html_email: string;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    created_at: Date;
}

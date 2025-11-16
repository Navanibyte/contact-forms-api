/* eslint-disable prettier/prettier */
export class UpdateFormDto {
    title?: string;
    description?: string;
    fields: {
        label: string;
        type: string;
        required: boolean;
        placeholder?: string;
        field_order: number;
        options?: any;
    }[];
}
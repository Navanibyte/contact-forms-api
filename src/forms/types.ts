/* eslint-disable prettier/prettier */
export interface FormStyles {
    container?: {
        backgroundColor?: string;
        backgroundImage?: string;
        maxWidth?: string;
        padding?: string;
        borderRadius?: string;
        boxShadow?: string;
    };
    card?: {
        backgroundColor?: string;
        borderColor?: string;
        borderWidth?: string;
        borderRadius?: string;
        padding?: string;
    };
    title?: {
        fontSize?: string;
        fontWeight?: string;
        color?: string;
        textAlign?: string;
    };
    description?: {
        fontSize?: string;
        color?: string;
        textAlign?: string;
    };
    fields?: {
        labelColor?: string;
        labelFontSize?: string;
        labelFontWeight?: string;
        inputBackgroundColor?: string;
        inputBorderColor?: string;
        inputBorderRadius?: string;
        inputPadding?: string;
        inputFontSize?: string;
    };
    button?: {
        backgroundColor?: string;
        textColor?: string;
        borderRadius?: string;
        padding?: string;
        fontSize?: string;
        fontWeight?: string;
        hoverBackgroundColor?: string;
    };
}

export interface FieldOption {
    id: string;
    label: string;
    value: string;
}

export interface FormField {
    field_id: string;
    type: string;
    label: string;
    placeholder: string | null;
    required: boolean;
    options: FieldOption[] | null;
    position: number;
    width?: 'full' | 'half' | 'third';
}

export interface IFormField {
    field_id: string;
    type: string;
    label: string;
    placeholder: string | null;
    required: boolean;
    options: FieldOption[] | null;
    position: number;
    width?: 'full' | 'half' | 'third';
}
/* eslint-disable prettier/prettier */
export interface IgoogleRequestUser {
    email: string
    firstName: string
    lastName: string
    picture: string
    accessToken: string
    providers: string
    providerId: string
}

export interface IgoogleUserCheck {
    provider: string
    providerId: number
}



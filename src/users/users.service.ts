/* eslint-disable prettier/prettier */
import { Injectable } from "@nestjs/common";
import { User } from "./entity/users.entity";
import { Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";

@Injectable()
export class UsersService {

    constructor(
        @InjectRepository(User)
        private repo: Repository<User>) { }

    // eslint-disable-next-line @typescript-eslint/require-await
    async findUserByName(email: string) {
        return this.repo.findOne({ where: { email } });
    }

    async create(data: Partial<User>) {
        const user = this.repo.create(data);
        return this.repo.save(user);
    }
}
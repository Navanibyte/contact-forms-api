/* eslint-disable prettier/prettier */
import { Module } from "@nestjs/common";
import { UsersService } from "./users.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "./entity/users.entity";

@Module({
    providers: [UsersService],
    exports: [UsersService],
    imports: [TypeOrmModule.forFeature([User])],
})

export class UsersModule { }
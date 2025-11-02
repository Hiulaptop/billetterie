import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDto } from "../auth/dto/create-user.dto";
import * as bcrypt from 'bcrypt';
import { User } from "./entities/user.entity";

@Injectable()
export class UserService {
    constructor(
        @InjectRepository(User)
        private usersRepository: Repository<User>,
        // private readonly userService: UserService
    ) {}


    async create(createUserDto: CreateUserDto): Promise<any> {
        const existingUser = await this.findOneByUsername(createUserDto.username);

        if (existingUser) {
            throw new ConflictException('Username already exists');
        }

        const newUser = this.usersRepository.create(createUserDto);
        return this.usersRepository.save(newUser);
    }

    async findOneByUsername(username: string): Promise<User | undefined> {
        const user = await this.usersRepository.findOne({
            where: {username: username},
            select: ['id', 'username', 'password', 'role'],
        })
        if (!user) {
            return undefined;
        }
        return user;
    }

    async findOneById(id: number): Promise<User | undefined> {
        const user = await this.usersRepository.findOne({
            where: {id: id},
            select: ['id', 'username', 'password', 'role'],
        })
        if (!user) {
            return undefined;
        }
        return user;
    }
}
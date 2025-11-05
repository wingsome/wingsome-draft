import { Injectable, NotFoundException } from '@nestjs/common';
import { ProfileUser } from './entity/profile-user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateProfileUserDto } from './dto/create-profile-user.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(ProfileUser)
    private readonly profileUserRepository: Repository<ProfileUser>
  ) {}

  create(request: CreateProfileUserDto) {
    return 'This action adds a new user';
  }

  findAll() {
    return `This action returns all user`;
  }
  
  async findOne(id: number): Promise<ProfileUser> {
    const user = await this.profileUserRepository.findOne({ where: { id } });

    if (!user) throw new NotFoundException(`User with id ${id} not found`);

    return user;
  }

  // update(id: number, updateUserDto: UpdateUserDto) {
  //   return `This action updates a #${id} user`;
  // }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}

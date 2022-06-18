import * as crypto from 'crypto';
import { GroupEntity } from '../../../domain/entities/group';
import { DomainError } from '../../../domain/errors/domain.error';
import { GroupRepository, UserRepository } from '../../../domain/repositories';

export type CreateGroupUseCaseProps = {
  name: string;
  description: string;
  ownerId: string;
  usersIds: string[];
};

export class CreateGroupUseCase {
  constructor(
    private readonly groupRepository: GroupRepository,
    private readonly userRepository: UserRepository,
  ) {}

  async execute(
    createGroupUsecaseProps: CreateGroupUseCaseProps,
  ): Promise<GroupEntity> {
    try {
      const { name, description, ownerId, usersIds } = createGroupUsecaseProps;
      const id = crypto.randomUUID();
      const owner = await this.userRepository.findOneById(ownerId);
      if (!owner) {
        throw new DomainError.MissingGroupOwner();
      }
      const users = await this.userRepository.findUserListByIdList(usersIds);
      const group = GroupEntity.create({
        id,
        name,
        description,
        owner,
        users,
      });
      await this.groupRepository.insert(group);

      return group;
    } catch (err) {
      if (err instanceof DomainError.MissingGroupOwner) {
        throw err;
      }
      throw new DomainError.Unexpected();
    }
  }
}
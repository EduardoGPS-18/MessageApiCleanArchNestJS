import * as crypto from 'crypto';

import { UserEntity } from '../../../domain/entities';
import { DomainError } from '../../../domain/errors/domain.error';
import { UserRepository } from '../../../domain/repositories';
import { Hasher, SessionHandler } from '../../protocols';

export type AddUserProps = {
  name: string;
  email: string;
  rawPassword: string;
};

export abstract class AddUserUseCaseI {
  abstract execute(props: AddUserProps): Promise<UserEntity>;
}

export class AddUserUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly hasher: Hasher,
    private readonly sessionHandler: SessionHandler,
  ) {}

  async execute(props: AddUserProps): Promise<UserEntity> {
    try {
      const { name, email, rawPassword } = props;
      const userWithSameEmail = await this.userRepository.findOneByEmail(email);
      if (userWithSameEmail !== null) {
        throw new DomainError.CredentialsAlreadyInUse();
      }

      const id = crypto.randomUUID();
      const session = this.sessionHandler.generateSession({
        id,
        email,
      });
      const password = await this.hasher.hash(rawPassword);
      const user = UserEntity.create({ id, email, name, password, session });
      await this.userRepository.insert(user);
      return user;
    } catch (err) {
      if (err instanceof DomainError.CredentialsAlreadyInUse) {
        throw err;
      }
      throw new DomainError.Unexpected();
    }
  }
}
